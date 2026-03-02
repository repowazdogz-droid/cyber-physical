/**
 * Claim model and promotion lifecycle.
 */

export type ClaimTier =
  | "OBSERVATION"
  | "REPLICATED"
  | "BASELINE_BEATING"
  | "GRADUATED";

export interface Claim {
  id: string;
  experiment_ids: string[];
  current_tier: ClaimTier;
  stats: {
    mean: number;
    std: number;
    cv: number;
    effect_size: number;
  };
  contradictions: string[];
  requires_human_approval: boolean;
}

export interface ClaimPromotionConfig {
  min_seeds_for_replication: number;
  max_cv_for_replication: number;
  min_effect_size: number;
}

const DEFAULT_PROMOTION_CONFIG: ClaimPromotionConfig = {
  min_seeds_for_replication: 3,
  max_cv_for_replication: 0.1,
  min_effect_size: 0.05,
};

export function canPromoteToReplicated(
  claim: Claim,
  config: Partial<ClaimPromotionConfig> = {}
): { allowed: boolean; reason?: string } {
  const c = { ...DEFAULT_PROMOTION_CONFIG, ...config };
  if (claim.current_tier !== "OBSERVATION") {
    return { allowed: false, reason: "Only OBSERVATION can promote to REPLICATED" };
  }
  const distinctSeeds = new Set(claim.experiment_ids).size;
  if (distinctSeeds < c.min_seeds_for_replication) {
    return {
      allowed: false,
      reason: `Need at least ${c.min_seeds_for_replication} distinct seeds, got ${distinctSeeds}`,
    };
  }
  if (claim.stats.cv > c.max_cv_for_replication) {
    return {
      allowed: false,
      reason: `CV ${claim.stats.cv} exceeds max ${c.max_cv_for_replication}`,
    };
  }
  return { allowed: true };
}

export function canPromoteToBaselineBeating(
  claim: Claim,
  config: Partial<ClaimPromotionConfig> = {}
): { allowed: boolean; reason?: string } {
  const c = { ...DEFAULT_PROMOTION_CONFIG, ...config };
  if (claim.current_tier !== "REPLICATED") {
    return { allowed: false, reason: "Only REPLICATED can promote to BASELINE_BEATING" };
  }
  if (claim.stats.effect_size < c.min_effect_size) {
    return {
      allowed: false,
      reason: `Effect size ${claim.stats.effect_size} below min ${c.min_effect_size}`,
    };
  }
  if (claim.stats.effect_size <= 0) {
    return { allowed: false, reason: "Effect size must be positive (improvement)" };
  }
  return { allowed: true };
}

export function canPromoteToGraduated(claim: Claim): { allowed: boolean; reason?: string } {
  if (claim.current_tier !== "BASELINE_BEATING") {
    return { allowed: false, reason: "Only BASELINE_BEATING can promote to GRADUATED" };
  }
  if (!claim.requires_human_approval) {
    return { allowed: false, reason: "requires_human_approval must be true" };
  }
  return { allowed: true };
}
