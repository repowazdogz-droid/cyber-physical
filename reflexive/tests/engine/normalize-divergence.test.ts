import { describe, it, expect } from 'vitest';
import { normalizeDivergencePoints } from '../../src/engine/normalize-divergence.js';
import type { DivergencePoint } from '../../src/engine/types.js';

/**
 * Unit test fixture using the exact theme_label from user request:
 * "HelioTech has $200M in annual revenue growing at 15% year-over-year."
 */

describe('Normalize Divergence Points', () => {
  it('Test: theme with 3 identical positions should convert to convergence', () => {
    const divergencePoints: DivergencePoint[] = [
      {
        theme_id: 'theme-1',
        theme_label: 'HelioTech has $200M in annual revenue growing at 15% year-over-year.',
        positions: [
          {
            lens_id: 'lens-1',
            claim_ids: ['claim-1'],
            position_summary: 'HelioTech has $200M in annual revenue growing at 15% year-over-year.',
          },
          {
            lens_id: 'lens-2',
            claim_ids: ['claim-2'],
            position_summary: 'HelioTech has $200M in annual revenue growing at 15% year-over-year.',
          },
          {
            lens_id: 'lens-3',
            claim_ids: ['claim-3'],
            position_summary: 'HelioTech has $200M in annual revenue growing at 15% year-over-year.',
          },
        ],
        nature: 'contradictory',
        severity: 0.8,
      },
    ];

    const result = normalizeDivergencePoints(divergencePoints);

    // Assert: divergence_count decreases by 1 and convergence_count increases by 1
    expect(result.remainingDivergencePoints.length).toBe(0);
    expect(result.normalizedConvergencePoints.length).toBe(1);
    
    const convergence = result.normalizedConvergencePoints[0];
    expect(convergence.theme_label).toBe('HelioTech has $200M in annual revenue growing at 15% year-over-year.');
    expect(convergence.supporting_lenses).toHaveLength(3);
    expect(convergence.supporting_lenses).toContain('lens-1');
    expect(convergence.supporting_lenses).toContain('lens-2');
    expect(convergence.supporting_lenses).toContain('lens-3');
    expect(convergence.supporting_claims).toHaveLength(3);
    expect(convergence.strength).toBe(0.8);
  });

  it('Test: theme with dissimilar positions should remain divergence', () => {
    const divergencePoints: DivergencePoint[] = [
      {
        theme_id: 'theme-2',
        theme_label: 'Revenue growth trajectory',
        positions: [
          {
            lens_id: 'lens-1',
            claim_ids: ['claim-1'],
            position_summary: 'Revenue will grow at 15% annually.',
          },
          {
            lens_id: 'lens-2',
            claim_ids: ['claim-2'],
            position_summary: 'Revenue will decline due to market saturation.',
          },
        ],
        nature: 'contradictory',
        severity: 0.9,
      },
    ];

    const result = normalizeDivergencePoints(divergencePoints);

    // Assert: remains as divergence
    expect(result.remainingDivergencePoints.length).toBe(1);
    expect(result.normalizedConvergencePoints.length).toBe(0);
    expect(result.remainingDivergencePoints[0].theme_id).toBe('theme-2');
  });

  it('Test: theme with high overlap (>= 0.85) should convert to convergence', () => {
    const divergencePoints: DivergencePoint[] = [
      {
        theme_id: 'theme-3',
        theme_label: 'Engineering team strength',
        positions: [
          {
            lens_id: 'lens-1',
            claim_ids: ['claim-1'],
            position_summary: 'HelioTech has strong engineering team of 150 engineers.',
          },
          {
            lens_id: 'lens-2',
            claim_ids: ['claim-2'],
            position_summary: 'HelioTech has strong engineering team of 150 engineers.',
          },
        ],
        nature: 'contradictory',
        severity: 0.7,
      },
    ];

    const result = normalizeDivergencePoints(divergencePoints);

    // Assert: converts to convergence due to high overlap (exact match)
    expect(result.remainingDivergencePoints.length).toBe(0);
    expect(result.normalizedConvergencePoints.length).toBe(1);
  });
});
