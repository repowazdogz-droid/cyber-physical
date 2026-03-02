/**
 * Penalty Scoring
 * 
 * Deterministic penalty scoring for concept de-ranking.
 * 
 * Version: 1.0.0
 */

import { EvidenceStats } from './EvidenceIndex';
import { VerifierWhyCode } from '../../contracts/enums/VerifierCodes';

/**
 * Penalty weights (explicit and versioned).
 */
export const PENALTY_WEIGHTS = {
  fail_count_total: 5,
  generalization_fail_palette: 15,
  generalization_fail_translation: 10,
  generalization_fail_tier4: 25, // High penalty for Tier 4 failures
  example_mismatch: 8,
  exec_error: 20,
  recent_fail_streak: 2
};

/**
 * Computes penalty score P for a concept.
 */
export function computePenalty(stats: EvidenceStats | undefined): number {
  if (!stats) {
    return 0;
  }

  const P =
    PENALTY_WEIGHTS.fail_count_total * stats.fail_count_total +
    PENALTY_WEIGHTS.generalization_fail_palette * (stats.fail_count_by_code[VerifierWhyCode.INVARIANCE_FAILED_PALETTE] || 0) +
    PENALTY_WEIGHTS.generalization_fail_translation * (stats.fail_count_by_code[VerifierWhyCode.INVARIANCE_FAILED_TRANSLATION] || 0) +
    PENALTY_WEIGHTS.generalization_fail_tier4 * (stats.fail_count_by_code[VerifierWhyCode.GENERALIZATION_FAIL_TIER4] || 0) +
    PENALTY_WEIGHTS.example_mismatch * (stats.fail_count_by_code[VerifierWhyCode.EXAMPLE_MISMATCH] || 0) +
    PENALTY_WEIGHTS.exec_error * (stats.fail_count_by_code[VerifierWhyCode.EXEC_ERROR] || 0) +
    PENALTY_WEIGHTS.recent_fail_streak * stats.recent_fail_streak;

  return P;
}

/**
 * Checks if concept should be excluded for a fingerprint.
 */
export function shouldExclude(
  stats: EvidenceStats | undefined,
  keyFingerprint: string
): boolean {
  if (!stats) {
    return false;
  }

  // Hard exclusion: GENERALIZATION_FAIL_PALETTE >= 3 for same key_fingerprint
  const paletteFailCount = stats.fail_count_by_code[VerifierWhyCode.INVARIANCE_FAILED_PALETTE] || 0;
  if (paletteFailCount >= 3) {
    return true;
  }

  return false;
}

