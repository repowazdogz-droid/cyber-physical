/**
 * Tests for Summarizers.
 * Ensures: determinism (same input → same summary), bounding rules.
 */

import { summarizeKernelRun, summarizeOrchestratorRun, summarizeRecap } from '../Summarizers';
import { ArtifactBundle } from '../../artifacts/ArtifactTypes';
import { CONTRACT_VERSION } from '../../contracts/ContractVersion';

describe('Summarizers', () => {
  test('summarizeKernelRun is deterministic', () => {
    const run: any = {
      contractVersion: CONTRACT_VERSION,
      runId: 'run-1',
      kernelId: 'kernel-1',
      adapterId: 'adapter-1',
      input: {
        contractVersion: CONTRACT_VERSION,
        signals: {},
        uncertainty: []
      },
      decision: {
        contractVersion: CONTRACT_VERSION,
        outcome: 'S1',
        confidence: 'High',
        rationale: 'Nominal conditions',
        assumptions: [],
        uncertainties: [],
        kernelId: 'kernel-1',
        adapterId: 'adapter-1'
      },
      trace: {
        contractVersion: CONTRACT_VERSION,
        nodes: [],
        claims: []
      },
      createdAtIso: '2024-01-01T00:00:00Z',
      inputHash: 'hash1'
    };

    const summary1 = summarizeKernelRun(run);
    const summary2 = summarizeKernelRun(run);

    expect(summary1).toEqual(summary2);
  });

  test('summarizeKernelRun bounds claimIds', () => {
    const run: any = {
      contractVersion: CONTRACT_VERSION,
      runId: 'run-1',
      kernelId: 'kernel-1',
      adapterId: 'adapter-1',
      input: {
        contractVersion: CONTRACT_VERSION,
        signals: {},
        uncertainty: []
      },
      decision: {
        contractVersion: CONTRACT_VERSION,
        outcome: 'S1',
        confidence: 'High',
        rationale: 'Nominal',
        assumptions: [],
        uncertainties: [],
        kernelId: 'kernel-1',
        adapterId: 'adapter-1'
      },
      trace: {
        contractVersion: CONTRACT_VERSION,
        nodes: [],
        claims: Array.from({ length: 50 }, (_, i) => ({
          contractVersion: CONTRACT_VERSION,
          claimId: `claim-${i}`,
          type: 'fact',
          statement: 'Test',
          confidence: 'High'
        }))
      },
      createdAtIso: '2024-01-01T00:00:00Z',
      inputHash: 'hash1'
    };

    const summary = summarizeKernelRun(run);

    expect(summary.claimIds.length).toBeLessThanOrEqual(20);
  });

  test('summarizeOrchestratorRun is deterministic', () => {
    const run: any = {
      contractVersion: CONTRACT_VERSION,
      graphId: 'graph-1',
      sessionId: 'session-1',
      learnerId: 'learner-1',
      startedAtIso: '2024-01-01T00:00:00Z',
      nodes: [],
      terminalOutcome: 'S1',
      terminalNodeId: 'node-1',
      summaryClaims: [],
      policyNotes: [],
      boundedTraceHighlights: []
    };

    const summary1 = summarizeOrchestratorRun(run);
    const summary2 = summarizeOrchestratorRun(run);

    expect(summary1).toEqual(summary2);
  });

  test('summarizeRecap bounds highlights', () => {
    const bundle: ArtifactBundle = {
      manifest: {
        artifactId: 'artifact-1',
        kind: 'XR_BUNDLE' as any,
        contractVersion: CONTRACT_VERSION,
        createdAtIso: '2024-01-01T00:00:00Z',
        files: [],
        rootSha256: 'hash1',
        redactionsApplied: []
      },
      payloads: {
        sessionlog: {
          events: Array.from({ length: 50 }, (_, i) => ({
            t: i,
            type: `event-${i}`,
            payload: {}
          }))
        },
        learningBoard: {
          pinnedIds: [],
          customOrderIds: []
        },
        thoughtObjects: []
      }
    };

    const summary = summarizeRecap(bundle);

    expect(summary.highlights.length).toBeLessThanOrEqual(12);
  });
});

