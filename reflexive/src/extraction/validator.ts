import type { RawClaim, RawAssessment, RepairLog } from './types.js';

const CATEGORY_SYNONYMS: Record<string, string> = {
  'fact': 'factual',
  'facts': 'factual',
  'prediction': 'predictive',
  'opinion': 'evaluative',
  'guess': 'inferential',
  'assessment': 'evaluative',
  'assumption': 'inferential',
};

const VALID_CATEGORIES = ['factual', 'inferential', 'evaluative', 'predictive'] as const;
const VALID_CLAIM_KINDS = ['claim', 'assumption'] as const;

/**
 * Tier 1 validation: Hard reject if any check fails.
 * Returns pass status and error messages.
 */
export function validateTier1(parsed: unknown, raw_response: string): { pass: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check 1: parsed is an object (not null, not array)
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    errors.push('Output must be a JSON object, not null or array');
    return { pass: false, errors };
  }

  const obj = parsed as Record<string, unknown>;

  // Check 2: claims array exists
  if (!('claims' in obj) || !Array.isArray(obj.claims)) {
    errors.push('Output must contain a "claims" array');
    return { pass: false, errors };
  }

  // Check 3: at least one claim
  if (obj.claims.length < 1) {
    errors.push('Output must contain at least one claim');
    return { pass: false, errors };
  }

  // Check 4: no markdown code fences in raw response (before parsing)
  if (raw_response.includes('```')) {
    errors.push('Output contains markdown code fences (```) - this is not allowed');
    return { pass: false, errors };
  }

  return { pass: true, errors: [] };
}

/**
 * Tier 2 validation and repair: Repair field-level errors with defaults.
 * Returns repaired claim, repair log, and validity classification.
 */
export function validateAndRepairClaim(
  claim: RawClaim,
  claim_index: number,
  analysis_date: string
): { claim: RawClaim | null; repairs: RepairLog[]; validity: 'strict' | 'repaired' | 'invalid' } {
  const repairs: RepairLog[] = [];
  const repaired: RawClaim = { ...claim };

  // Statement repair: if missing, drop the claim
  if (!repaired.statement || repaired.statement.trim() === '') {
    repairs.push({
      claim_index,
      field: 'statement',
      original_value: repaired.statement,
      repaired_value: null,
      rule: 'Missing statement - claim dropped',
    });
    return { claim: null, repairs, validity: 'invalid' };
  }

  // Statement truncation
  if (repaired.statement.length > 300) {
    const original = repaired.statement;
    repaired.statement = repaired.statement.substring(0, 300);
    repairs.push({
      claim_index,
      field: 'statement',
      original_value: original,
      repaired_value: repaired.statement,
      rule: 'Statement truncated to 300 characters',
    });
  }

  // Category repair
  let categoryRepaired = false;
  if (!repaired.category || !VALID_CATEGORIES.includes(repaired.category as typeof VALID_CATEGORIES[number])) {
    const original = repaired.category;
    if (repaired.category && CATEGORY_SYNONYMS[repaired.category.toLowerCase()]) {
      repaired.category = CATEGORY_SYNONYMS[repaired.category.toLowerCase()];
      repairs.push({
        claim_index,
        field: 'category',
        original_value: original,
        repaired_value: repaired.category,
        rule: `Category mapped from synonym: ${original} → ${repaired.category}`,
      });
      categoryRepaired = true;
    } else {
      repaired.category = 'inferential';
      repairs.push({
        claim_index,
        field: 'category',
        original_value: original,
        repaired_value: repaired.category,
        rule: 'Category defaulted to "inferential"',
      });
      categoryRepaired = true;
    }
  }

  // If category was "assumption", also set claim_kind
  if (claim.category?.toLowerCase() === 'assumption') {
    if (repaired.claim_kind !== 'assumption') {
      repairs.push({
        claim_index,
        field: 'claim_kind',
        original_value: repaired.claim_kind,
        repaired_value: 'assumption',
        rule: 'claim_kind set to "assumption" because category was "assumption"',
      });
      repaired.claim_kind = 'assumption';
    }
  }

  // claim_kind repair
  if (!repaired.claim_kind || !VALID_CLAIM_KINDS.includes(repaired.claim_kind as typeof VALID_CLAIM_KINDS[number])) {
    const original = repaired.claim_kind;
    repaired.claim_kind = 'claim';
    repairs.push({
      claim_index,
      field: 'claim_kind',
      original_value: original,
      repaired_value: repaired.claim_kind,
      rule: 'claim_kind defaulted to "claim"',
    });
  }

  // confidence_weight repair
  let weightRepaired = false;
  if (repaired.confidence_weight === undefined || repaired.confidence_weight === null) {
    repaired.confidence_weight = 0.5;
    repairs.push({
      claim_index,
      field: 'confidence_weight',
      original_value: claim.confidence_weight,
      repaired_value: 0.5,
      rule: 'confidence_weight defaulted to 0.5',
    });
    weightRepaired = true;
  } else {
    const num = typeof repaired.confidence_weight === 'number'
      ? repaired.confidence_weight
      : parseFloat(String(repaired.confidence_weight));

    if (isNaN(num)) {
      repaired.confidence_weight = 0.5;
      repairs.push({
        claim_index,
        field: 'confidence_weight',
        original_value: claim.confidence_weight,
        repaired_value: 0.5,
        rule: 'confidence_weight parsed as NaN, defaulted to 0.5',
      });
      weightRepaired = true;
    } else {
      const original = repaired.confidence_weight;
      if (num < 0.0) {
        repaired.confidence_weight = 0.0;
        repairs.push({
          claim_index,
          field: 'confidence_weight',
          original_value: original,
          repaired_value: 0.0,
          rule: 'confidence_weight clamped to 0.0',
        });
        weightRepaired = true;
      } else if (num > 1.0) {
        repaired.confidence_weight = 1.0;
        repairs.push({
          claim_index,
          field: 'confidence_weight',
          original_value: original,
          repaired_value: 1.0,
          rule: 'confidence_weight clamped to 1.0',
        });
        weightRepaired = true;
      } else {
        repaired.confidence_weight = num;
      }
    }
  }

  // about_entity_candidate repair
  if (!repaired.about_entity_candidate) {
    repaired.about_entity_candidate = '';
  } else if (repaired.about_entity_candidate.length > 100) {
    const original = repaired.about_entity_candidate;
    repaired.about_entity_candidate = repaired.about_entity_candidate.substring(0, 100);
    repairs.push({
      claim_index,
      field: 'about_entity_candidate',
      original_value: original,
      repaired_value: repaired.about_entity_candidate,
      rule: 'about_entity_candidate truncated to 100 characters',
    });
  }

  // as_of repair
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!repaired.as_of || !dateRegex.test(repaired.as_of)) {
    const testDate = repaired.as_of ? new Date(repaired.as_of) : null;
    if (!repaired.as_of || isNaN(testDate?.getTime() ?? NaN)) {
      const original = repaired.as_of;
      repaired.as_of = analysis_date;
      repairs.push({
        claim_index,
        field: 'as_of',
        original_value: original,
        repaired_value: repaired.as_of,
        rule: `as_of defaulted to analysis_date: ${analysis_date}`,
      });
    }
  }

  // valid_from and valid_until: default to null if missing/invalid (do NOT log as repair)
  if (repaired.valid_from && !dateRegex.test(repaired.valid_from)) {
    const testDate = new Date(repaired.valid_from);
    if (isNaN(testDate.getTime())) {
      repaired.valid_from = null;
    }
  }
  if (repaired.valid_until && !dateRegex.test(repaired.valid_until)) {
    const testDate = new Date(repaired.valid_until);
    if (isNaN(testDate.getTime())) {
      repaired.valid_until = null;
    }
  }

  // Validity classification
  // Count repairs (excluding valid_from/valid_until defaults)
  const repairCount = repairs.filter(r => 
    r.field !== 'valid_from' && r.field !== 'valid_until'
  ).length;

  let validity: 'strict' | 'repaired' | 'invalid';
  if (repairCount === 0) {
    validity = 'strict';
  } else if (repairCount >= 3) {
    validity = 'invalid';
  } else {
    validity = 'repaired';
  }

  return { claim: repaired, repairs, validity };
}
