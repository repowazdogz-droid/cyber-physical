import { ENGINE_CONFIG } from '../config.js';
import type { ExtractedClaim } from '../extraction/types.js';
import type { ConvergencePoint, DivergencePoint, ConfidenceBreakdown, EvidenceItem } from './types.js';

/**
 * Compute lens pair weight for divergence penalty.
 * Artifact 04 §6.6
 */
function lensPairWeight(
  lensA: { name: string; orientation: string },
  lensB: { name: string; orientation: string }
): number {
  // Name-specific check: analytical ↔ adversarial = 1.0
  const aName = lensA.name.toLowerCase();
  const bName = lensB.name.toLowerCase();
  
  if (
    (aName.includes('analytical') && bName.includes('adversarial')) ||
    (aName.includes('adversarial') && bName.includes('analytical'))
  ) {
    return 1.0;
  }
  
  // Orientation fallback lookup table
  const orientationWeights: Record<string, Record<string, number>> = {
    convergent: {
      convergent: 0.2,
      divergent: 0.8,
      orthogonal: 0.4,
    },
    divergent: {
      convergent: 0.8,
      divergent: 0.3,
      orthogonal: 0.5,
    },
    orthogonal: {
      convergent: 0.4,
      divergent: 0.5,
      orthogonal: 0.4,
    },
  };
  
  return orientationWeights[lensA.orientation]?.[lensB.orientation] ?? 0.5;
}

/**
 * Compute confidence breakdown.
 * Artifact 04 §6
 */
export function computeConfidence(
  convergence_points: ConvergencePoint[],
  divergence_points: DivergencePoint[],
  claims: ExtractedClaim[],
  analysis_evidence_density: number,
  completed_lens_count: number,
  active_lens_count: number,
  lenses: { id: string; name: string; orientation: string }[],
  theme_count: number,
  perspectiveLensMap: Map<string, { lens_id: string; lens_name: string; lens_orientation: string }>,
  evidence_items: EvidenceItem[],
  claim_evidence_links: { claim_id: string; evidence_item_id: string; support_type: string }[],
  analysis_started_at: string
): ConfidenceBreakdown {
  const scoringClaims = claims.filter(c => c.scoring_eligible);
  
  // Agreement factor (§6.3)
  let agreementSum = 0;
  for (const cp of convergence_points) {
    const strength = cp.strength;
    const lensRatio = cp.supporting_lenses.length / Math.max(1, completed_lens_count);
    agreementSum += strength * lensRatio;
  }
  
  const contradictoryDivergenceCount = divergence_points.filter(
    dp => dp.nature === 'contradictory'
  ).length;
  
  const agreement_factor = agreementSum / Math.max(1, convergence_points.length + contradictoryDivergenceCount);
  
  // Evidence density factor (§6.4)
  const evidence_density_factor = analysis_evidence_density;
  
  // Unsupported penalty (§6.5) - Support tier-based computation
  // Build evidence item type map
  const evidenceItemTypes = new Map<string, string>();
  for (const item of evidence_items) {
    evidenceItemTypes.set(item.id, item.source_type || 'lens_inference');
  }
  
  // Build claim-to-evidence-type mapping
  const claimEvidenceTypes = new Map<string, Set<string>>();
  for (const link of claim_evidence_links) {
    const evidenceType = evidenceItemTypes.get(link.evidence_item_id) || 'lens_inference';
    if (!claimEvidenceTypes.has(link.claim_id)) {
      claimEvidenceTypes.set(link.claim_id, new Set());
    }
    claimEvidenceTypes.get(link.claim_id)!.add(evidenceType);
  }
  
  // Define support tiers
  const externalEvidenceTypes = new Set([
    'external_citation',
    'numeric_data',
    'context_excerpt',
  ]);
  const stimulusEvidenceTypes = new Set([
    'stimulus_quote',
    'stimulus_derived',
  ]);
  
  // Classify claims and compute tiered penalty
  let unsupportedPenaltySum = 0;
  let unsupportedCount = 0;
  const stale = scoringClaims.filter(c => c.stale_unsupported);
  
  for (const claim of scoringClaims) {
    if (claim.stale_unsupported) continue; // Handled separately
    
    // Determine support tier
    const evidenceTypes = claimEvidenceTypes.get(claim.id) || new Set<string>();
    const hasExternalEvidence = Array.from(evidenceTypes).some(type => externalEvidenceTypes.has(type));
    const hasStimulusEvidence = Array.from(evidenceTypes).some(type => stimulusEvidenceTypes.has(type));
    
    let supportTier: 'A' | 'B' | 'C';
    if (hasExternalEvidence) {
      supportTier = 'A'; // External evidence
    } else if (hasStimulusEvidence) {
      supportTier = 'B'; // Stimulus evidence
    } else {
      supportTier = 'C'; // No support
    }
    
    // Apply penalty based on tier and claim status
    if (claim.evidence_status === 'unsupported') {
      unsupportedCount++;
      let penaltyWeight = claim.confidence_weight;
      
      if (supportTier === 'A') {
        // Tier A: External evidence - should not be unsupported, but if it is, full penalty
        // (This shouldn't happen, but handle it)
        penaltyWeight = claim.confidence_weight;
      } else if (supportTier === 'B') {
        // Tier B: Stimulus-supported
        if (claim.category === 'factual') {
          // Factual claims with stimulus support → zero penalty
          penaltyWeight = 0;
        } else {
          // Inferential/predictive claims with stimulus support → reduced penalty (*0.25)
          penaltyWeight = claim.confidence_weight * 0.25;
        }
      } else {
        // Tier C: No support → full penalty
        penaltyWeight = claim.confidence_weight;
      }
      
      unsupportedPenaltySum += penaltyWeight;
    }
  }
  
  const unsupported_ratio = unsupportedCount / Math.max(1, scoringClaims.length);
  const stale_ratio = stale.length / Math.max(1, scoringClaims.length);
  
  const mean_unsupported_weight = unsupportedCount > 0
    ? unsupportedPenaltySum / unsupportedCount
    : 0;
  
  const unsupported_penalty = (unsupported_ratio * mean_unsupported_weight) + (stale_ratio * 1.0);
  
  // Divergence penalty (§6.5-6.6)
  let divergenceSum = 0;
  const lensMap = new Map(lenses.map(l => [l.id, l]));
  
  for (const dp of divergence_points) {
    if (dp.nature !== 'contradictory') continue;
    
    // Find max confidence_weight among claims in this divergence
    const allDivergenceClaimIds = new Set<string>();
    for (const pos of dp.positions) {
      for (const claimId of pos.claim_ids) {
        allDivergenceClaimIds.add(claimId);
      }
    }
    
    const divergenceClaims = claims.filter(c => allDivergenceClaimIds.has(c.id));
    const maxWeight = divergenceClaims.length > 0
      ? Math.max(...divergenceClaims.map(c => c.confidence_weight))
      : 0;
    
    const severity = maxWeight * (dp.positions.length / Math.max(1, completed_lens_count));
    
    // Compute lens pair weight (maximum among all pairs)
    let maxPairWeight = 0;
    const positionLensIds = dp.positions.map(p => p.lens_id);
    for (let i = 0; i < positionLensIds.length; i++) {
      for (let j = i + 1; j < positionLensIds.length; j++) {
        const lensA = lensMap.get(positionLensIds[i]);
        const lensB = lensMap.get(positionLensIds[j]);
        if (lensA && lensB) {
          const weight = lensPairWeight(lensA, lensB);
          maxPairWeight = Math.max(maxPairWeight, weight);
        }
      }
    }
    
    divergenceSum += severity * maxPairWeight;
  }
  
  const divergence_penalty = divergenceSum / Math.max(1, theme_count);
  
  // Lens count factor (§6.7)
  const lens_count_factor = completed_lens_count / Math.max(1, active_lens_count);
  
  // Raw score (§6.2)
  const raw_score = (
    ENGINE_CONFIG.W_a * agreement_factor +
    ENGINE_CONFIG.W_e * evidence_density_factor -
    ENGINE_CONFIG.W_u * unsupported_penalty -
    ENGINE_CONFIG.W_d * divergence_penalty
  ) * lens_count_factor;
  
  // Final score (clamped and rounded)
  const final_score = Math.round(Math.max(0.0, Math.min(1.0, raw_score)) * 10000) / 10000;
  
  // Drift flags
  const drift_flags: string[] = [];
  if (evidence_density_factor < ENGINE_CONFIG.LOW_EVIDENCE_WARN) {
    drift_flags.push('LOW_EVIDENCE');
  }
  if (divergence_penalty > ENGINE_CONFIG.HIGH_CONTRA_WARN) {
    drift_flags.push('HIGH_CONTRADICTION');
  }
  
  // Build per_lens array
  const per_lens: ConfidenceBreakdown['per_lens'] = [];
  const lensClaimCounts = new Map<string, { total: number; scoring: number; supported: number; weights: number[] }>();
  
  for (const claim of claims) {
    const lens = perspectiveLensMap.get(claim.perspective_id);
    if (!lens) continue;
    
    if (!lensClaimCounts.has(lens.lens_id)) {
      lensClaimCounts.set(lens.lens_id, { total: 0, scoring: 0, supported: 0, weights: [] });
    }
    
    const counts = lensClaimCounts.get(lens.lens_id)!;
    counts.total++;
    
    if (claim.scoring_eligible) {
      counts.scoring++;
      counts.weights.push(claim.confidence_weight);
      
      if (claim.evidence_status === 'supported') {
        counts.supported++;
      }
    }
  }
  
  for (const [lens_id, counts] of lensClaimCounts) {
    const meanWeight = counts.weights.length > 0
      ? counts.weights.reduce((sum, w) => sum + w, 0) / counts.weights.length
      : 0;
    
    // Contribution to agreement: sum of convergence point strengths where this lens participates
    let contribution = 0;
    for (const cp of convergence_points) {
      if (cp.supporting_lenses.includes(lens_id)) {
        contribution += cp.strength * (1 / cp.supporting_lenses.length);
      }
    }
    
    per_lens.push({
      lens_id,
      claim_count: counts.total,
      scoring_claim_count: counts.scoring,
      supported_claim_count: counts.supported,
      mean_evidence_strength: meanWeight,
      contribution_to_agreement: contribution,
    });
  }
  
  // Build per_theme array
  const per_theme: ConfidenceBreakdown['per_theme'] = [];
  for (const cp of convergence_points) {
    per_theme.push({
      theme_id: cp.theme_id,
      agreement_type: 'convergence',
      participating_lenses: cp.supporting_lenses.length,
      strength: cp.strength,
    });
  }
  for (const dp of divergence_points) {
    per_theme.push({
      theme_id: dp.theme_id,
      agreement_type: 'divergence',
      participating_lenses: dp.positions.length,
      strength: dp.severity,
    });
  }
  
  return {
    agreement_factor,
    evidence_density_factor,
    unsupported_penalty,
    divergence_penalty,
    lens_count_factor,
    raw_score,
    final_score,
    drift_flags,
    low_evidence_warning: evidence_density_factor < ENGINE_CONFIG.LOW_EVIDENCE_WARN,
    high_contradiction_warning: divergence_penalty > ENGINE_CONFIG.HIGH_CONTRA_WARN,
    per_lens,
    per_theme,
  };
}
