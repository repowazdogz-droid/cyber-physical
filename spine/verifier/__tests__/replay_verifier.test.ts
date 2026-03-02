/**
 * Tests for Replay Verifier.
 * Ensures: deterministic verification, graceful skips, bounded notes/checks.
 */

import { verifyBundle } from '../ReplayVerifier';
import { InMemoryArtifactVault } from '../../artifacts/InMemoryArtifactVault';
import { ArtifactKind } from '../../artifacts/ArtifactTypes';
import { CONTRACT_VERSION } from '../../contracts/ContractVersion';

describe('Replay Verifier', () => {
  let vault: InMemoryArtifactVault;

  beforeEach(() => {
    vault = new InMemoryArtifactVault();
  });

  test('produces deterministic verification for same bundle', async () => {
    const sessionId = 'test-session-1';
    const bundle = {
      contractVersion: CONTRACT_VERSION,
      sessionId,
      meta: { sessionId, createdAtIso: '2024-01-01T00:00:00Z' },
      sessionlog: [],
      learningBoard: null,
      thoughtObjects: []
    };

    await vault.put(ArtifactKind.bundle, sessionId, bundle);

    const result1 = await verifyBundle(vault, sessionId);
    const result2 = await verifyBundle(vault, sessionId);

    expect(result1.bundleHash).toBe(result2.bundleHash);
    expect(result1.recomputedHash).toBe(result2.recomputedHash);
    expect(result1.checks.length).toBe(result2.checks.length);
  });

  test('fails when bundle not found', async () => {
    const result = await verifyBundle(vault, 'non-existent');

    expect(result.ok).toBe(false);
    expect(result.checks.length).toBeGreaterThan(0);
    expect(result.checks[0].id).toBe('bundle_exists');
    expect(result.checks[0].ok).toBe(false);
  });

  test('verifies schema version', async () => {
    const sessionId = 'test-session-2';
    const bundle = {
      contractVersion: CONTRACT_VERSION,
      sessionId,
      meta: { sessionId }
    };

    await vault.put(ArtifactKind.bundle, sessionId, bundle);

    const result = await verifyBundle(vault, sessionId);

    const schemaCheck = result.checks.find(c => c.id === 'schema_version');
    expect(schemaCheck).toBeDefined();
    expect(schemaCheck?.ok).toBe(true);
  });

  test('verifies contract version match', async () => {
    const sessionId = 'test-session-3';
    const bundle = {
      contractVersion: CONTRACT_VERSION,
      sessionId,
      meta: { sessionId }
    };

    await vault.put(ArtifactKind.bundle, sessionId, bundle);

    const result = await verifyBundle(vault, sessionId);

    const contractCheck = result.checks.find(c => c.id === 'contract_version');
    expect(contractCheck).toBeDefined();
    expect(contractCheck?.ok).toBe(true);
  });

  test('verifies content hash stability', async () => {
    const sessionId = 'test-session-4';
    const bundle = {
      contractVersion: CONTRACT_VERSION,
      sessionId,
      meta: { sessionId }
    };

    await vault.put(ArtifactKind.bundle, sessionId, bundle);

    const result = await verifyBundle(vault, sessionId);

    const hashCheck = result.checks.find(c => c.id === 'content_hash');
    expect(hashCheck).toBeDefined();
    expect(hashCheck?.ok).toBe(true);
    expect(result.bundleHash).toBe(result.recomputedHash);
  });

  test('bounds checks to max 20', async () => {
    const sessionId = 'test-session-5';
    const bundle = {
      contractVersion: CONTRACT_VERSION,
      sessionId,
      meta: { sessionId },
      kernelRuns: Array.from({ length: 30 }, (_, i) => ({
        runId: `run-${i}`,
        kernelId: 'test-kernel',
        adapterId: 'test-adapter',
        decision: { outcomeId: 'S1', label: 'Test', confidence: 'High', rationale: 'Test' },
        claims: [],
        trace: []
      }))
    };

    await vault.put(ArtifactKind.bundle, sessionId, bundle);

    const result = await verifyBundle(vault, sessionId);

    expect(result.checks.length).toBeLessThanOrEqual(20);
  });

  test('bounds notes to max 10', async () => {
    const sessionId = 'test-session-6';
    const bundle = {
      contractVersion: CONTRACT_VERSION,
      sessionId,
      meta: { sessionId },
      kernelRuns: Array.from({ length: 15 }, (_, i) => ({
        runId: `run-${i}`,
        kernelId: 'test-kernel',
        adapterId: 'missing-adapter', // Will generate notes
        decision: { outcomeId: 'S1', label: 'Test', confidence: 'High', rationale: 'Test' },
        claims: [],
        trace: []
      }))
    };

    await vault.put(ArtifactKind.bundle, sessionId, bundle);

    const result = await verifyBundle(vault, sessionId);

    expect(result.notes.length).toBeLessThanOrEqual(10);
  });

  test('skips gracefully when adapter not found', async () => {
    const sessionId = 'test-session-7';
    const bundle = {
      contractVersion: CONTRACT_VERSION,
      sessionId,
      meta: { sessionId },
      kernelRuns: [{
        runId: 'run-1',
        kernelId: 'test-kernel',
        adapterId: 'non-existent-adapter',
        decision: { outcomeId: 'S1', label: 'Test', confidence: 'High', rationale: 'Test' },
        claims: [],
        trace: []
      }]
    };

    await vault.put(ArtifactKind.bundle, sessionId, bundle);

    const result = await verifyBundle(vault, sessionId);

    // Should not fail overall, just note the skip
    expect(result.notes.some(n => n.includes('not found'))).toBe(true);
  });

  test('overall result requires all critical checks to pass', async () => {
    const sessionId = 'test-session-8';
    const bundle = {
      contractVersion: '0.9.0', // Wrong version
      sessionId,
      meta: { sessionId }
    };

    await vault.put(ArtifactKind.bundle, sessionId, bundle);

    const result = await verifyBundle(vault, sessionId);

    expect(result.ok).toBe(false);
    const contractCheck = result.checks.find(c => c.id === 'contract_version');
    expect(contractCheck?.ok).toBe(false);
  });
});








































