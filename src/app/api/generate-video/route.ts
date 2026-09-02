import { NextRequest, NextResponse } from 'next/server';
import { Veo3FastService } from '@/services/veo3fast';
import { getUserUuid } from '@/services/user';
import { getUserCredits, decreaseCredits, increaseCredits, CreditsTransType } from '@/services/credit';
import { newStorage } from '@/lib/storage';
import { getUuid } from '@/lib/hash';
import { creditEvents } from '@/lib/events';
import { getOneYearLaterTimestr } from '@/lib/time';
import { createGenerationRecord, updateGenerationRecord } from '@/models/generation-record';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

// 调用 Replicate API 生成视频 (Seedance模型)
async function generateVideoWithSeedance(imageUrl: string | null, prompt: string, duration: number, resolution: string) {
  console.log('Calling Replicate API with Seedance model:', {
    imageUrl,
    prompt: prompt.substring(0, 100) + '...',
    duration,
    resolution: resolution.toLowerCase()
  });

  const input: any = {
    prompt: prompt,
    duration: duration,
    resolution: resolution.toLowerCase()
  };

  // 如果有图片，添加到输入中
  if (imageUrl) {
    input.image = imageUrl;
  }

  const response = await fetch('https://api.replicate.com/v1/models/bytedance/seedance-1-lite/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait',
    },
    body: JSON.stringify({
      input: input
    })
  });

  console.log('Replicate API response status:', response.status);

  if (!response.ok) {
    const error = await response.json();
    console.error('Replicate API error:', error);
    throw new Error(error.detail || `Replicate API failed with status ${response.status}`);
  }

  const result = await response.json();
  console.log('Replicate API result:', result);
  return result;
}

export async function POST(request: NextRequest) {
  let generationRecord = null;
  let userUuid = null;

  try {
    const body = await request.json();
    const { 
      image, // 改为可选参数
      prompt, 
      duration = 8,
      resolution = "720p",
      aspectRatio = "16:9",
      audio = true,
      promptRewriting = true,
      model = "veo-3", // 添加模型参数
      creditsUsed = 0 // 添加这个参数
    } = body;

    // 验证必需参数 - 只要求 prompt
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // 获取用户信息
    userUuid = await getUserUuid();
    if (!userUuid) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // 创建生成记录（状态为 processing）
    const generationType = image ? 'image_to_video' : 'text_to_video';
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
      const storage = newStorage();
      const batch = getUuid();
      const filename = `veo3fast_input_${batch}.png`;
      const key = `image-to-video/${filename}`;
      
      // 将 base64 转换为 Buffer
      const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      const uploadResult = await storage.uploadFile({
        body: imageBuffer,
        key,
        contentType: 'image/png',
        disposition: 'inline',
      });

      console.log('Image uploaded to R2:', uploadResult.url);
      imageUrl = uploadResult.url;
    }

    let result;

    if (model === "seedance-1-lite") {
      // 使用 Seedance 模型生成视频
      if (!REPLICATE_API_TOKEN) {
        return NextResponse.json({ error: 'Replicate API token not configured' }, { status: 500 });
      }
      
      const seedanceResult = await generateVideoWithSeedance(imageUrl, prompt, duration, resolution);
      
      if (!seedanceResult.output) {
        throw new Error('No output from Seedance API');
      }
      
      result = {
        success: true,
        videoUrl: seedanceResult.output
      };
    } else {
      // 使用 Veo3Fast 生成视频
      const veo3FastService = new Veo3FastService();
      result = await veo3FastService.generateVideo({
        ...(imageUrl && { imageUrl }), // 只有在有图片时才传递 imageUrl
        prompt,
        duration,
        resolution,
        aspectRatio,
        audio,
        promptRewriting
      });
    }

    if (!result.success) {
      // 生成失败，返还积分
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
      
      // 更新生成记录为失败状态
      await updateGenerationRecord(generationRecord.uuid, {
        status: 'failed',
        error_message: result.error || 'Video generation failed'
      });
      
      return NextResponse.json(
        { error: result.error || 'Video generation failed' },
        { status: 500 }
      );
    }

    // 更新生成记录为完成状态
    await updateGenerationRecord(generationRecord.uuid, {
      status: 'completed',
      result_url: result.videoUrl
    });

    // 触发积分更新事件
    creditEvents.emit('creditsUpdated');

    // 重新获取用户积分
    const updatedUserCredits = await getUserCredits(userUuid);

    return NextResponse.json({
      success: true,
      videoUrl: result.videoUrl,
      remainingCredits: updatedUserCredits.left_credits
    });

  } catch (error) {
    console.error('Video generation error:', error);
    
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
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
