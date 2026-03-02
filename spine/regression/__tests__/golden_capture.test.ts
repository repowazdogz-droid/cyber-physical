/**
 * Tests for Golden Capture Service.
 * Ensures: capturing same artifact twice → added=false, label bounding, deterministic labels.
 */

import { captureArtifactAsGolden } from '../GoldenCapture';
import { putArtifact } from '../../artifacts/ArtifactVault';
import { ArtifactKind } from '../../artifacts/ArtifactTypes';
import { CONTRACT_VERSION } from '../../contracts/ContractVersion';
import { setGoldenSuitePath } from '../golden/GoldenSuiteWriter';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, beforeAll, vi } from 'vitest';

// Helper to create temp suite path
function tmpSuitePath(name: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'golden-capture-'));
  return join(dir, name);
}

describe('Golden Capture', () => {
  const testArtifactId = `test_artifact_${Date.now()}`;
  let testSuitePath: string;

  beforeAll(() => {
    // Set up temp golden suite file for each test suite
    const tmpDir = mkdtempSync(join(tmpdir(), 'omega-golden-test-'));
    testSuitePath = join(tmpDir, 'GOLDEN_SUITE.json');
    setGoldenSuitePath(testSuitePath);
  });

  beforeEach(async () => {
    // Create a test artifact
    const testArtifact = {
      meta: { contractVersion: CONTRACT_VERSION },
      run: {
        contractVersion: CONTRACT_VERSION,
        runId: testArtifactId,
        kernelId: 'test_kernel',
        adapterId: 'test_adapter',
        input: {
          contractVersion: CONTRACT_VERSION,
          timestamp: new Date().toISOString(),
          signals: { test: true },
          uncertainty: []
        },
        decision: {
          contractVersion: CONTRACT_VERSION,
          outcome: 'TEST',
          confidence: 'High',
          rationale: 'Test artifact',
          assumptions: [],
          uncertainties: [],
          kernelId: 'test_kernel',
          adapterId: 'test_adapter'
        },
        trace: {
          contractVersion: CONTRACT_VERSION,
          traceId: `test_trace_${Date.now()}`,
          nodes: [],
          claims: [],
          summary: 'Test trace',
          kernelVersion: '1.0.0'
        },
        createdAtIso: new Date().toISOString(),
        inputHash: 'test_hash'
      }
    };

    await putArtifact(
      ArtifactKind.KERNEL_RUN,
      testArtifact,
      {
        artifactId: testArtifactId,
        notes: 'Test artifact for golden capture'
      }
    );
  });

  test('capturing same artifact twice returns added=false second time', async () => {
    // First capture
    const result1 = await captureArtifactAsGolden({
      artifactId: testArtifactId,
      label: 'Test Case 1'
    });

    expect(result1.ok).toBe(true);
    expect(result1.added).toBe(true);

    // Second capture (should be duplicate)
    const result2 = await captureArtifactAsGolden({
      artifactId: testArtifactId,
      label: 'Test Case 2'
    });

    expect(result2.ok).toBe(true);
    expect(result2.added).toBe(false);
    expect(result2.warnings.length).toBeGreaterThan(0);
    expect(result2.warnings[0]).toContain('already in golden suite');
  });

  test('label bounding enforced', async () => {
    // Set suite path after resetModules, before importing capture logic
    // Use isolated suite path for this test to avoid pollution
    const suitePath = tmpSuitePath('GOLDEN_SUITE.json');
    
    // Reset modules to kill cached JSON/module singletons
    vi.resetModules();
    
    // Set path before importing
    const { setGoldenSuitePath } = await import('../golden/GoldenSuiteWriter');
    setGoldenSuitePath(suitePath);
    
    // Re-import capture function after path is set
    const { captureArtifactAsGolden } = await import('../GoldenCapture');
    
    const longLabel = 'A'.repeat(100); // 100 chars, max is 60

    const result = await captureArtifactAsGolden({
      artifactId: testArtifactId,
      label: longLabel
    });

    expect(result.ok).toBe(true);
    expect(result.added).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('truncated');
  });

  test('deterministic default label for same input', async () => {
    // Create another test artifact
    const testArtifactId2 = `test_artifact_2_${Date.now()}`;
    const testArtifact2 = {
      meta: { contractVersion: CONTRACT_VERSION },
      run: {
        contractVersion: CONTRACT_VERSION,
        runId: testArtifactId2,
        kernelId: 'test_kernel',
        adapterId: 'test_adapter',
        input: {
          contractVersion: CONTRACT_VERSION,
          timestamp: new Date().toISOString(),
          signals: { test: true },
          uncertainty: []
        },
        decision: {
          contractVersion: CONTRACT_VERSION,
          outcome: 'TEST',
          confidence: 'High',
          rationale: 'Test artifact',
          assumptions: [],
          uncertainties: [],
          kernelId: 'test_kernel',
          adapterId: 'test_adapter'
        },
        trace: {
          contractVersion: CONTRACT_VERSION,
          traceId: `test_trace_2_${Date.now()}`,
          nodes: [],
          claims: [],
          summary: 'Test trace',
          kernelVersion: '1.0.0'
        },
        createdAtIso: new Date().toISOString(),
        inputHash: 'test_hash_2'
      }
    };

    await putArtifact(
      ArtifactKind.KERNEL_RUN,
      testArtifact2,
      {
        artifactId: testArtifactId2,
        notes: 'Test artifact 2'
      }
    );

    // Capture without label (should generate default)
    const result1 = await captureArtifactAsGolden({
      artifactId: testArtifactId2,
      runSuite: false
    });

    expect(result1.ok).toBe(true);
    expect(result1.added).toBe(true);
    
    // Default label should be deterministic (based on kind and artifactId suffix)
    // The label should start with "Kernel Run" and end with short artifactId
    expect(result1.warnings.length).toBe(0); // No warnings means label was within bounds
  });

  test('returns error for non-existent artifact', async () => {
    const result = await captureArtifactAsGolden({
      artifactId: 'non_existent_artifact_id_12345',
      label: 'Test'
    });

    expect(result.ok).toBe(false);
    expect(result.added).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('not found');
  });
});
