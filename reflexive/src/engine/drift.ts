import { ENGINE_CONFIG } from '../config.js';
import { cosineSim } from '../embeddings/similarity.js';
import type { ExtractedClaim } from '../extraction/types.js';
import type { ConfidenceBreakdown, ConvergencePoint, DivergencePoint, PriorSynthesis, DriftReport } from './types.js';

/**
 * Compute drift report comparing current to prior synthesis.
 * Artifact 04 §7
 */
export function computeDrift(
  current: {
    analysis_id: string;
    confidence_breakdown: ConfidenceBreakdown;
    convergence_points: ConvergencePoint[];
    divergence_points: DivergencePoint[];
    claims: ExtractedClaim[];
  },
  prior: PriorSynthesis | null,
  case_id: string,
  embeddings: Map<string, number[]>,
  prior_claim_embeddings: Map<string, number[]>
): DriftReport | null {
  if (!prior) {
    return null; // First analysis on this case
  }
  
  // Score delta
  const score_delta = current.confidence_breakdown.final_score - prior.confidence_score;
  
  // Component deltas
  const component_deltas = {
    agreement_factor: current.confidence_breakdown.agreement_factor - prior.confidence_breakdown.agreement_factor,
    evidence_density_factor: current.confidence_breakdown.evidence_density_factor - prior.confidence_breakdown.evidence_density_factor,
    unsupported_penalty: current.confidence_breakdown.unsupported_penalty - prior.confidence_breakdown.unsupported_penalty,
    divergence_penalty: current.confidence_breakdown.divergence_penalty - prior.confidence_breakdown.divergence_penalty,
  };
  
  // Theme matching: match by about_entity_canonical overlap (>= 50% of claims share canonical)
  const currentThemeEntities = new Map<string, Set<string>>();
  const priorThemeEntities = new Map<string, Set<string>>();
  
  // Build entity sets for current themes
  for (const cp of current.convergence_points) {
    const entities = new Set<string>();
    for (const claimId of cp.supporting_claims) {
      const claim = current.claims.find(c => c.id === claimId);
      if (claim?.about_entity_canonical) {
        entities.add(claim.about_entity_canonical);
      }
    }
    currentThemeEntities.set(cp.theme_id, entities);
  }
  
  for (const dp of current.divergence_points) {
    const entities = new Set<string>();
    for (const pos of dp.positions) {
      for (const claimId of pos.claim_ids) {
        const claim = current.claims.find(c => c.id === claimId);
        if (claim?.about_entity_canonical) {
          entities.add(claim.about_entity_canonical);
        }
      }
    }
    currentThemeEntities.set(dp.theme_id, entities);
  }
  
  // Build entity sets for prior themes (we need claim data, but we only have theme IDs)
  // For now, we'll match by theme_id directly if available, or by entity overlap
  // Since we don't have prior claims, we'll use a simplified matching
  
  const new_convergence_themes: string[] = [];
  const lost_convergence_themes: string[] = [];
  const new_divergence_themes: string[] = [];
  const resolved_divergence_themes: string[] = [];
  
  // Match convergence points
  const priorConvergenceIds = new Set(prior.convergence_points.map(cp => cp.theme_id));
  for (const cp of current.convergence_points) {
    if (!priorConvergenceIds.has(cp.theme_id)) {
      new_convergence_themes.push(cp.theme_id);
    }
  }
  for (const cp of prior.convergence_points) {
    if (!current.convergence_points.some(c => c.theme_id === cp.theme_id)) {
      lost_convergence_themes.push(cp.theme_id);
    }
  }
  
  // Match divergence points
  const priorDivergenceIds = new Set(prior.divergence_points.map(dp => dp.theme_id));
  for (const dp of current.divergence_points) {
    if (!priorDivergenceIds.has(dp.theme_id)) {
      new_divergence_themes.push(dp.theme_id);
    }
  }
  for (const dp of prior.divergence_points) {
    if (!current.divergence_points.some(d => d.theme_id === dp.theme_id)) {
      resolved_divergence_themes.push(dp.theme_id);
    }
  }
  
  // Claim stability: count current scoring claims matching a prior claim
  const currentScoring = current.claims.filter(c => c.scoring_eligible);
  const priorScoringIds = new Set(prior.convergence_points.flatMap(cp => cp.supporting_claims)
    .concat(prior.divergence_points.flatMap(dp => dp.positions.flatMap(p => p.claim_ids))));
  
  let matchedCount = 0;
  for (const claim of currentScoring) {
    const embedding = embeddings.get(claim.id);
    if (!embedding || !claim.about_entity_canonical) continue;
    
    // Check if matches any prior claim (by embedding similarity and entity)
    for (const priorClaimId of priorScoringIds) {
      const priorEmbedding = prior_claim_embeddings.get(priorClaimId);
      if (!priorEmbedding) continue;
      
      const similarity = cosineSim(embedding, priorEmbedding);
      if (similarity >= ENGINE_CONFIG.SIM_MATCH) {
        // Check entity match (we'd need prior claim data, but approximate)
        matchedCount++;
        break;
      }
    }
  }
  
  const claim_stability = priorScoringIds.size > 0
    ? matchedCount / priorScoringIds.size
    : 1.0;
  
  // Drift flags (§7.3)
  const drift_flags: string[] = [];
  
  if (Math.abs(score_delta) >= ENGINE_CONFIG.DRIFT_LARGE_DELTA) {
    drift_flags.push('DRIFT_LARGE_DELTA');
  }
  
  if (claim_stability < ENGINE_CONFIG.DRIFT_CHURN_STABILITY) {
    drift_flags.push('DRIFT_CLAIM_CHURN');
  }
  
  if (new_convergence_themes.length + new_divergence_themes.length >= ENGINE_CONFIG.DRIFT_DECAY_COUNT) {
    drift_flags.push('DRIFT_THEME_DECAY');
  }
  
  if (component_deltas.agreement_factor < -0.15) {
    drift_flags.push('DRIFT_AGREEMENT_DECAY');
  }
  
  if (component_deltas.evidence_density_factor < -0.10) {
    drift_flags.push('DRIFT_EVIDENCE_DECAY');
  }
  
  return {
    case_id,
    current_analysis_id: current.analysis_id,
    previous_analysis_id: prior.analysis_id,
    score_delta,
    component_deltas,
    new_convergence_themes,
    lost_convergence_themes,
    new_divergence_themes,
    resolved_divergence_themes,
    claim_stability,
    drift_flags,
  };
}
