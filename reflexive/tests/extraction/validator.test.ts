import { describe, it, expect } from 'vitest';
import { validateAndRepairClaim, validateTier1 } from '../../src/extraction/validator.js';

describe('validateTier1', () => {
  it('passes valid assessment', () => {
    const valid = {
      claims: [{ statement: 'Test', category: 'factual' }],
    };
    const result = validateTier1(valid, '{"claims":[]}');
    expect(result.pass).toBe(true);
  });

  it('rejects null', () => {
    const result = validateTier1(null, 'null');
    expect(result.pass).toBe(false);
    expect(result.errors.some(e => e.includes('object'))).toBe(true);
  });

  it('rejects array', () => {
    const result = validateTier1([], '[]');
    expect(result.pass).toBe(false);
  });

  it('rejects missing claims', () => {
    const result = validateTier1({}, '{}');
    expect(result.pass).toBe(false);
    expect(result.errors.some(e => e.includes('claims'))).toBe(true);
  });

  it('rejects empty claims array', () => {
    const result = validateTier1({ claims: [] }, '{"claims":[]}');
    expect(result.pass).toBe(false);
    expect(result.errors.some(e => e.includes('at least one'))).toBe(true);
  });

  it('rejects markdown fences in raw response', () => {
    const valid = { claims: [{ statement: 'Test' }] };
    const result = validateTier1(valid, '```json\n{}```');
    expect(result.pass).toBe(false);
    expect(result.errors.some(e => e.includes('markdown'))).toBe(true);
  });
});

describe('validateAndRepairClaim', () => {
  const analysisDate = '2025-02-07';

  it('repairs category "fact" to "factual"', () => {
    const claim = {
      statement: 'Test',
      category: 'fact',
      claim_kind: 'claim',
      confidence_weight: 0.5,
      as_of: '2025-02-07',
    };
    const result = validateAndRepairClaim(claim, 0, analysisDate);
    expect(result.claim).toBeTruthy();
    expect(result.claim!.category).toBe('factual');
    expect(result.validity).toBe('repaired');
  });

  it('repairs category "assumption" and sets claim_kind', () => {
    const claim = {
      statement: 'Test',
      category: 'assumption',
      claim_kind: 'claim',
      confidence_weight: 0.5,
      as_of: '2025-02-07',
    };
    const result = validateAndRepairClaim(claim, 0, analysisDate);
    expect(result.claim).toBeTruthy();
    expect(result.claim!.category).toBe('inferential');
    expect(result.claim!.claim_kind).toBe('assumption');
  });

  it('clamps confidence_weight > 1.0', () => {
    const claim = {
      statement: 'Test',
      category: 'factual',
      claim_kind: 'claim',
      confidence_weight: 1.5,
      as_of: '2025-02-07',
    };
    const result = validateAndRepairClaim(claim, 0, analysisDate);
    expect(result.claim).toBeTruthy();
    expect(result.claim!.confidence_weight).toBe(1.0);
    expect(result.validity).toBe('repaired');
  });

  it('clamps confidence_weight < 0.0', () => {
    const claim = {
      statement: 'Test',
      category: 'factual',
      claim_kind: 'claim',
      confidence_weight: -0.3,
      as_of: '2025-02-07',
    };
    const result = validateAndRepairClaim(claim, 0, analysisDate);
    expect(result.claim).toBeTruthy();
    expect(result.claim!.confidence_weight).toBe(0.0);
  });

  it('defaults missing confidence_weight to 0.5', () => {
    const claim = {
      statement: 'Test',
      category: 'factual',
      claim_kind: 'claim',
      as_of: '2025-02-07',
    };
    const result = validateAndRepairClaim(claim, 0, analysisDate);
    expect(result.claim).toBeTruthy();
    expect(result.claim!.confidence_weight).toBe(0.5);
  });

  it('drops claim with missing statement', () => {
    const claim = {
      category: 'factual',
      claim_kind: 'claim',
      confidence_weight: 0.5,
      as_of: '2025-02-07',
    };
    const result = validateAndRepairClaim(claim, 0, analysisDate);
    expect(result.claim).toBeNull();
  });

  it('truncates statement over 300 chars', () => {
    const longStatement = 'a'.repeat(350);
    const claim = {
      statement: longStatement,
      category: 'factual',
      claim_kind: 'claim',
      confidence_weight: 0.5,
      as_of: '2025-02-07',
    };
    const result = validateAndRepairClaim(claim, 0, analysisDate);
    expect(result.claim).toBeTruthy();
    if (result.claim && result.claim.statement) {
      expect(result.claim.statement.length).toBe(300);
    }
  });

  it('truncates about_entity_candidate over 100 chars', () => {
    const longEntity = 'a'.repeat(150);
    const claim = {
      statement: 'Test',
      category: 'factual',
      claim_kind: 'claim',
      confidence_weight: 0.5,
      about_entity_candidate: longEntity,
      as_of: '2025-02-07',
    };
    const result = validateAndRepairClaim(claim, 0, analysisDate);
    expect(result.claim).toBeTruthy();
    if (result.claim && result.claim.about_entity_candidate) {
      expect(result.claim.about_entity_candidate.length).toBe(100);
    }
  });

  it('defaults missing as_of to analysis_date', () => {
    const claim = {
      statement: 'Test',
      category: 'factual',
      claim_kind: 'claim',
      confidence_weight: 0.5,
    };
    const result = validateAndRepairClaim(claim, 0, analysisDate);
    expect(result.claim).toBeTruthy();
    expect(result.claim!.as_of).toBe(analysisDate);
  });

  it('returns strict validity for all valid fields', () => {
    const claim = {
      statement: 'Test',
      category: 'factual',
      claim_kind: 'claim',
      confidence_weight: 0.8,
      as_of: '2025-02-07',
    };
    const result = validateAndRepairClaim(claim, 0, analysisDate);
    expect(result.validity).toBe('strict');
    expect(result.repairs.length).toBe(0);
  });

  it('returns invalid validity for 3+ repairs', () => {
    const claim = {
      statement: 'Test',
      category: 'invalid_category',
      claim_kind: 'invalid_kind',
      confidence_weight: 1.5,
      as_of: 'invalid-date',
    };
    const result = validateAndRepairClaim(claim, 0, analysisDate);
    expect(result.validity).toBe('invalid');
  });
});
