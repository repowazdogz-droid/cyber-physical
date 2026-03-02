export const dynamic = 'force-dynamic';

/**
 * Share Token List API
 * 
 * Lists share tokens for a learner.
 * 
 * Version: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShareTokenStore } from '../../../../spine/share/ShareTokenStore';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const learnerId = searchParams.get('learnerId');

    if (!learnerId) {
      return NextResponse.json(
        { error: 'learnerId is required' },
        { status: 400 }
      );
    }

    const store = getShareTokenStore();
    const tokens = await store.listTokens(learnerId);

    return NextResponse.json({ tokens });
  } catch (error: any) {
    console.error('Failed to list share tokens:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list share tokens' },
      { status: 500 }
    );
  }
}













