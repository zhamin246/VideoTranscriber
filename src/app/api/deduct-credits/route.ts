import { NextRequest, NextResponse } from 'next/server';
import { getUserUuid } from '@/services/user';
import { decreaseCredits, CreditsTransType } from '@/services/credit';

export async function POST(request: NextRequest) {
  try {
    const userUuid = await getUserUuid();
    if (!userUuid) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { credits, trans_type } = await request.json();

    if (!credits || credits <= 0) {
      return NextResponse.json({ error: 'Invalid credits amount' }, { status: 400 });
    }

    await decreaseCredits({
      user_uuid: userUuid,
      trans_type: CreditsTransType.VIDEO_GENERATION, // 暂时使用 VIDEO_GENERATION
      credits: credits
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Credit deduction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
