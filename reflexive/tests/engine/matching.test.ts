import { describe, it, expect } from 'vitest';
import { matchClaims } from '../../src/engine/matching.js';
import type { ExtractedClaim } from '../../src/extraction/types.js';

function createClaim(
  id: string,
  perspective_id: string,
  category: string = 'factual',
  entity: string = 'Entity1'
): ExtractedClaim {
  return {
    id,
    perspective_id,
    analysis_id: 'analysis-1',
    statement: `Claim ${id}`,
    category: category as any,
    claim_kind: 'claim',
    confidence_weight: 0.5,
    evidence_basis: null,
    evidence_status: 'supported',
    about_entity_candidate: entity,
    about_entity_canonical: entity,
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

function makeVector(dims: number, ...nonzero: Array<[number, number]>): number[] {
  const v = new Array(dims).fill(0);
  for (const [idx, val] of nonzero) {
    v[idx] = val;
  }
  return v;
}

describe('matching', () => {
  const perspectiveLensMap = new Map([
    ['perspective-1', { lens_id: 'lens-1', lens_name: 'Analytical', lens_orientation: 'convergent' }],
    ['perspective-2', { lens_id: 'lens-2', lens_name: 'Adversarial', lens_orientation: 'divergent' }],
  ]);

  describe('matchClaims', () => {
    it('passes hard gate: same category and entity', () => {
      const claims = [
        createClaim('c1', 'perspective-1', 'factual', 'Entity1'),
        createClaim('c2', 'perspective-2', 'factual', 'Entity1'),
      ];
      // Create vectors with high cosine similarity (>0.86)
      const v1 = makeVector(768, [0, 1], [1, 0.99]);
      const v2 = makeVector(768, [0, 1], [1, 0.99]);
      const embeddings = new Map([
        ['c1', v1],
        ['c2', v2],
      ]);
      
      const matches = matchClaims(claims, embeddings, [], perspectiveLensMap);
      expect(matches.length).toBeGreaterThan(0);
    });

    it('fails hard gate: different category', () => {
      const claims = [
        createClaim('c1', 'perspective-1', 'factual', 'Entity1'),
        createClaim('c2', 'perspective-2', 'evaluative', 'Entity1'),
      ];
      const embeddings = new Map([
        ['c1', makeVector(768, [0, 1])],
        ['c2', makeVector(768, [0, 1])],
      ]);
      
      const matches = matchClaims(claims, embeddings, [], perspectiveLensMap);
      expect(matches.length).toBe(0);
    });

    it('fails hard gate: different entity', () => {
      const claims = [
        createClaim('c1', 'perspective-1', 'factual', 'Entity1'),
        createClaim('c2', 'perspective-2', 'factual', 'Entity2'),
      ];
      const embeddings = new Map([
        ['c1', makeVector(768, [0, 1])],
        ['c2', makeVector(768, [0, 1])],
      ]);
      
      const matches = matchClaims(claims, embeddings, [], perspectiveLensMap);
      expect(matches.length).toBe(0);
    });

    it('matches when similarity >= SIM_MATCH', () => {
      const claims = [
        createClaim('c1', 'perspective-1', 'factual', 'Entity1'),
        createClaim('c2', 'perspective-2', 'factual', 'Entity1'),
      ];
      // Create vectors with cosine sim > 0.86
      const v1 = makeVector(768, [0, 1], [1, 0.99]);
      const v2 = makeVector(768, [0, 1], [1, 0.99]);
      const embeddings = new Map([
        ['c1', v1],
        ['c2', v2],
      ]);
      
      const matches = matchClaims(claims, embeddings, [], perspectiveLensMap);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].pass).toBe('soft_gate');
    });

    it('does not match when similarity < SIM_REJECT', () => {
      const claims = [
        createClaim('c1', 'perspective-1', 'factual', 'Entity1'),
        createClaim('c2', 'perspective-2', 'factual', 'Entity1'),
      ];
      // Create vectors with cosine sim < 0.82
      const embeddings = new Map([
        ['c1', makeVector(768, [0, 1])],
        ['c2', makeVector(768, [1, 0])], // Orthogonal vectors
      ]);
      
      const matches = matchClaims(claims, embeddings, [], perspectiveLensMap);
      expect(matches.length).toBe(0);
    });
  });
});
