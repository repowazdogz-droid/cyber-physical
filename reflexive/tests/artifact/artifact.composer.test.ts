import { describe, it, expect } from 'vitest';
import { extractVarianceDriver } from '../../src/domain/artifact/artifact.classifiers.js';
import { extractConfidenceForces } from '../../src/domain/artifact/artifact.classifiers.js';
import { classifyEpistemicTiers } from '../../src/domain/artifact/artifact.classifiers.js';
import { computeDecisionPosture } from '../../src/domain/artifact/artifact.classifiers.js';
import type { ExtractedClaim, EvidenceItem, ClaimEvidenceLink } from '../../src/domain/artifact/artifact.types.js';

describe('Artifact Composer - Variance Driver', () => {
  it('Test A: variance driver rule - divergence=0, external=0, input=100', () => {
    const divergencePoints: any[] = [];
    const convergencePoints: any[] = [];
    const divergenceCount = 0;
    const externalCoveragePercent = 0;
    const inputCoveragePercent = 100;

    const result = extractVarianceDriver(
      divergencePoints,
      convergencePoints,
      divergenceCount,
      externalCoveragePercent,
      inputCoveragePercent
    );

    expect(result).toBe('External corroboration absent (stimulus-bound evidence only)');
  });
});

describe('Artifact Composer - Confidence Forces', () => {
  it('Test B: compression forces rule - external=0, unsupportedCount=0', () => {
    const confidenceBreakdown = {
      agreement_factor: 0.5,
      evidence_density_factor: 0.3,
      unsupported_penalty: 0,
      divergence_penalty: 0,
      lens_count_factor: 1,
      raw_score: 0.5,
      final_score: 0.5,
      drift_flags: [],
      low_evidence_warning: false,
      high_contradiction_warning: false,
      per_lens: [],
      per_theme: [],
    };
    const convergenceCount = 2;
    const divergenceCount = 0;
    const externalCoveragePercent = 0;
    const unsupportedCount = 0;

    const result = extractConfidenceForces(
      confidenceBreakdown,
      convergenceCount,
      divergenceCount,
      externalCoveragePercent,
      unsupportedCount
    );

    // Expect: compressionForces includes "External evidence coverage below threshold"
    expect(result.compression).toContain('External evidence coverage below threshold');

    // Expect: compressionForces NOT includes "Significant unsupported claims"
    expect(result.compression).not.toContain('Significant unsupported claims');

    // Expect: compressionForces NOT includes "Forward-state claims remain unsupported"
    expect(result.compression).not.toContain('Forward-state claims remain unsupported');
  });
});

describe('Artifact Composer - Posture and Evidence', () => {
  it('Test C: externalCoverage=0, inputCoverage=100, divergence=0 => posture must be DELAY', () => {
    const confidenceScore = 0.5;
    const convergenceCount = 2;
    const divergenceCount = 0;
    const band = 'Moderate';
    const coveragePercent = 0; // External coverage
    const externalCoveragePercent = 0;

    const result = computeDecisionPosture(
      confidenceScore,
      convergenceCount,
      divergenceCount,
      band,
      coveragePercent,
      externalCoveragePercent
    );

    expect(result.posture).toBe('DELAY');
  });
});

describe('Artifact Composer - Epistemic Tiering', () => {
  it('Test D: stimulus-only evidence => no claims classified as OBSERVED', () => {
    const claims: ExtractedClaim[] = [
      {
        id: 'claim-1',
        perspective_id: 'p1',
        analysis_id: 'a1',
        statement: 'HelioTech has strong engineering team',
        category: 'factual',
        claim_kind: 'claim',
        confidence_weight: 0.8,
        evidence_basis: null,
        evidence_status: 'supported',
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
    ];
    const evidenceLinks: ClaimEvidenceLink[] = [
      {
        claim_id: 'claim-1',
        evidence_item_id: 'ev-1',
        support_type: 'supports',
      },
    ];
    const evidenceItems: EvidenceItem[] = [
      {
        id: 'ev-1',
        content_text: 'Engineering team of 150 engineers',
        source_type: 'stimulus_quote',
        as_of: '2025-02-07',
        possibly_stale: false,
      },
    ];

    const result = classifyEpistemicTiers(claims, evidenceLinks, evidenceItems);

    // No claims should be OBSERVED if they only have stimulus_quote evidence
    const observedCount = result.stratification.find(s => s.tier === 'OBSERVED')?.claimCount || 0;
    expect(observedCount).toBe(0);

    // Claim should be CONDITIONAL
    expect(result.claimTierById['claim-1']).toBe('CONDITIONAL');
  });
});
