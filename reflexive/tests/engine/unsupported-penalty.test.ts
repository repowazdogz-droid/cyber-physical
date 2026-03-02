import { describe, it, expect } from 'vitest';
import { computeConfidence } from '../../src/engine/confidence.js';
import type { ExtractedClaim } from '../../src/extraction/types.js';

describe('Unsupported Penalty - Support Tier Rules', () => {
  it('Test: factual claims with stimulus support should have zero unsupported penalty', () => {
    const claims: ExtractedClaim[] = [
      {
        id: 'claim-1',
        perspective_id: 'p1',
        analysis_id: 'a1',
        statement: 'HelioTech has $200M annual revenue',
        category: 'factual',
        claim_kind: 'claim',
        confidence_weight: 0.8,
        evidence_basis: null,
        evidence_status: 'unsupported', // Marked unsupported but has stimulus evidence
        about_entity_candidate: 'HelioTech',
        about_entity_canonical: 'HelioTech',
        validity: 'strict',
        polarity: 'positive',
        scoring_eligible: true,
        as_of: '2025-02-07',
        valid_from: null,
        valid_until: null,
        expires_at: null,
        stale_unsupported: false,
        repairs: [],
      },
      {
        id: 'claim-2',
        perspective_id: 'p2',
        analysis_id: 'a1',
        statement: 'Revenue will grow at 15%',
        category: 'predictive',
        claim_kind: 'claim',
        confidence_weight: 0.6,
        evidence_basis: null,
        evidence_status: 'unsupported', // Marked unsupported, no evidence
        about_entity_candidate: 'Revenue',
        about_entity_canonical: null,
        validity: 'strict',
        polarity: 'positive',
        scoring_eligible: true,
        as_of: '2025-02-07',
        valid_from: null,
        valid_until: null,
        expires_at: null,
        stale_unsupported: false,
        repairs: [],
      },
    ];

    const evidence_items = [
      {
        id: 'ev-1',
        source_type: 'stimulus_quote',
      },
    ];

    const claim_evidence_links = [
      {
        claim_id: 'claim-1',
        evidence_item_id: 'ev-1',
        support_type: 'supports',
      },
      // claim-2 has no evidence links
    ];

    const result = computeConfidence(
      [], // convergence_points
      [], // divergence_points
      claims,
      0.5, // analysis_evidence_density
      2, // completed_lens_count
      2, // active_lens_count
      [], // lenses
      1, // theme_count
      new Map(), // perspectiveLensMap
      evidence_items as any,
      claim_evidence_links as any,
      '2025-02-07T00:00:00Z'
    );

    // Before: unsupported_penalty would include both claims
    // After: claim-1 (factual + stimulus) should contribute 0, claim-2 (no support) contributes full weight
    // Expected: penalty should be lower than if both contributed full weight
    
    // Verify penalty is computed (should be > 0 due to claim-2)
    expect(result.unsupported_penalty).toBeGreaterThan(0);
    
    // The penalty should reflect that claim-1 contributes 0 (factual + stimulus)
    // and claim-2 contributes full weight (no support)
    // So penalty should be approximately: (1/2 * 0.6) = 0.3 (plus stale ratio if any)
    // But we're computing mean weight, so it's more complex. Let's verify it's less than
    // what it would be if both contributed full weight (which would be ~0.7)
    expect(result.unsupported_penalty).toBeLessThan(0.7);
  });

  it('Test: predictive claims with stimulus support should have reduced penalty (*0.25)', () => {
    const claims: ExtractedClaim[] = [
      {
        id: 'claim-1',
        perspective_id: 'p1',
        analysis_id: 'a1',
        statement: 'Revenue will grow at 15%',
        category: 'predictive',
        claim_kind: 'claim',
        confidence_weight: 0.8,
        evidence_basis: null,
        evidence_status: 'unsupported',
        about_entity_candidate: 'Revenue',
        about_entity_canonical: null,
        validity: 'strict',
        polarity: 'positive',
        scoring_eligible: true,
        as_of: '2025-02-07',
        valid_from: null,
        valid_until: null,
        expires_at: null,
        stale_unsupported: false,
        repairs: [],
      },
    ];

    const evidence_items = [
      {
        id: 'ev-1',
        source_type: 'stimulus_quote',
      },
    ];

    const claim_evidence_links = [
      {
        claim_id: 'claim-1',
        evidence_item_id: 'ev-1',
        support_type: 'supports',
      },
    ];

    const result = computeConfidence(
      [],
      [],
      claims,
      0.5,
      2,
      2,
      [],
      1,
      new Map(),
      evidence_items as any,
      claim_evidence_links as any,
      '2025-02-07T00:00:00Z'
    );

    // Predictive claim with stimulus support should contribute 0.8 * 0.25 = 0.2
    // unsupported_ratio = 1/1 = 1.0
    // mean_unsupported_weight = 0.2
    // unsupported_penalty = 1.0 * 0.2 = 0.2
    expect(result.unsupported_penalty).toBeCloseTo(0.2, 2);
  });

  it('Test: claims with no evidence should have full penalty', () => {
    const claims: ExtractedClaim[] = [
      {
        id: 'claim-1',
        perspective_id: 'p1',
        analysis_id: 'a1',
        statement: 'Revenue will grow at 15%',
        category: 'predictive',
        claim_kind: 'claim',
        confidence_weight: 0.8,
        evidence_basis: null,
        evidence_status: 'unsupported',
        about_entity_candidate: 'Revenue',
        about_entity_canonical: null,
        validity: 'strict',
        polarity: 'positive',
        scoring_eligible: true,
        as_of: '2025-02-07',
        valid_from: null,
        valid_until: null,
        expires_at: null,
        stale_unsupported: false,
        repairs: [],
      },
    ];

    const result = computeConfidence(
      [],
      [],
      claims,
      0.5,
      2,
      2,
      [],
      1,
      new Map(),
      [], // No evidence items
      [], // No evidence links
      '2025-02-07T00:00:00Z'
    );

    // Claim with no evidence (tier C) should contribute full weight
    // unsupported_ratio = 1/1 = 1.0
    // mean_unsupported_weight = 0.8
    // unsupported_penalty = 1.0 * 0.8 = 0.8
    expect(result.unsupported_penalty).toBeCloseTo(0.8, 2);
  });
});
