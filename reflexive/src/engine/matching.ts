import { ENGINE_CONFIG } from '../config.js';
import { cosineSim } from '../embeddings/similarity.js';
import type { ExtractedClaim } from '../extraction/types.js';
import type { ClaimEvidenceLink } from './types.js';

export interface ClaimMatch {
  claim_a_id: string;
  claim_b_id: string;
  lens_a_id: string;
  lens_b_id: string;
  similarity: number;
  pass: 'soft_gate' | 'borderline_resolved';
}

/**
 * Find longest common substring between two strings.
 * Used for borderline resolution.
 */
function longestCommonSubstring(a: string, b: string): number {
  let max = 0;
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        if (dp[i][j] > max) max = dp[i][j];
      }
    }
  }
  return max;
}

/**
 * Match claims across lenses using three-pass algorithm.
 * Artifact 04 §5.1
 */
export function matchClaims(
  claims: ExtractedClaim[],
  embeddings: Map<string, number[]>,
  claim_evidence_links: ClaimEvidenceLink[],
  perspectiveLensMap: Map<string, { lens_id: string; lens_name: string; lens_orientation: string }>
): ClaimMatch[] {
  // Filter to scoring-eligible claims
  const scoringClaims = claims.filter(c => c.scoring_eligible);
  
  // Sort by (lens_id, claim_id) for deterministic order
  scoringClaims.sort((a, b) => {
    const lensA = perspectiveLensMap.get(a.perspective_id);
    const lensB = perspectiveLensMap.get(b.perspective_id);
    const lensAId = lensA?.lens_id || '';
    const lensBId = lensB?.lens_id || '';
    
    if (lensAId !== lensBId) {
      return lensAId.localeCompare(lensBId);
    }
    return a.id.localeCompare(b.id);
  });
  
  const matches: ClaimMatch[] = [];
  
  // Generate all cross-lens pairs
  for (let i = 0; i < scoringClaims.length; i++) {
    const claimA = scoringClaims[i];
    const lensA = perspectiveLensMap.get(claimA.perspective_id);
    if (!lensA) continue;
    
    for (let j = i + 1; j < scoringClaims.length; j++) {
      const claimB = scoringClaims[j];
      const lensB = perspectiveLensMap.get(claimB.perspective_id);
      if (!lensB) continue;
      
      // Only cross-lens pairs
      if (lensA.lens_id === lensB.lens_id) continue;
      
      // Pass 1: Hard Gate
      // Must have same category and same entity canonical
      if (claimA.category !== claimB.category) continue;
      if (!claimA.about_entity_canonical || !claimB.about_entity_canonical) continue;
      if (claimA.about_entity_canonical === 'unresolved' || claimB.about_entity_canonical === 'unresolved') continue;
      if (claimA.about_entity_canonical !== claimB.about_entity_canonical) continue;
      
      // Pass 2: Soft Gate
      const embeddingA = embeddings.get(claimA.id);
      const embeddingB = embeddings.get(claimB.id);
      
      if (!embeddingA || !embeddingB) continue;
      
      const similarity = cosineSim(embeddingA, embeddingB);
      
      if (similarity >= ENGINE_CONFIG.SIM_MATCH) {
        // Match
        matches.push({
          claim_a_id: claimA.id,
          claim_b_id: claimB.id,
          lens_a_id: lensA.lens_id,
          lens_b_id: lensB.lens_id,
          similarity,
          pass: 'soft_gate',
        });
        continue;
      }
      
      if (similarity < ENGINE_CONFIG.SIM_REJECT) {
        // No match
        continue;
      }
      
      // Borderline: proceed to Pass 3
      // Pass 3: Borderline Resolution
      let resolved = false;
      
      // Check shared evidence
      const evidenceA = new Set(
        claim_evidence_links
          .filter(link => link.claim_id === claimA.id && link.support_type === 'supports')
          .map(link => link.evidence_item_id)
      );
      const evidenceB = new Set(
        claim_evidence_links
          .filter(link => link.claim_id === claimB.id && link.support_type === 'supports')
          .map(link => link.evidence_item_id)
      );
      
      for (const evId of evidenceA) {
        if (evidenceB.has(evId)) {
          // Shared evidence → match
          matches.push({
            claim_a_id: claimA.id,
            claim_b_id: claimB.id,
            lens_a_id: lensA.lens_id,
            lens_b_id: lensB.lens_id,
            similarity,
            pass: 'borderline_resolved',
          });
          resolved = true;
          break;
        }
      }
      
      if (resolved) continue;
      
      // Check quoted span overlap
      if (claimA.evidence_basis && claimB.evidence_basis) {
        const overlap = longestCommonSubstring(claimA.evidence_basis, claimB.evidence_basis);
        if (overlap >= ENGINE_CONFIG.BORDERLINE_OVERLAP_CHARS) {
          matches.push({
            claim_a_id: claimA.id,
            claim_b_id: claimB.id,
            lens_a_id: lensA.lens_id,
            lens_b_id: lensB.lens_id,
            similarity,
            pass: 'borderline_resolved',
          });
          continue;
        }
      }
      
      // No match
    }
  }
  
  return matches;
}
