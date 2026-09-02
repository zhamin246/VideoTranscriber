import { NextRequest, NextResponse } from 'next/server';
import { newStorage } from '@/lib/storage';
import { getUuid } from '@/lib/hash';
import { getUserUuid } from '@/services/user';
import { getUserCredits, decreaseCredits, CreditsTransType } from '@/services/credit';
import { createGenerationRecord, updateGenerationRecord } from '@/models/generation-record';
import { creditEvents } from '@/lib/events';

export async function POST(request: NextRequest) {
  try {
    const { image, imageUrl, prompt } = await request.json();
    
    if (!image && !imageUrl) {
      return NextResponse.json({ error: 'Missing required parameters: image or imageUrl' }, { status: 400 });
    }

    // 检查用户认证状态 - 必须登录
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return NextResponse.json({ 
        error: 'User not authenticated. Please sign in to use this feature.',
        errorType: 'unauthorized'
      }, { status: 401 });
    }

    // 检查积分是否足够
    const userCredits = await getUserCredits(userUuid);
    if (userCredits.left_credits < 1) {
      return NextResponse.json({ 
        error: 'Créditos insuficientes. Por favor, recarregue seus créditos.',
        errorType: 'insufficient_credits'
      }, { status: 403 });
    }

    // 创建生成记录（状态为 processing）
    const generationRecord = await createGenerationRecord({
      user_uuid: userUuid,
      type: 'image_enhancement',
      prompt: prompt || 'Restore image',
      status: 'processing',
      credits_used: 1
    });

    console.log('📤 开始处理图片修复请求:', { hasImageUrl: !!imageUrl, hasPrompt: !!prompt });

    // 如果提供了 imageUrl，直接使用；否则上传 base64 图片到 R2
    let finalImageUrl: string;
    
    if (imageUrl) {
      // 如果已经提供了 R2 URL，直接使用
      console.log('✅ 使用已上传的图片 URL:', imageUrl);
      finalImageUrl = imageUrl;
    } else if (image) {
      // 如果没有提供 URL，上传 base64 图片到 R2
      console.log('📤 上传 base64 图片到 R2...');
      const storage = newStorage();
      const batch = getUuid();
      const filename = `restore_input_${batch}.png`;
      const key = `image-restore/${filename}`;
      
      // 将 base64 转换为 Buffer
      const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      const uploadResult = await storage.uploadFile({
        body: imageBuffer,
        key,
        contentType: 'image/png',
        disposition: 'inline',
      });

      console.log('✅ 图片上传到 R2 成功:', uploadResult.url);
      finalImageUrl = uploadResult.url;
    } else {
      return NextResponse.json({ error: 'Either image or imageUrl must be provided' }, { status: 400 });
    }

    // 构建 Replicate API 请求体 - 使用 flux-kontext-apps/restore-image
    // 根据 API 文档，只需要 input_image 参数
    const requestBody: any = {
      input: {
        input_image: finalImageUrl,
      }
    };

    console.log('📤 发送给 Replicate 的请求体:', JSON.stringify(requestBody, null, 2));

    // 调用 Replicate API - flux-kontext-apps/restore-image
    const replicateResponse = await fetch('https://api.replicate.com/v1/models/flux-kontext-apps/restore-image/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📡 Replicate API 响应状态:', replicateResponse.status);

    if (!replicateResponse.ok) {
      const errorData = await replicateResponse.json();
      console.error('❌ Replicate API 错误:', JSON.stringify(errorData, null, 2));
      
      // 更新生成记录为失败状态
      const errorMessage = errorData.detail || errorData.error || JSON.stringify(errorData);
      await updateGenerationRecord(generationRecord.uuid, {
        status: 'failed',
        error_message: errorMessage
      });
      
      // 检查是否是内存不足错误
      if (errorMessage.includes('CUDA out of memory') || errorMessage.includes('OutOfMemoryError')) {
        return NextResponse.json({ 
          error: 'GPU内存不足。请稍后重试。',
          errorType: 'memory'
        }, { status: 500 });
      }
      
      // 检查是否是图片尺寸过大错误
      if (errorMessage.includes('greater than the max size') || errorMessage.includes('total number of pixels')) {
        return NextResponse.json({ 
          error: '图片尺寸过大。请使用较小的图片重试。',
          errorType: 'image_too_large'
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: errorMessage || 'Image restoration failed',
        errorType: 'api'
      }, { status: 500 });
    }

    const result = await replicateResponse.json();
    console.log('✅ Replicate API 响应成功');
    console.log('📊 完整响应:', JSON.stringify(result, null, 2));

    // 检查是否有错误状态
    if (result.status === 'failed' || result.error) {
      const errorMsg = result.error || 'Image restoration failed';
      console.error('❌ Replicate 处理失败:', errorMsg);
      
      // 更新生成记录为失败状态
      await updateGenerationRecord(generationRecord.uuid, {
        status: 'failed',
        error_message: errorMsg
      });
      
      // 检查是否是内存不足错误
      if (errorMsg.includes('CUDA out of memory') || errorMsg.includes('OutOfMemoryError')) {
        return NextResponse.json({ 
          error: 'GPU内存不足。请稍后重试。',
          errorType: 'memory'
        }, { status: 500 });
      }
      
      // 检查是否是图片尺寸过大错误
      if (errorMsg.includes('greater than the max size') || errorMsg.includes('total number of pixels')) {
        return NextResponse.json({ 
          error: '图片尺寸过大。请使用较小的图片重试。',
          errorType: 'image_too_large'
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: errorMsg,
        errorType: 'processing'
      }, { status: 500 });
    }

    if (!result.output) {
      console.error('❌ 没有输出数据');
      console.error('❌ 完整响应数据:', JSON.stringify(result, null, 2));
      
      // 更新生成记录为失败状态
      await updateGenerationRecord(generationRecord.uuid, {
        status: 'failed',
        error_message: 'No image generated'
      });
      
      return NextResponse.json({ 
        error: 'No image generated. Please try again.',
        errorType: 'no_output'
      }, { status: 500 });
    }

    // result.output 应该是一个 URL 字符串或数组
    let restoredImageUrl: string;
    if (Array.isArray(result.output)) {
      restoredImageUrl = result.output[0];
    } else {
      restoredImageUrl = result.output;
    }

    console.log('🎉 修复后的图片 URL:', restoredImageUrl);

    // 扣除积分并更新生成记录
    try {
      // 扣除1积分
      await decreaseCredits({
        user_uuid: userUuid,
        trans_type: CreditsTransType.IMAGE_GENERATION,
        credits: 1
      });

      // 更新生成记录为完成状态
      await updateGenerationRecord(generationRecord.uuid, {
        status: 'completed',
        result_url: restoredImageUrl
      });

      // 触发积分更新事件
      creditEvents.emit('creditsUpdated');

      // 重新获取用户积分
      const updatedUserCredits = await getUserCredits(userUuid);

      return NextResponse.json({
        imageUrl: restoredImageUrl,
        remainingCredits: updatedUserCredits.left_credits
      });
    } catch (error) {
      console.error('❌ 扣除积分失败:', error);
      // 如果扣除积分失败，更新生成记录为失败状态
      await updateGenerationRecord(generationRecord.uuid, {
        status: 'failed',
        error_message: 'Failed to deduct credits'
      });
      throw error;
    }

  } catch (error) {
    console.error('💥 API 处理异常:', error);
    if (error instanceof Error) {
      console.error('💥 错误堆栈:', error.stack);
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

