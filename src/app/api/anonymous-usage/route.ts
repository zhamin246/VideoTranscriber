import { NextRequest, NextResponse } from 'next/server';
import { getAnonymousUsageRemaining } from '@/services/anonymous-usage';
import { getUserUuid } from '@/services/user';
import { DAILY_FREE_LIMIT } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const anonymous_uuid = searchParams.get('anonymous_uuid');
    const api_type = searchParams.get('api_type') || 'enhance-image';

    // 如果用户已登录，返回无限次数
    // 将 getUserUuid() 包装在 try-catch 中，避免其异常影响匿名用户请求
    let userUuid = "";
    try {
      userUuid = await getUserUuid();
    } catch (error) {
      // 如果获取用户UUID失败，继续处理匿名用户请求
      console.warn('获取用户UUID失败，继续处理匿名用户请求:', error);
    }

    if (userUuid) {
      return NextResponse.json({
        remaining: -1, // -1 表示无限
        isAuthenticated: true
      });
    }

    // 未登录用户需要提供 anonymous_uuid
    if (!anonymous_uuid) {
      return NextResponse.json({ error: 'Anonymous UUID is required' }, { status: 400 });
    }

    // 将数据库查询包装在 try-catch 中，避免数据库错误导致 500
    let remaining = 0;
    try {
      remaining = await getAnonymousUsageRemaining(anonymous_uuid, api_type);
    } catch (error) {
      // 如果数据库查询失败，记录错误但返回默认值，避免影响用户体验
      console.error('获取匿名用户剩余次数失败（数据库错误）:', error);
      // 返回默认的每日限制，让用户可以继续使用
      remaining = DAILY_FREE_LIMIT;
    }

    return NextResponse.json({
      remaining,
      isAuthenticated: false
    });
  } catch (error) {
    console.error('获取匿名用户剩余次数失败（未知错误）:', error);
    // 即使发生未知错误，也返回一个合理的默认值，而不是 500
    return NextResponse.json({
      remaining: DAILY_FREE_LIMIT,
      isAuthenticated: false
    });
  }
}

