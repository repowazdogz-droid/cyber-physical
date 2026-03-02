import { NextRequest, NextResponse } from 'next/server';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getArtifact } from '../../../../../spine/artifacts/ArtifactVault';
import { ArtifactKind } from '../../../../../spine/artifacts/ArtifactTypes';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Try to load from artifact vault first (by artifactId = sessionId)
    const vaultBundle = await getArtifact(sessionId);

    if (vaultBundle) {
      // Return bundle from vault
      const payloads = vaultBundle.payloads;
      return NextResponse.json({
        meta: payloads.meta,
        sessionLog: payloads.sessionlog,
        boardState: payloads.learningBoard,
        thoughtObjects: payloads.thoughtObjects,
        kernelRuns: payloads.kernelRuns,
        orchestratorRuns: payloads.orchestratorRuns
      });
    }

    // Fallback to old storage location (backwards compatibility)
    const storageDir = join(process.cwd(), 'tmp', 'learningBundles', sessionId);

    if (!existsSync(storageDir)) {
      return NextResponse.json(
        { error: 'Bundle not found' },
        { status: 404 }
      );
    }

    // Load all bundle files from old location
    const metaPath = join(storageDir, 'meta.json');
    const sessionLogPath = join(storageDir, 'sessionlog.json');
    const boardStatePath = join(storageDir, 'learningBoard.json');
    const thoughtObjectsPath = join(storageDir, 'thoughtObjects.json');

    const bundle: any = {};

    // Load metadata
    if (existsSync(metaPath)) {
      const metaContent = await readFile(metaPath, 'utf-8');
      bundle.meta = JSON.parse(metaContent);
    }

    // Load session log
    if (existsSync(sessionLogPath)) {
      const sessionLogContent = await readFile(sessionLogPath, 'utf-8');
      bundle.sessionLog = JSON.parse(sessionLogContent);
    }

    // Load board state
    if (existsSync(boardStatePath)) {
      const boardStateContent = await readFile(boardStatePath, 'utf-8');
      bundle.boardState = JSON.parse(boardStateContent);
    }

    // Load thought objects
    if (existsSync(thoughtObjectsPath)) {
      const thoughtObjectsContent = await readFile(thoughtObjectsPath, 'utf-8');
      const parsed = JSON.parse(thoughtObjectsContent);
      bundle.thoughtObjects = parsed.objects || parsed;
    }

    return NextResponse.json(bundle);
  } catch (error: any) {
    console.error('Failed to load bundle:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load bundle' },
      { status: 500 }
    );
  }
}

