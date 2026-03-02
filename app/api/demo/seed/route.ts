/**
 * Demo Seed API
 * 
 * Creates demo learner/session IDs + minimal state.
 * Ensures artifact vault has at least 1 artifact to lock.
 * 
 * Version: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { putArtifact } from '../../../../spine/artifacts/ArtifactVault';
import { ArtifactKind } from '../../../../spine/artifacts/ArtifactTypes';
import { CONTRACT_VERSION } from '../../../../spine/contracts/ContractVersion';

export async function POST(request: NextRequest) {
  try {
    // Create demo learner and session IDs
    const learnerId = `demo_learner_${Date.now()}`;
    const sessionId = `demo_session_${Date.now()}`;

    // Create a minimal demo artifact (kernel run)
    const demoArtifact = {
      run: {
        contractVersion: CONTRACT_VERSION,
        runId: `demo_run_${Date.now()}`,
        kernelId: 'demo_kernel',
        adapterId: 'demo_adapter',
        input: {
          contractVersion: CONTRACT_VERSION,
          timestamp: new Date().toISOString(),
          signals: { demo: true },
          uncertainty: []
        },
        decision: {
          contractVersion: CONTRACT_VERSION,
          outcome: 'DEMO',
          confidence: 'High',
          rationale: 'Demo artifact for golden suite',
          assumptions: [],
          uncertainties: [],
          kernelId: 'demo_kernel',
          adapterId: 'demo_adapter'
        },
        trace: {
          contractVersion: CONTRACT_VERSION,
          traceId: `demo_trace_${Date.now()}`,
          nodes: [],
          claims: [],
          summary: 'Demo trace',
          kernelVersion: '1.0.0'
        },
        createdAtIso: new Date().toISOString(),
        inputHash: 'demo_hash'
      }
    };

    // Store artifact
    const result = await putArtifact(
      ArtifactKind.KERNEL_RUN,
      demoArtifact,
      {
        artifactId: demoArtifact.run.runId,
        learnerId,
        sessionId,
        notes: 'Demo seed artifact'
      }
    );

    // Store demo state (last artifact ID) - server-side write
    try {
      const { writeFile, mkdir } = await import('fs/promises');
      const { join } = await import('path');
      const demoStatePath = join(process.cwd(), 'tmp', 'demoState.json');
      const demoStateDir = join(process.cwd(), 'tmp');
      await mkdir(demoStateDir, { recursive: true });
      await writeFile(
        demoStatePath,
        JSON.stringify({
          lastArtifactId: result.artifactId,
          lastLabel: 'Demo Seed Artifact'
        }, null, 2),
        'utf-8'
      );
    } catch (err) {
      // Demo state is optional, don't fail if it doesn't work
      console.warn('Failed to set demo state:', err);
    }

    return NextResponse.json({
      ok: true,
      learnerId,
      sessionId,
      artifactId: result.artifactId,
      message: 'Demo state seeded successfully'
    });
  } catch (error: any) {
    console.error('Failed to seed demo state:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to seed demo state' },
      { status: 500 }
    );
  }
}

