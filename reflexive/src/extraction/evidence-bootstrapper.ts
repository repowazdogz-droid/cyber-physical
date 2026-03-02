import { ENGINE_CONFIG } from '../config.js';
import type { ExtractedClaim } from './types.js';

/**
 * Evidence Bootstrapping v0
 * 
 * When a claim has evidence_basis text but no linked EvidenceItem records,
 * create a synthetic EvidenceItem derived from the claim's own evidence_basis.
 * 
 * This prevents artificial edf=0 when the stimulus contains structured facts
 * that the lens referenced but no external evidence was linked.
 * 
 * Determinism: synthetic evidence IDs are derived solely from claim_id.
 * No randomness, no UUIDs, no timestamps.
 */

export interface SyntheticEvidence {
  id: string;
  claim_id: string;
  source_type: 'stimulus_derived';
  content_text: string;
  strength: number;
  as_of: string;
  possibly_stale: false;
  support_type: 'supports';
}

export function bootstrapEvidence(
  claims: ExtractedClaim[],
  analysis_started_at: string,
  existingEvidenceMap: Map<string, string[]>  // claim_id -> evidence_item_ids
): SyntheticEvidence[] {
  const syntheticEvidence: SyntheticEvidence[] = [];

  for (const claim of claims) {
    // Only bootstrap if:
    // 1. Claim has evidence_basis text (the lens cited something)
    // 2. Claim has zero linked evidence items
    // 3. Claim is scoring_eligible
    if (
      claim.evidence_basis &&
      claim.evidence_basis.trim().length > 0 &&
      (!existingEvidenceMap.has(claim.id) || existingEvidenceMap.get(claim.id)!.length === 0) &&
      claim.scoring_eligible !== false
    ) {
      const syntheticId = `stimulus-${claim.id}`;

      syntheticEvidence.push({
        id: syntheticId,
        claim_id: claim.id,
        source_type: 'stimulus_derived',
        content_text: claim.evidence_basis,
        strength: computeStimulusDerivedStrength(claim.evidence_basis),
        as_of: analysis_started_at,
        possibly_stale: false,
        support_type: 'supports',
      });
    }
  }

  return syntheticEvidence;
}

/**
 * Compute strength for stimulus-derived evidence.
 * Base strength: ENGINE_CONFIG.EVIDENCE_BASE_STRENGTH.stimulus_derived (0.55)
 * 
 * Apply specificity factor per Artifact 04 §4.2:
 * - 1.0 if contains a number, date, or proper noun
 * - 0.8 if content > 100 chars
 * - 0.6 otherwise
 * 
 * Recency factor is 1.0 (evidence is from current analysis).
 */
function computeStimulusDerivedStrength(evidenceBasis: string): number {
  const baseStrength = ENGINE_CONFIG.EVIDENCE_BASE_STRENGTH.stimulus_derived;
  const recencyFactor = 1.0; // Current analysis — no decay

  // Specificity factor per Artifact 04 §4.2
  const hasNumber = /\d+\.?\d*/.test(evidenceBasis);
  const hasDate = /\d{4}[-/]\d{2}[-/]\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2}/i.test(evidenceBasis);
  const hasProperNoun = /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/.test(evidenceBasis);

  let specificityFactor: number;
  if (hasNumber || hasDate || hasProperNoun) {
    specificityFactor = 1.0;
  } else if (evidenceBasis.length > 100) {
    specificityFactor = 0.8;
  } else {
    specificityFactor = 0.6;
  }

  return baseStrength * recencyFactor * specificityFactor;
}
