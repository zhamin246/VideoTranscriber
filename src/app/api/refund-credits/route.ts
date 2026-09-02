import { NextRequest, NextResponse } from 'next/server';
import { getUserUuid } from '@/services/user';
import { increaseCredits, CreditsTransType } from '@/services/credit';
import { getOneYearLaterTimestr } from '@/lib/time';

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

    await increaseCredits({
      user_uuid: userUuid,
      trans_type: CreditsTransType.SystemAdd,
      credits: credits,
      expired_at: getOneYearLaterTimestr()
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Credit refund error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
