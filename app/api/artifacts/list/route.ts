export const dynamic = 'force-dynamic';

/**
 * Artifact List API
 * 
 * Lists artifacts with optional filters.
 * 
 * Version: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { listArtifacts } from '../../../../spine/artifacts/ArtifactVault';
import { ArtifactKind } from '../../../../spine/artifacts/ArtifactTypes';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const learnerId = searchParams.get('learnerId');
    const kind = searchParams.get('kind') as ArtifactKind | null;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;

    const manifests = await listArtifacts({
      learnerId: learnerId || undefined,
      kind: kind || undefined,
      limit: limit || 50
    });

    return NextResponse.json({ manifests });
  } catch (error: any) {
    console.error('Failed to list artifacts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list artifacts' },
      { status: 500 }
    );
  }
}













