import { describe, it, expect } from 'vitest';
import { canonicalizeClaims } from '../../src/extraction/canonicalizer.js';
import type { ExtractedClaim } from '../../src/extraction/types.js';

function createClaim(
  id: string,
  candidate: string,
  statement: string = 'Test statement'
): ExtractedClaim {
  return {
    id,
    perspective_id: 'perspective-1',
    analysis_id: 'analysis-1',
    statement,
    category: 'factual',
    claim_kind: 'claim',
    confidence_weight: 0.5,
    evidence_basis: null,
    evidence_status: 'supported',
    about_entity_candidate: candidate,
    about_entity_canonical: null,
    validity: 'strict',
    polarity: null,
    scoring_eligible: true,
    as_of: '2025-02-07',
    valid_from: null,
    valid_until: null,
    expires_at: null,
    stale_unsupported: false,
    repairs: [],
  };
}

describe('canonicalizeClaims', () => {
  it('normalizes case: "HelioTech" and "heliotech" → same canonical', () => {
    const claims = [
      createClaim('1', 'HelioTech'),
      createClaim('2', 'heliotech'),
    ];
    canonicalizeClaims(claims, '');
    expect(claims[0].about_entity_canonical).toBe(claims[1].about_entity_canonical);
  });

  it('strips determiners: "The acquisition price" and "acquisition price" → same canonical', () => {
    const claims = [
      createClaim('1', 'The acquisition price'),
      createClaim('2', 'acquisition price'),
    ];
    canonicalizeClaims(claims, '');
    expect(claims[0].about_entity_canonical).toBe(claims[1].about_entity_canonical);
  });

  it('strips possessive: "HelioTech\'s revenue" → canonical without possessive', () => {
    const claim = createClaim('1', "HelioTech's revenue");
    canonicalizeClaims([claim], '');
    // The canonical should be normalized (lowercase, possessive stripped)
    const canonical = claim.about_entity_canonical || '';
    expect(canonical.toLowerCase()).not.toContain("'s");
    expect(canonical.toLowerCase()).toContain('heliotech');
  });

  it('keeps different entities separate: "HelioTech revenue" vs "HelioTech team morale"', () => {
    const claims = [
      createClaim('1', 'HelioTech revenue'),
      createClaim('2', 'HelioTech team morale'),
    ];
    canonicalizeClaims(claims, '');
    expect(claims[0].about_entity_canonical).not.toBe(claims[1].about_entity_canonical);
  });

  it('does not fuzzy-match short strings: "policy" vs "polity"', () => {
    const claims = [
      createClaim('1', 'policy'),
      createClaim('2', 'polity'),
    ];
    canonicalizeClaims(claims, '');
    // Both are < 6 chars, so no fuzzy matching
    // Each should get its own normalized canonical
    expect(claims[0].about_entity_canonical).toBe('policy');
    expect(claims[1].about_entity_canonical).toBe('polity');
    expect(claims[0].about_entity_canonical).not.toBe(claims[1].about_entity_canonical);
  });

  it('fuzzy-matches similar long strings: "HelioTech" vs "Heliotech"', () => {
    const claims = [
      createClaim('1', 'HelioTech'),
      createClaim('2', 'Heliotech'),
    ];
    canonicalizeClaims(claims, '');
    // Levenshtein distance is 1, both >= 6 chars, should match
    expect(claims[0].about_entity_canonical).toBe(claims[1].about_entity_canonical);
  });

  it('attempts fallback extraction for empty candidate', () => {
    const claim = createClaim('1', '', 'The "HelioTech" acquisition is promising');
    canonicalizeClaims([claim], 'The HelioTech company announced an acquisition');
    // Should extract "HelioTech" from quoted string
    expect(claim.about_entity_canonical).toBeTruthy();
    expect(claim.about_entity_canonical).not.toBe('unresolved');
  });

  it('marks as invalid when fallback extraction fails', () => {
    const claim = createClaim('1', '', 'This is a vague statement without proper nouns');
    canonicalizeClaims([claim], '');
    expect(claim.about_entity_canonical).toBe('unresolved');
    expect(claim.validity).toBe('invalid');
    expect(claim.scoring_eligible).toBe(false);
  });

  it('matches against stimulus entities', () => {
    const claim = createClaim('1', 'HelioTech');
    canonicalizeClaims([claim], 'The HelioTech company announced an acquisition');
    // Should match "HelioTech" from stimulus and preserve original case
    expect(claim.about_entity_canonical).toBe('HelioTech');
    expect(claim.repairs.some(r => r.includes('stimulus_match'))).toBe(true);
  });

  it('matches cross-claim: second claim snaps to first canonical', () => {
    const claims = [
      createClaim('1', 'HelioTech'),
      createClaim('2', 'heliotech'), // Different case
    ];
    canonicalizeClaims(claims, '');
    expect(claims[0].about_entity_canonical).toBe(claims[1].about_entity_canonical);
    expect(claims[1].repairs.some(r => r.includes('cross_claim_match'))).toBe(true);
  });
});
