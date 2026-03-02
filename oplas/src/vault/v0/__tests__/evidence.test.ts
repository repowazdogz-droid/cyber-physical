/**
 * Evidence Index Tests
 * 
 * Tests for negative evidence de-ranking and penalty scoring.
 * 
 * Version: 1.0.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  buildEvidenceIndex,
  aggregateEvidence,
  computeKeyFingerprint,
  loadEvidenceIndex,
  updateEvidenceIndex
} from '../EvidenceIndex';
import { computePenalty, shouldExclude } from '../PenaltyScoring';
import { NegativeEvidence } from '../types';
import { Domain } from '../../../contracts/enums/Domains';
import { VerifierWhyCode } from '../../../contracts/enums/VerifierCodes';

function createTestVaultRoot(): string {
  return join(tmpdir(), `vault-test-${Date.now()}`);
}

describe('Evidence Index - Aggregation', () => {
  it('should aggregate evidence statistics', () => {
    const evidence: NegativeEvidence[] = [
      {
        concept_id: 'test-concept',
        concept_version: '1.0.0',
        repr_id: 'repr1',
        failure_tier: 2,
        why_code: VerifierWhyCode.EXAMPLE_MISMATCH,
        trace_id: 'trace1',
        timestamp_iso: '2024-01-01T00:00:00Z'
      },
      {
        concept_id: 'test-concept',
        concept_version: '1.0.0',
        repr_id: 'repr2',
        failure_tier: 3,
        why_code: VerifierWhyCode.INVARIANCE_FAILED_PALETTE,
        trace_id: 'trace2',
        timestamp_iso: '2024-01-02T00:00:00Z'
      }
    ];

    const stats = aggregateEvidence(evidence);

    expect(stats.fail_count_total).toBe(2);
    expect(stats.fail_count_by_code[VerifierWhyCode.EXAMPLE_MISMATCH]).toBe(1);
    expect(stats.fail_count_by_code[VerifierWhyCode.INVARIANCE_FAILED_PALETTE]).toBe(1);
    expect(stats.recent_fail_streak).toBeGreaterThan(0);
  });

  it('should compute key fingerprint deterministically', () => {
    const keys1 = ['key1', 'key2', 'key3'];
    const keys2 = ['key1', 'key2', 'key3'];
    const keys3 = ['key3', 'key2', 'key1']; // Different order

    const fp1 = computeKeyFingerprint(keys1);
    const fp2 = computeKeyFingerprint(keys2);
    const fp3 = computeKeyFingerprint(keys3);

    expect(fp1).toBe(fp2); // Same keys = same fingerprint
    expect(fp1).toBe(fp3); // Sorted = same fingerprint
  });
});

describe('Penalty Scoring', () => {
  it('should compute penalty score', () => {
    const stats = {
      fail_count_total: 2,
      fail_count_by_code: {
        [VerifierWhyCode.EXAMPLE_MISMATCH]: 1,
        [VerifierWhyCode.INVARIANCE_FAILED_PALETTE]: 1
      },
      recent_fail_streak: 2,
      last_fail_ts: '2024-01-01T00:00:00Z'
    };

    const penalty = computePenalty(stats);

    expect(penalty).toBeGreaterThan(0);
    // Should include: 5*2 + 15*1 + 8*1 + 2*2 = 10 + 15 + 8 + 4 = 37
    expect(penalty).toBe(37);
  });

  it('should return zero penalty for undefined stats', () => {
    const penalty = computePenalty(undefined);
    expect(penalty).toBe(0);
  });

  it('should exclude concept with palette failures >= 3', () => {
    const stats = {
      fail_count_total: 5,
      fail_count_by_code: {
        [VerifierWhyCode.INVARIANCE_FAILED_PALETTE]: 3
      },
      recent_fail_streak: 3,
      last_fail_ts: '2024-01-01T00:00:00Z'
    };

    const excluded = shouldExclude(stats, 'fingerprint1');
    expect(excluded).toBe(true);
  });

  it('should not exclude concept with palette failures < 3', () => {
    const stats = {
      fail_count_total: 2,
      fail_count_by_code: {
        [VerifierWhyCode.INVARIANCE_FAILED_PALETTE]: 2
      },
      recent_fail_streak: 2,
      last_fail_ts: '2024-01-01T00:00:00Z'
    };

    const excluded = shouldExclude(stats, 'fingerprint1');
    expect(excluded).toBe(false);
  });
});

describe('Evidence Index - Storage', () => {
  it('should update evidence index', async () => {
    const vaultRoot = createTestVaultRoot();
    const evidence: NegativeEvidence = {
      concept_id: 'test-concept',
      concept_version: '1.0.0',
      repr_id: 'repr1',
      failure_tier: 2,
      why_code: VerifierWhyCode.EXAMPLE_MISMATCH,
      trace_id: 'trace1',
      timestamp_iso: new Date().toISOString()
    };

    const keyFingerprint = computeKeyFingerprint(['key1', 'key2', 'key3']);

    await updateEvidenceIndex(vaultRoot, evidence, Domain.GRID_2D, keyFingerprint);

    const index = await loadEvidenceIndex(vaultRoot);
    const conceptKey = 'test-concept@1.0.0';

    expect(index.by_concept[conceptKey]).toBeDefined();
    expect(index.by_concept[conceptKey].fail_count_total).toBe(1);
    expect(index.by_fingerprint[keyFingerprint]).toBeDefined();
    expect(index.by_fingerprint[keyFingerprint].length).toBeGreaterThan(0);
  });
});























