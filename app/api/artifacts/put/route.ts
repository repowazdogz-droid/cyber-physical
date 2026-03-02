/**
 * Artifact Put API
 * 
 * Stores an artifact in the vault.
 * 
 * Version: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { putArtifact } from '../../../../spine/artifacts/ArtifactVault';
import { ArtifactKind } from '../../../../spine/artifacts/ArtifactTypes';

import type { OmegaMeta } from '../../../../spine/llm/modes/OmegaMeta';

interface PutArtifactRequest {
  kind: ArtifactKind;
  payloads: Record<string, any>;
  meta?: {
    artifactId?: string;
    learnerId?: string;
    sessionId?: string;
    isMinor?: boolean;
    notes?: string;
    omega?: OmegaMeta;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: PutArtifactRequest = await request.json();
    const { kind, payloads, meta } = body;

    if (!kind || !payloads) {
      return NextResponse.json(
        { error: 'kind and payloads are required' },
        { status: 400 }
      );
    }

    const result = await putArtifact(kind, payloads, meta);

    return NextResponse.json({
      ok: true,
      artifactId: result.artifactId,
      manifest: result.manifest,
      warnings: result.warnings.length > 0 ? result.warnings : undefined
    });
  } catch (error: any) {
    console.error('Failed to put artifact:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to put artifact' },
      { status: 500 }
    );
  }
}





