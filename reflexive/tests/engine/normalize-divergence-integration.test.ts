import { describe, it, expect } from 'vitest';
import { computeSynthesis } from '../../src/engine/index.js';
import type { EngineInput } from '../../src/engine/types.js';
import type { ExtractedClaim } from '../../src/extraction/types.js';

/**
 * Integration test: Divergence normalization affects confidence computation.
 * 
 * Tests the exact case from user request:
 * theme_label: "HelioTech has $200M in annual revenue growing at 15% year-over-year."
 * 3 positions with identical summaries.
 * 
 * Assert: divergence_count decreases, convergence_count increases, divergence_penalty decreases.
 */
describe('Divergence Normalization Integration', () => {
  it('Test: identical position summaries → normalized to convergence, divergence_penalty decreases', async () => {
    // Create mock claims - all identical statements so they'll match into a theme
    // They'll be marked as contradictory (false positive), but position_summary will be identical
    const statement = 'HelioTech has $200M in annual revenue growing at 15% year-over-year.';
    const claims: ExtractedClaim[] = [
      {
        id: 'claim-1',
        perspective_id: 'perspective-0',
        analysis_id: 'analysis-1',
        statement,
        category: 'factual' as const,
        claim_kind: 'claim' as const,
        confidence_weight: 0.8,
        evidence_basis: null,
        evidence_status: 'supported' as const,
        about_entity_candidate: 'HelioTech',
        about_entity_canonical: 'HelioTech',
        validity: 'strict' as const,
        polarity: 'positive' as const, // Different polarity to trigger contradiction detection
        scoring_eligible: true,
        as_of: new Date().toISOString(),
        valid_from: null,
        valid_until: null,
        expires_at: null,
        stale_unsupported: false,
        repairs: [],
      },
      {
        id: 'claim-2',
        perspective_id: 'perspective-1',
        analysis_id: 'analysis-1',
        statement,
        category: 'factual' as const,
        claim_kind: 'claim' as const,
        confidence_weight: 0.8,
        evidence_basis: null,
        evidence_status: 'supported' as const,
        about_entity_candidate: 'HelioTech',
        about_entity_canonical: 'HelioTech',
        validity: 'strict' as const,
        polarity: 'negative' as const, // Different polarity to trigger contradiction detection
        scoring_eligible: true,
        as_of: new Date().toISOString(),
        valid_from: null,
        valid_until: null,
        expires_at: null,
        stale_unsupported: false,
        repairs: [],
      },
      {
        id: 'claim-3',
        perspective_id: 'perspective-2',
        analysis_id: 'analysis-1',
        statement,
        category: 'factual' as const,
        claim_kind: 'claim' as const,
        confidence_weight: 0.8,
        evidence_basis: null,
        evidence_status: 'supported' as const,
        about_entity_candidate: 'HelioTech',
        about_entity_canonical: 'HelioTech',
        validity: 'strict' as const,
        polarity: 'neutral' as const, // Different polarity to trigger contradiction detection
        scoring_eligible: true,
        as_of: new Date().toISOString(),
        valid_from: null,
        valid_until: null,
        expires_at: null,
        stale_unsupported: false,
        repairs: [],
      },
    ];

    // Create mock perspectives
    const perspectives = [
      {
        lens_id: 'lens-analytical',
        lens_name: 'analytical',
        lens_orientation: 'convergent' as const,
        state: 'completed' as const,
      },
      {
        lens_id: 'lens-adversarial',
        lens_name: 'adversarial',
        lens_orientation: 'divergent' as const,
        state: 'completed' as const,
      },
      {
        lens_id: 'lens-historical',
        lens_name: 'historical',
        lens_orientation: 'convergent' as const,
        state: 'completed' as const,
      },
    ];

    // Create embeddings - all claims are identical so use same vector to ensure they match
    const embeddings = new Map<string, number[]>();
    const baseVector = new Array(768).fill(0);
    baseVector[0] = 1.0; // Unit vector along dimension 0
    for (const claim of claims) {
      embeddings.set(claim.id, baseVector);
    }

    // Build EngineInput
    const input: EngineInput = {
      analysis_id: 'analysis-1',
      case_id: 'case-1',
      stimulus: {
        text: 'Should we acquire HelioTech for $500M?',
        type: 'decision' as const,
      },
      context_snapshot: [],
      perspectives: perspectives.map((p, i) => ({
        id: `perspective-${i}`,
        lens_id: p.lens_id,
        lens_name: p.lens_name,
        lens_orientation: p.lens_orientation,
        lens_version: 1,
        state: p.state,
      })),
      claims,
      evidence_items: [],
      claim_evidence_links: [],
      prior_syntheses: [], // Empty - no prior synthesis
    };

    // Compute synthesis
    const output = await computeSynthesis(input, embeddings);

    // Access synthesis from output
    const synthesis = output.synthesis;
    expect(synthesis).toBeDefined();

    // Assert: divergence_count should be 0 (normalized away)
    expect(synthesis.divergence_points.length).toBe(0);

    // Assert: convergence_count should be >= 1 (the normalized convergence)
    expect(synthesis.convergence_points.length).toBeGreaterThanOrEqual(1);
    
    // Find the normalized convergence point
    const normalizedConvergence = synthesis.convergence_points.find(
      cp => cp.theme_label?.includes('$200M') || cp.supporting_claims.includes('claim-1')
    );
    expect(normalizedConvergence).toBeDefined();
    if (normalizedConvergence) {
      expect(normalizedConvergence.supporting_claims).toHaveLength(3);
      expect(normalizedConvergence.supporting_lenses).toHaveLength(3);
    }

    // Assert: divergence_penalty should be lower than if normalization didn't happen
    // (If normalization didn't happen, we'd have 1 divergence with 3 positions)
    const divergencePenalty = synthesis.confidence_breakdown?.divergence_penalty ?? 0;
    
    // With normalization: 0 divergences → divergence_penalty should be 0 or very low
    // Without normalization: 1 divergence with 3 positions → divergence_penalty would be higher
    expect(divergencePenalty).toBeLessThanOrEqual(0.1); // Should be near zero

    // Verify confidence breakdown reflects the normalization
    expect(synthesis.confidence_breakdown).toBeDefined();
    if (synthesis.confidence_breakdown) {
      // Divergence penalty should be minimal since all divergences were normalized
      expect(synthesis.confidence_breakdown.divergence_penalty).toBeLessThanOrEqual(0.1);
    }
  });
});
