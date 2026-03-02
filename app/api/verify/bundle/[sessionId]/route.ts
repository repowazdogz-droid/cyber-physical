/**
 * Bundle Verification API
 * 
 * Verifies bundle integrity and determinism.
 * 
 * Version: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { FsArtifactVault } from '../../../../../spine/artifacts/FsArtifactVault';
import { verifyBundle } from '../../../../../spine/verifier/ReplayVerifier';

/**
 * GET: Verify bundle
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const vault = new FsArtifactVault();
    const result = await verifyBundle(vault, sessionId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Failed to verify bundle:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify bundle' },
      { status: 500 }
    );
  }
}








































