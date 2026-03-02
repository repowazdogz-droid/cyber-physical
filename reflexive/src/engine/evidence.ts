import { ENGINE_CONFIG } from '../config.js';
import type { EvidenceItem, ClaimEvidenceLink } from './types.js';
import type { ExtractedClaim } from '../extraction/types.js';

/**
 * Compute recency factor for evidence item.
 * Artifact 04 §4.2
 */
function recencyFactor(e: EvidenceItem, analysis_started_at: string): number {
  const asOfDate = new Date(e.as_of);
  const analysisDate = new Date(analysis_started_at);
  const daysSinceAsOf = Math.max(0, (analysisDate.getTime() - asOfDate.getTime()) / (1000 * 60 * 60 * 24));
  
  let factor = Math.max(
    ENGINE_CONFIG.EVIDENCE_RECENCY_FLOOR,
    1.0 - (daysSinceAsOf / ENGINE_CONFIG.EVIDENCE_RECENCY_DAYS)
  );
  
  if (e.possibly_stale) {
    factor *= ENGINE_CONFIG.STALE_EVIDENCE_MULT;
  }
  
  return factor;
}

/**
 * Compute specificity factor for evidence item.
 * Artifact 04 §4.2
 */
function specificityFactor(e: EvidenceItem): number {
  const text = e.content_text;
  
  // Check for numbers
  if (/\d+\.?\d*/.test(text)) {
    return 1.0;
  }
  
  // Check for dates
  const datePattern = /\d{4}[-/]\d{2}[-/]\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2}/i;
  if (datePattern.test(text)) {
    return 1.0;
  }
  
  // Check for proper nouns (multiple capitalized words)
  if (/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/.test(text)) {
    return 1.0;
  }
  
  // Length check
  if (text.length > 100) {
    return 0.8;
  }
  
  return 0.6;
}

/**
 * Compute evidence strength for an evidence item.
 * Artifact 04 §4.2
 */
export function evidenceStrength(e: EvidenceItem, analysis_started_at: string): number {
  const base = ENGINE_CONFIG.EVIDENCE_BASE_STRENGTH[e.source_type] ?? 0.3;
  const recency = recencyFactor(e, analysis_started_at);
  const specificity = specificityFactor(e);
  return base * recency * specificity;
}

/**
 * Compute evidence density for a claim.
 * Artifact 04 §4.3: density = 1 - ∏(1 - strength(e_i)) for supporting evidence
 */
export function claimEvidenceDensity(
  claim_id: string,
  evidence_items: EvidenceItem[],
  claim_evidence_links: ClaimEvidenceLink[],
  analysis_started_at: string
): number {
  // Find all supporting evidence for this claim
  const supportingLinks = claim_evidence_links.filter(
    link => link.claim_id === claim_id && link.support_type === 'supports'
  );
  
  if (supportingLinks.length === 0) {
    return 0.0;
  }
  
  // Get evidence items and compute strengths
  const strengths = supportingLinks
    .map(link => {
      const evidence = evidence_items.find(e => e.id === link.evidence_item_id);
      return evidence ? evidenceStrength(evidence, analysis_started_at) : 0;
    })
    .filter(s => s > 0);
  
  if (strengths.length === 0) {
    return 0.0;
  }
  
  // Accumulating formula: 1 - ∏(1 - strength)
  const product = strengths.reduce((acc, strength) => acc * (1 - strength), 1.0);
  return 1.0 - product;
}

/**
 * Compute mean evidence density for a lens.
 * Artifact 04 §4.4
 */
export function lensEvidenceDensity(
  lens_id: string,
  claims: ExtractedClaim[],
  evidence_items: EvidenceItem[],
  claim_evidence_links: ClaimEvidenceLink[],
  analysis_started_at: string,
  perspectiveLensMap: Map<string, { lens_id: string }>
): number {
  const lensClaims = claims.filter(c => {
    const lens = perspectiveLensMap.get(c.perspective_id);
    return lens && lens.lens_id === lens_id && c.scoring_eligible && !c.stale_unsupported;
  });
  
  if (lensClaims.length === 0) {
    return 0.0;
  }
  
  const densities = lensClaims.map(c =>
    claimEvidenceDensity(c.id, evidence_items, claim_evidence_links, analysis_started_at)
  );
  
  return densities.reduce((sum, d) => sum + d, 0) / densities.length;
}

/**
 * Compute weighted mean evidence density across all lenses.
 * Artifact 04 §4.5
 */
export function analysisEvidenceDensity(
  claims: ExtractedClaim[],
  evidence_items: EvidenceItem[],
  claim_evidence_links: ClaimEvidenceLink[],
  analysis_started_at: string,
  perspectives: { id: string; lens_id: string }[],
  perspectiveLensMap: Map<string, { lens_id: string }>
): number {
  const lensWeights = new Map<string, number>();
  const lensDensities = new Map<string, number>();
  
  // Compute weight (scoring claim count) and density per lens
  for (const perspective of perspectives) {
    const lensClaims = claims.filter(c => {
      const lens = perspectiveLensMap.get(c.perspective_id);
      return lens && lens.lens_id === perspective.lens_id && c.scoring_eligible;
    });
    
    const weight = lensClaims.length;
    if (weight > 0) {
      lensWeights.set(perspective.lens_id, (lensWeights.get(perspective.lens_id) || 0) + weight);
      
      if (!lensDensities.has(perspective.lens_id)) {
        const density = lensEvidenceDensity(
          perspective.lens_id,
          claims,
          evidence_items,
          claim_evidence_links,
          analysis_started_at,
          perspectiveLensMap
        );
        lensDensities.set(perspective.lens_id, density);
      }
    }
  }
  
  // Weighted mean
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const [lens_id, weight] of lensWeights) {
    const density = lensDensities.get(lens_id) || 0;
    weightedSum += density * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0.0;
}
