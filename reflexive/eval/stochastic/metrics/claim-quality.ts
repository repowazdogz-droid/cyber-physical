import type { RunData } from './lens-quality.js';

export interface ClaimQualityMetrics {
  evidence_linkage_rate: number;
  category_distribution_entropy: number;
  assumption_promotion_rate: number;
  mean_confidence_weight: number;
}

export function computeClaimMetrics(runs: RunData[]): ClaimQualityMetrics {
  let totalClaims = 0;
  let claimsWithEvidence = 0;
  const categoryCounts: Record<string, number> = {};
  let assumptionCount = 0;
  let totalConfidenceWeight = 0;

  for (const run of runs) {
    if (!run.engine_output?.synthesis) continue;
    
    // Extract claims from engine output (would need to trace back to original claims)
    // For now, use placeholder logic
    const claims = run.engine_output.synthesis.convergence_points.flatMap(cp => cp.supporting_claims)
      .concat(run.engine_output.synthesis.divergence_points.flatMap(dp => dp.positions.flatMap(p => p.claim_ids)))
      .concat(run.engine_output.synthesis.orphan_claims);
    
    totalClaims += claims.length;
    // Placeholder: assume evidence linkage from claim_evidence_links
    claimsWithEvidence += Math.floor(claims.length * 0.7); // Placeholder
    
    // Category distribution (would need access to claim.category)
    // Placeholder: assume uniform distribution
    const categories = ['evaluative', 'predictive', 'inferential', 'assumption', 'other'];
    for (const cat of categories) {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + Math.floor(claims.length / categories.length);
    }
    
    assumptionCount += Math.floor(claims.length * 0.1); // Placeholder
    totalConfidenceWeight += claims.length * 0.6; // Placeholder mean weight
  }

  // Compute Shannon entropy
  const totalCategoryCount = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
  let entropy = 0;
  for (const count of Object.values(categoryCounts)) {
    if (count > 0 && totalCategoryCount > 0) {
      const p = count / totalCategoryCount;
      entropy -= p * Math.log(p);
    }
  }

  return {
    evidence_linkage_rate: totalClaims > 0 ? claimsWithEvidence / totalClaims : 0,
    category_distribution_entropy: entropy,
    assumption_promotion_rate: totalClaims > 0 ? assumptionCount / totalClaims : 0,
    mean_confidence_weight: totalClaims > 0 ? totalConfidenceWeight / totalClaims : 0,
  };
}
