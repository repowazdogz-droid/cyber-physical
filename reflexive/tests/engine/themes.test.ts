import { describe, it, expect } from 'vitest';
import { buildThemes } from '../../src/engine/themes.js';
import type { ClaimMatch } from '../../src/engine/matching.js';
import type { ExtractedClaim } from '../../src/extraction/types.js';

function createClaim(id: string, perspective_id: string): ExtractedClaim {
  return {
    id,
    perspective_id,
    analysis_id: 'analysis-1',
    statement: `Claim ${id}`,
    category: 'factual',
    claim_kind: 'claim',
    confidence_weight: 0.5,
    evidence_basis: null,
    evidence_status: 'supported',
    about_entity_candidate: 'Entity1',
    about_entity_canonical: 'Entity1',
    validity: 'strict',
    polarity: null,
    scoring_eligible: true,
    as_of: '2025-01-01',
    valid_from: null,
    valid_until: null,
    expires_at: null,
    stale_unsupported: false,
    repairs: [],
  };
}

describe('themes', () => {
  const perspectiveLensMap = new Map([
    ['perspective-1', { lens_id: 'lens-1' }],
    ['perspective-2', { lens_id: 'lens-2' }],
  ]);

  describe('buildThemes', () => {
    it('creates single theme from matched claims', () => {
      const claims = [
        createClaim('c1', 'perspective-1'),
        createClaim('c2', 'perspective-2'),
      ];
      const matches: ClaimMatch[] = [
        {
          claim_a_id: 'c1',
          claim_b_id: 'c2',
          lens_a_id: 'lens-1',
          lens_b_id: 'lens-2',
          similarity: 0.9,
          pass: 'soft_gate',
        },
      ];
      
      const themes = buildThemes(matches, claims, perspectiveLensMap);
      expect(themes.length).toBe(1);
      expect(themes[0].claim_ids).toContain('c1');
      expect(themes[0].claim_ids).toContain('c2');
      expect(themes[0].lens_ids.length).toBe(2);
    });

    it('creates orphan theme for unmatched claim', () => {
      const claims = [
        createClaim('c1', 'perspective-1'),
      ];
      const matches: ClaimMatch[] = [];
      
      const themes = buildThemes(matches, claims, perspectiveLensMap);
      expect(themes.length).toBe(1);
      expect(themes[0].claim_ids).toEqual(['c1']);
      expect(themes[0].lens_ids.length).toBe(1);
    });

    it('generates deterministic theme IDs', () => {
      const claims = [
        createClaim('c1', 'perspective-1'),
        createClaim('c2', 'perspective-2'),
      ];
      const matches: ClaimMatch[] = [
        {
          claim_a_id: 'c1',
          claim_b_id: 'c2',
          lens_a_id: 'lens-1',
          lens_b_id: 'lens-2',
          similarity: 0.9,
          pass: 'soft_gate',
        },
      ];
      
      const themes1 = buildThemes(matches, claims, perspectiveLensMap);
      const themes2 = buildThemes(matches, claims, perspectiveLensMap);
      
      expect(themes1[0].theme_id).toBe(themes2[0].theme_id);
    });
  });
});
