/**
 * Artifact API Routes
 * 
 * CRUD operations for artifacts.
 * Server-side only (POST/DELETE require server context).
 * 
 * Version: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { FsArtifactVault } from '../../../../../spine/artifacts/FsArtifactVault';
import { ArtifactKind } from '../../../../../spine/artifacts/ArtifactTypes';

const vault = new FsArtifactVault();

/**
 * GET: Retrieve artifact
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { kind: string; id: string } }
) {
  try {
    const { kind, id } = params;

    // Validate kind
    if (!Object.values(ArtifactKind).includes(kind as ArtifactKind)) {
      return NextResponse.json(
        { error: `Invalid artifact kind: ${kind}` },
        { status: 400 }
      );
    }

    const record = await vault.get(kind as ArtifactKind, id);

    if (!record) {
      return NextResponse.json(
        { error: 'Artifact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(record);
  } catch (error: any) {
    console.error('Failed to get artifact:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get artifact' },
      { status: 500 }
    );
  }
}

/**
 * POST: Store artifact (server-side only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { kind: string; id: string } }
) {
  try {
    const { kind, id } = params;

    // Validate kind
    if (!Object.values(ArtifactKind).includes(kind as ArtifactKind)) {
      return NextResponse.json(
        { error: `Invalid artifact kind: ${kind}` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { payload, metaExtras } = body;

    if (!payload) {
      return NextResponse.json(
        { error: 'Payload is required' },
        { status: 400 }
      );
    }

    const meta = await vault.put(kind as ArtifactKind, id, payload, metaExtras);

    return NextResponse.json({ success: true, meta });
  } catch (error: any) {
    console.error('Failed to put artifact:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to put artifact' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Remove artifact
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { kind: string; id: string } }
) {
  try {
    const { kind, id } = params;

    // Validate kind
    if (!Object.values(ArtifactKind).includes(kind as ArtifactKind)) {
      return NextResponse.json(
        { error: `Invalid artifact kind: ${kind}` },
        { status: 400 }
      );
    }

    const deleted = await vault.delete(kind as ArtifactKind, id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Artifact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete artifact:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete artifact' },
      { status: 500 }
    );
  }
}


