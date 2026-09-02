import { NextRequest, NextResponse } from 'next/server';
import { newStorage } from '@/lib/storage';
import { getUuid } from '@/lib/hash';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    
    if (!image) {
      return NextResponse.json({ error: 'Missing image parameter' }, { status: 400 });
    }

    console.log('📤 开始上传图片到 R2...');
    console.log('📋 图片数据长度:', image.length);
    console.log('📋 图片数据前缀:', image.substring(0, 50));

    // 检查环境变量
    console.log('🔧 环境变量检查:');
    console.log('- STORAGE_ENDPOINT:', process.env.STORAGE_ENDPOINT ? '已设置' : '未设置');
    console.log('- STORAGE_ACCESS_KEY_ID:', process.env.STORAGE_ACCESS_KEY_ID ? '已设置' : '未设置');
    console.log('- STORAGE_SECRET_ACCESS_KEY:', process.env.STORAGE_SECRET_ACCESS_KEY ? '已设置' : '未设置');
    console.log('- STORAGE_BUCKET:', process.env.STORAGE_BUCKET || '未设置');
    console.log('- STORAGE_DOMAIN:', process.env.STORAGE_DOMAIN || '未设置');

    // 将 base64 图片上传到 R2 存储
    const storage = newStorage();
    const batch = getUuid();
    const filename = `user_upload_${batch}.png`;
    const key = `user-uploads/${filename}`;
    
    console.log('📋 上传参数:', { key, filename, batch });
    
    // 将 base64 转换为 Buffer
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    console.log('📋 Buffer 大小:', imageBuffer.length, 'bytes');
    
    const uploadResult = await storage.uploadFile({
      body: imageBuffer,
      key,
      contentType: 'image/png',
      disposition: 'inline',
    });

    console.log('✅ 图片上传到 R2 成功:');
    console.log('- URL:', uploadResult.url);
    console.log('- Location:', uploadResult.location);
    console.log('- Key:', uploadResult.key);
    console.log('- Bucket:', uploadResult.bucket);

    return NextResponse.json({
      success: true,
      imageUrl: uploadResult.url,
      key: key,
      location: uploadResult.location,
      bucket: uploadResult.bucket
    });
  } catch (error) {
    console.error('❌ 上传图片到 R2 失败:');
    console.error('- Error:', error);
    console.error('- Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('- Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Failed to upload image to R2', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

