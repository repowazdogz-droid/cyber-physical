import { v4 as uuidv4 } from 'uuid';
import type { RawAssessment, RawClaim, ExtractedClaim, ParseResult } from './types.js';
import { validateTier1, validateAndRepairClaim } from './validator.js';

/**
 * Parse LLM response into structured assessment and extract claims.
 * Implements Artifact 04 §3.2 and §3.4.
 */
export function parseAssessment(
  raw_response: string,
  perspective_id: string,
  analysis_id: string,
  analysis_started_at: string
): ParseResult {
  let parsed: unknown = null;
  let errors: string[] = [];
  let warnings: string[] = [];

  // Step 1: Attempt JSON.parse
  try {
    parsed = JSON.parse(raw_response);
  } catch (e) {
    // Step 2: Try stripping markdown fences
    const fenceMatch = raw_response.match(/^\s*```(?:json)?\s*\n?([\s\S]*?)\n?\s*```\s*$/);
    if (fenceMatch) {
      try {
        parsed = JSON.parse(fenceMatch[1]);
      } catch (e2) {
        // Step 3: Extract first { to last }
        const start = raw_response.indexOf('{');
        const end = raw_response.lastIndexOf('}');
        if (start >= 0 && end > start) {
          try {
            parsed = JSON.parse(raw_response.substring(start, end + 1));
          } catch (e3) {
            errors.push('Unparseable JSON after all recovery attempts');
            return {
              success: false,
              assessment: null,
              claims: [],
              errors,
              warnings,
            };
          }
        } else {
          errors.push('Unparseable JSON after all recovery attempts');
          return {
            success: false,
            assessment: null,
            claims: [],
            errors,
            warnings,
          };
        }
      }
    } else {
      // Step 3: Extract first { to last }
      const start = raw_response.indexOf('{');
      const end = raw_response.lastIndexOf('}');
      if (start >= 0 && end > start) {
        try {
          parsed = JSON.parse(raw_response.substring(start, end + 1));
        } catch (e3) {
          errors.push('Unparseable JSON after all recovery attempts');
          return {
            success: false,
            assessment: null,
            claims: [],
            errors,
            warnings,
          };
        }
      } else {
        errors.push('Unparseable JSON after all recovery attempts');
        return {
          success: false,
          assessment: null,
          claims: [],
          errors,
          warnings,
        };
      }
    }
  }

  // Step 5: Tier 1 validation
  // Note: Check for markdown fences in ORIGINAL raw_response before any processing
  const tier1Result = validateTier1(parsed, raw_response);
  if (!tier1Result.pass) {
    return {
      success: false,
      assessment: null,
      claims: [],
      errors: tier1Result.errors,
      warnings,
    };
  }

  const assessment = parsed as RawAssessment;
  const claims: ExtractedClaim[] = [];

  // Step 6: Process each claim
  for (let i = 0; i < assessment.claims.length; i++) {
    const rawClaim = assessment.claims[i];
    const repairResult = validateAndRepairClaim(rawClaim, i, analysis_started_at);

    // If claim was dropped (statement missing), skip it
    if (repairResult.claim === null) {
      warnings.push(`Claim ${i} dropped: missing statement`);
      continue;
    }

    const repaired = repairResult.claim;

    // Set evidence_status
    const evidence_status = repaired.evidence_basis && repaired.evidence_basis.trim() !== ''
      ? 'supported'
      : 'unsupported';

    // Set expires_at for unsupported claims
    let expires_at: string | null = null;
    if (evidence_status === 'unsupported') {
      const expiryDate = new Date(analysis_started_at);
      expiryDate.setDate(expiryDate.getDate() + 30);
      expires_at = expiryDate.toISOString().substring(0, 10);
    }

    // Build repairs array
    const repairs: string[] = repairResult.repairs.map(r =>
      `${r.field}: ${JSON.stringify(r.original_value)} → ${JSON.stringify(r.repaired_value)} (${r.rule})`
    );

    const extractedClaim: ExtractedClaim = {
      id: uuidv4(),
      perspective_id,
      analysis_id,
      statement: repaired.statement!,
      category: repaired.category as 'factual' | 'inferential' | 'evaluative' | 'predictive',
      claim_kind: repaired.claim_kind as 'claim' | 'assumption',
      confidence_weight: repaired.confidence_weight!,
      evidence_basis: repaired.evidence_basis ?? null,
      evidence_status,
      about_entity_candidate: repaired.about_entity_candidate || '',
      about_entity_canonical: null, // Set later by canonicalizer
      validity: repairResult.validity,
      polarity: null, // Set later by polarity classifier
      scoring_eligible: repairResult.validity !== 'invalid',
      as_of: repaired.as_of!,
      valid_from: repaired.valid_from ?? null,
      valid_until: repaired.valid_until ?? null,
      expires_at,
      stale_unsupported: false,
      repairs,
    };

    claims.push(extractedClaim);
  }

  // Step 7: Promote key_assumptions
  if (assessment.key_assumptions && Array.isArray(assessment.key_assumptions)) {
    for (const assumption of assessment.key_assumptions) {
      if (typeof assumption !== 'string' || assumption.trim() === '') {
        continue;
      }

      // Deduplication check: see if any existing claim has a similar statement
      const assumptionLower = assumption.toLowerCase();
      const isDuplicate = claims.some(claim => {
        const claimLower = claim.statement.toLowerCase();
        return claimLower.includes(assumptionLower) || assumptionLower.includes(claimLower);
      });

      if (isDuplicate) {
        warnings.push(`key_assumption skipped (duplicate): "${assumption.substring(0, 50)}..."`);
        continue;
      }

      // Extract about_entity_candidate from assumption (simple: first noun phrase)
      // For now, use a simple heuristic: first 1-3 words that aren't common stop words
      const words = assumption.split(/\s+/).filter(w => {
        const lower = w.toLowerCase();
        return !['the', 'a', 'an', 'is', 'are', 'was', 'were', 'will', 'would', 'could', 'should'].includes(lower);
      });
      const about_entity_candidate = words.slice(0, 3).join(' ') || 'unresolved';

      // Set expires_at for unsupported assumption
      const expiryDate = new Date(analysis_started_at);
      expiryDate.setDate(expiryDate.getDate() + 30);
      const expires_at = expiryDate.toISOString().substring(0, 10);

      const assumptionClaim: ExtractedClaim = {
        id: uuidv4(),
        perspective_id,
        analysis_id,
        statement: assumption.substring(0, 300), // Truncate to 300 chars
        category: 'inferential',
        claim_kind: 'assumption',
        confidence_weight: 0.5,
        evidence_basis: null,
        evidence_status: 'unsupported',
        about_entity_candidate,
        about_entity_canonical: null,
        validity: 'strict',
        polarity: null,
        scoring_eligible: true,
        as_of: analysis_started_at,
        valid_from: null,
        valid_until: null,
        expires_at,
        stale_unsupported: false,
        repairs: ['Promoted from key_assumptions array'],
      };

      claims.push(assumptionClaim);
    }
  }

  return {
    success: true,
    assessment,
    claims,
    errors,
    warnings,
  };
}
