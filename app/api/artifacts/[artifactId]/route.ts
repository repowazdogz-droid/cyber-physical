/**
 * Artifact Retrieval API
 * 
 * Retrieves artifacts by artifactId.
 * Returns manifest and safe payloads (already redacted + bounded).
 * 
 * Version: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getArtifact } from '../../../../spine/artifacts/ArtifactVault';

export async function GET(
  request: NextRequest,
  { params }: { params: { artifactId: string } }
) {
  try {
    const { artifactId } = params;

    if (!artifactId) {
      return NextResponse.json(
        { error: 'artifactId is required' },
        { status: 400 }
      );
    }

    const bundle = await getArtifact(artifactId);

    if (!bundle) {
      return NextResponse.json(
        { error: 'Artifact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      manifest: bundle.manifest,
      payloads: bundle.payloads
    });
  } catch (error: any) {
    console.error('Failed to get artifact:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get artifact' },
      { status: 500 }
    );
  }
}








































