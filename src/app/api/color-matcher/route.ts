import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { input_image, reference_image } = await request.json();
    
    if (!input_image || !reference_image) {
      return NextResponse.json({ 
        error: 'Missing required parameters: input_image and reference_image' 
      }, { status: 400 });
    }

    console.log('📤 开始调用 Color Matcher API:', { input_image, reference_image });

    // 构建 Replicate API 请求体
    const requestBody = {
      input: {
        input_image: input_image,
        reference_image: reference_image,
      }
    };

    console.log('📤 发送给 Replicate 的请求体:', JSON.stringify(requestBody, null, 2));

    // 调用 Replicate API - fofr/color-matcher
    const replicateResponse = await fetch('https://api.replicate.com/v1/models/fofr/color-matcher/predictions', {
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
      
      const errorMessage = errorData.detail || errorData.error || JSON.stringify(errorData);
      
      return NextResponse.json({ 
        error: errorMessage || 'Color matching failed',
        errorType: 'api'
      }, { status: 500 });
    }

    const result = await replicateResponse.json();
    console.log('✅ Replicate API 响应成功');
    console.log('📊 完整响应:', JSON.stringify(result, null, 2));

    // 检查是否有错误状态
    if (result.status === 'failed' || result.error) {
      const errorMsg = result.error || 'Color matching failed';
      console.error('❌ Replicate 处理失败:', errorMsg);
      
      return NextResponse.json({ 
        error: errorMsg,
        errorType: 'processing'
      }, { status: 500 });
    }

    if (!result.output) {
      console.error('❌ 没有输出数据');
      console.error('❌ 完整响应数据:', JSON.stringify(result, null, 2));
      
      return NextResponse.json({ 
        error: 'No image generated. Please try again.',
        errorType: 'no_output'
      }, { status: 500 });
    }

    // result.output 应该是一个 URL 字符串或数组
    let matchedImageUrl: string;
    if (Array.isArray(result.output)) {
      matchedImageUrl = result.output[0];
    } else {
      matchedImageUrl = result.output;
    }

    console.log('🎉 颜色匹配后的图片 URL:', matchedImageUrl);

    return NextResponse.json({
      imageUrl: matchedImageUrl
    });

  } catch (error) {
    console.error('💥 API 处理异常:', error);
    if (error instanceof Error) {
      console.error('💥 错误堆栈:', error.stack);
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

