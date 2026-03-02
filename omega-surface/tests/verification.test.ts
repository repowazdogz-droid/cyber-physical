import { describe, it, expect } from 'vitest';
import { verifyClaimsPostHoc } from '../src/verification/post-hoc.js';
import type { Claim } from '../src/verification/post-hoc.js';

describe('verifyClaimsPostHoc', () => {
  it('AT-SURFACE-011: correctly counts verified/unverified/contradicted/phantom', async () => {
    const claims: Claim[] = [
      { id: 'c1', text: 'Claim A', source_stage: 's1', verifiable: true },
      { id: 'c2', text: 'Claim B', source_stage: 's1', verifiable: true },
      { id: 'c3', text: 'Claim C', source_stage: 's1', verifiable: true },
      { id: 'c4', text: 'Claim D', source_stage: 's1', verifiable: false },
    ];
    const result = await verifyClaimsPostHoc(claims, async (claim) => {
      if (claim.id === 'c1')
        return { claim_id: claim.id, status: 'verified', confidence: 0.9 };
      if (claim.id === 'c2')
        return { claim_id: claim.id, status: 'unverified', confidence: 0 };
      if (claim.id === 'c3')
        return { claim_id: claim.id, status: 'phantom', confidence: 0 };
      return { claim_id: claim.id, status: 'unverified', confidence: 0 };
    });
    expect(result.summary.verified).toBe(1);
    expect(result.summary.unverified).toBe(2); // c2 + c4 (non-verifiable)
    expect(result.summary.phantom).toBe(1);
    expect(result.summary.contradicted).toBe(0);
    expect(result.coverage).toBeCloseTo(1 / 3);
    expect(result.phantom_count).toBe(1);
  });

  it('unverifiable claims get unverified status', async () => {
    const claims: Claim[] = [
      { id: 'u1', text: 'X', source_stage: 's1', verifiable: false },
    ];
    const result = await verifyClaimsPostHoc(claims, async () => ({
      claim_id: 'u1',
      status: 'verified',
      confidence: 1,
    }));
    expect(result.results[0].status).toBe('unverified');
  });

  it('empty claims returns zero counts', async () => {
    const result = await verifyClaimsPostHoc([], async () => ({
      claim_id: '',
      status: 'verified',
      confidence: 0,
    }));
    expect(result.summary.verified).toBe(0);
    expect(result.coverage).toBe(0);
  });
});
