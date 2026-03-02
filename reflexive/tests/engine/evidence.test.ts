import { describe, it, expect } from 'vitest';
import {
  evidenceStrength,
  claimEvidenceDensity,
} from '../../src/engine/evidence.js';
import type { EvidenceItem, ClaimEvidenceLink } from '../../src/engine/types.js';

describe('evidence', () => {
  const analysis_started_at = '2025-01-01T00:00:00Z';

  describe('evidenceStrength', () => {
    it('computes strength for stimulus_quote', () => {
      const e: EvidenceItem = {
        id: 'e1',
        claim_id: 'c1',
        content_text: 'The company reported revenue of $100M',
        source_type: 'stimulus_quote',
        as_of: '2025-01-01',
        possibly_stale: false,
      };
      const strength = evidenceStrength(e, analysis_started_at);
      expect(strength).toBeGreaterThan(0);
      expect(strength).toBeLessThanOrEqual(1.0);
    });

    it('applies recency factor for old evidence', () => {
      const e: EvidenceItem = {
        id: 'e1',
        claim_id: 'c1',
        content_text: 'Test',
        source_type: 'stimulus_quote',
        as_of: '2020-01-01',
        possibly_stale: false,
      };
      const strength = evidenceStrength(e, analysis_started_at);
      expect(strength).toBeLessThan(0.8); // Should be reduced by recency
    });

    it('applies stale multiplier', () => {
      const e: EvidenceItem = {
        id: 'e1',
        claim_id: 'c1',
        content_text: 'Test',
        source_type: 'stimulus_quote',
        as_of: '2025-01-01',
        possibly_stale: true,
      };
      const strength = evidenceStrength(e, analysis_started_at);
      expect(strength).toBeLessThan(0.8 * 0.5); // Should be reduced by stale multiplier
    });

    it('applies specificity factor for numeric data', () => {
      const e: EvidenceItem = {
        id: 'e1',
        claim_id: 'c1',
        content_text: 'Revenue: $100M',
        source_type: 'numeric_data',
        as_of: '2025-01-01',
        possibly_stale: false,
      };
      const strength = evidenceStrength(e, analysis_started_at);
      expect(strength).toBeGreaterThan(0.8); // High base * high specificity
    });
  });

  describe('claimEvidenceDensity', () => {
    it('returns 0.0 for no supporting evidence', () => {
      const density = claimEvidenceDensity(
        'c1',
        [],
        [],
        analysis_started_at
      );
      expect(density).toBe(0.0);
    });

    it('computes density with one evidence item', () => {
      const e: EvidenceItem = {
        id: 'e1',
        claim_id: 'c1',
        content_text: 'Test',
        source_type: 'stimulus_quote',
        as_of: '2025-01-01',
        possibly_stale: false,
      };
      const link: ClaimEvidenceLink = {
        claim_id: 'c1',
        evidence_item_id: 'e1',
        support_type: 'supports',
      };
      const density = claimEvidenceDensity(
        'c1',
        [e],
        [link],
        analysis_started_at
      );
      expect(density).toBeGreaterThan(0);
      expect(density).toBeLessThanOrEqual(1.0);
    });

    it('accumulates density with multiple evidence items', () => {
      const e1: EvidenceItem = {
        id: 'e1',
        claim_id: 'c1',
        content_text: 'Test 1',
        source_type: 'stimulus_quote',
        as_of: '2025-01-01',
        possibly_stale: false,
      };
      const e2: EvidenceItem = {
        id: 'e2',
        claim_id: 'c1',
        content_text: 'Test 2',
        source_type: 'numeric_data',
        as_of: '2025-01-01',
        possibly_stale: false,
      };
      const links: ClaimEvidenceLink[] = [
        { claim_id: 'c1', evidence_item_id: 'e1', support_type: 'supports' },
        { claim_id: 'c1', evidence_item_id: 'e2', support_type: 'supports' },
      ];
      const density = claimEvidenceDensity(
        'c1',
        [e1, e2],
        links,
        analysis_started_at
      );
      expect(density).toBeGreaterThan(0);
      // With 2 items, density should be higher than with 1
      const density1 = claimEvidenceDensity('c1', [e1], [links[0]], analysis_started_at);
      expect(density).toBeGreaterThan(density1);
    });
  });
});
