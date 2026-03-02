import { describe, it, expect } from 'vitest';
import { detectContradictions } from '../../src/engine/contradiction.js';
import type { Theme } from '../../src/engine/themes.js';
import type { ScopeResult } from '../../src/engine/scope.js';
import type { ExtractedClaim } from '../../src/extraction/types.js';

function createClaim(
  id: string,
  perspective_id: string,
  polarity: 'positive' | 'negative' | 'neutral' | null = null,
  statement: string = `Claim ${id}`
): ExtractedClaim {
  return {
    id,
    perspective_id,
    analysis_id: 'analysis-1',
    statement,
    category: 'factual',
    claim_kind: 'claim',
    confidence_weight: 0.5,
    evidence_basis: null,
    evidence_status: 'supported',
    about_entity_candidate: 'Entity1',
    about_entity_canonical: 'Entity1',
    validity: 'strict',
    polarity,
    scoring_eligible: true,
    as_of: '2025-01-01',
    valid_from: null,
    valid_until: null,
    expires_at: null,
    stale_unsupported: false,
    repairs: [],
  };
}

describe('contradiction', () => {
  const perspectiveLensMap = new Map([
    ['perspective-1', { lens_id: 'lens-1' }],
    ['perspective-2', { lens_id: 'lens-2' }],
  ]);

  describe('detectContradictions', () => {
    it('detects polarity opposition', () => {
      const claims = [
        createClaim('c1', 'perspective-1', 'positive'),
        createClaim('c2', 'perspective-2', 'negative'),
      ];
      const theme: Theme = {
        theme_id: 'theme-1',
        claim_ids: ['c1', 'c2'],
        lens_ids: ['lens-1', 'lens-2'],
        strength: 0.5,
        label: '',
      };
      const scopeResults: ScopeResult[] = [];
      
      const results = detectContradictions([theme], claims, scopeResults, perspectiveLensMap);
      const contradiction = results.find(r => r.contradictory);
      expect(contradiction).toBeDefined();
      expect(contradiction?.rule).toBe('polarity_opposition');
    });

    it('detects explicit opposition', () => {
      const claims = [
        createClaim('c1', 'perspective-1', null, 'The project is viable'),
        createClaim('c2', 'perspective-2', null, 'The project is unviable'),
      ];
      const theme: Theme = {
        theme_id: 'theme-1',
        claim_ids: ['c1', 'c2'],
        lens_ids: ['lens-1', 'lens-2'],
        strength: 0.5,
        label: '',
      };
      const scopeResults: ScopeResult[] = [];
      
      const results = detectContradictions([theme], claims, scopeResults, perspectiveLensMap);
      const contradiction = results.find(r => r.contradictory);
      expect(contradiction).toBeDefined();
      expect(contradiction?.rule).toBe('explicit_opposition');
    });

    it('skips scope-dependent pairs', () => {
      const claims = [
        createClaim('c1', 'perspective-1', 'positive'),
        createClaim('c2', 'perspective-2', 'negative'),
      ];
      const theme: Theme = {
        theme_id: 'theme-1',
        claim_ids: ['c1', 'c2'],
        lens_ids: ['lens-1', 'lens-2'],
        strength: 0.5,
        label: '',
      };
      const scopeResults: ScopeResult[] = [
        {
          claim_a_id: 'c1',
          claim_b_id: 'c2',
          scope_dependent: true,
          reason: 'temporal_non_overlap',
        },
      ];
      
      const results = detectContradictions([theme], claims, scopeResults, perspectiveLensMap);
      const contradiction = results.find(r => r.contradictory);
      expect(contradiction).toBeUndefined();
    });
  });
});
