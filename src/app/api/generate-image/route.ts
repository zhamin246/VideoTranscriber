import { NextRequest, NextResponse } from 'next/server';
import { getUserUuid } from '@/services/user';
import { getUserCredits, decreaseCredits, increaseCredits, CreditsTransType } from '@/services/credit';
import { newStorage } from '@/lib/storage';
import { getUuid } from '@/lib/hash';
import { creditEvents } from '@/lib/events';
import { getOneYearLaterTimestr } from '@/lib/time';
import { createGenerationRecord, updateGenerationRecord } from '@/models/generation-record';

export async function POST(request: NextRequest) {
  let generationRecord = null; // 在函数开始处声明
  let userUuid = null; // 添加 userUuid 声明
  
  try {
    console.log('=== API 开始处理请求 ===');
    
    userUuid = await getUserUuid(); // 赋值而不是声明
    if (!userUuid) {
      console.log('❌ 用户未认证');
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    console.log('✅ 用户认证成功:', userUuid);

    const { image, prompt, size, model, creditsUsed = 0 } = await request.json(); // 添加creditsUsed参数
    console.log(' 请求参数:', { prompt, size, model, hasImage: !!image });

    if (!prompt || !size || !model) {
      console.log('❌ 缺少必需参数');
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 创建生成记录（状态为 processing）
    const generationType = image ? 'image_to_image' : 'text_to_image';
    generationRecord = await createGenerationRecord({
      user_uuid: userUuid,
      type: generationType,
      prompt: prompt,
      status: 'processing',
      credits_used: creditsUsed // 使用传递的积分数量
    });

    let imageUrl = null;

    // 如果有图片，上传到 R2
    if (image) {
      console.log('📤 开始上传图片到 R2...');
      const storage = newStorage();
      const batch = getUuid();
      const filename = `nano_banana_input_${batch}.png`;
      const key = `text-to-image/${filename}`;
      
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
      imageUrl = uploadResult.url;
    }

    console.log('🔧 环境变量检查:');
    console.log('- REPLICATE_API_TOKEN 存在:', !!process.env.REPLICATE_API_TOKEN);
    console.log('- TOKEN 长度:', process.env.REPLICATE_API_TOKEN?.length);

    // 构建请求体 - 根据是否有图片来构建不同的请求
    const requestBody = {
      input: {
        prompt: prompt,
        image_input: imageUrl ? [imageUrl] : [] // 如果有图片URL，添加到image_input中
      }
    };
    console.log('📤 发送给 Replicate 的请求体:', JSON.stringify(requestBody, null, 2));

    // 使用正确的 Nano Banana API 调用方式
    console.log(' 开始调用 Replicate API...');
    const replicateResponse = await fetch('https://api.replicate.com/v1/models/google/nano-banana/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify(requestBody)
    });

    console.log(' Replicate API 响应状态:', replicateResponse.status);
    console.log('📡 Replicate API 响应头:', Object.fromEntries(replicateResponse.headers.entries()));

    if (!replicateResponse.ok) {
      const errorData = await replicateResponse.json();
      console.error('❌ Replicate API 错误:', JSON.stringify(errorData, null, 2));
      
      // 更新生成记录为失败状态
      await updateGenerationRecord(generationRecord.uuid, {
        status: 'failed',
        error_message: errorData.detail || 'Image generation failed'
      });
      
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
    }

    const result = await replicateResponse.json();
    console.log('✅ Replicate API 响应成功');
    console.log(' 完整响应数据:', JSON.stringify(result, null, 2));
    
    // 详细分析响应结构
    console.log('🔍 响应数据分析:');
    console.log('- result 类型:', typeof result);
    console.log('- result 键:', Object.keys(result));
    console.log('- result.output 存在:', !!result.output);
    console.log('- result.output 类型:', typeof result.output);
    console.log('- result.output 长度:', result.output?.length);
    
    if (result.output) {
      console.log('- result.output 内容:', result.output);
      // 检查是否是数组
      if (Array.isArray(result.output)) {
        console.log('- result.output[0] 存在:', !!result.output[0]);
        console.log('- result.output[0] 类型:', typeof result.output[0]);
        console.log('- result.output[0] 值:', result.output[0]);
      } else {
        console.log('- result.output 是字符串，直接使用');
      }
    }

    if (!result.output) {
      console.error('❌ 没有输出数据');
      
      // 更新生成记录为失败状态
      await updateGenerationRecord(generationRecord.uuid, {
        status: 'failed',
        error_message: 'No image generated'
      });
      
      return NextResponse.json({ error: 'No image generated' }, { status: 500 });
    }

    // 根据 output 的类型处理
    let finalImageUrl;
    if (Array.isArray(result.output)) {
      if (result.output.length === 0) {
        console.error('❌ output 数组为空');
        
        // 更新生成记录为失败状态
        await updateGenerationRecord(generationRecord.uuid, {
          status: 'failed',
          error_message: 'No image generated'
        });
        
        return NextResponse.json({ error: 'No image generated' }, { status: 500 });
      }
      finalImageUrl = result.output[0];
    } else {
      // output 是字符串，直接使用
      finalImageUrl = result.output;
    }

    // 更新生成记录为完成状态
    await updateGenerationRecord(generationRecord.uuid, {
      status: 'completed',
      result_url: finalImageUrl
    });

    console.log('🎉 最终图片 URL:', finalImageUrl);
    console.log('=== API 处理完成 ===');

    return NextResponse.json({
      imageUrl: finalImageUrl
    });

  } catch (error) {
    console.error('💥 API 处理异常:', error);
    
    // 生成失败，返还积分
    if (generationRecord && userUuid) {
      try {
        await increaseCredits({
          user_uuid: userUuid,
          trans_type: CreditsTransType.SystemRefund,
          credits: generationRecord.credits_used
        });
        creditEvents.emit('creditsUpdated');
      } catch (refundError) {
        console.error('Failed to refund credits:', refundError);
      }
    }
    
    if (error instanceof Error) {
      console.error('💥 错误堆栈:', error.stack);
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

