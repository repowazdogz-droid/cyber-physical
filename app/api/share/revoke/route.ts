/**
 * Share Token Revocation API
 * 
 * Revokes share tokens.
 * 
 * Version: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShareTokenStore } from '../../../../spine/share/ShareTokenStore';

interface RevokeTokenRequest {
  token: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RevokeTokenRequest = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'token is required' },
        { status: 400 }
      );
    }

    const store = getShareTokenStore();
    const revoked = await store.revokeToken(token);

    if (!revoked) {
      return NextResponse.json(
        { error: 'Token not found or already revoked' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Failed to revoke share token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to revoke share token' },
      { status: 500 }
    );
  }
}








































