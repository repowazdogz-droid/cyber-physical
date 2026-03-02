import { ENGINE_CONFIG } from '../config.js';
import { cosineSim } from '../embeddings/similarity.js';
import type { ExtractedClaim } from '../extraction/types.js';
import type { Theme } from './themes.js';

export interface ScopeResult {
  claim_a_id: string;
  claim_b_id: string;
  scope_dependent: boolean;
  reason: 'temporal_non_overlap' | 'entity_aspect' | null;
}

/**
 * Detect scope-dependent claim pairs.
 * Artifact 04 §5.6
 * Runs BEFORE contradiction detection.
 */
export function detectScopeDependence(
  themes: Theme[],
  claims: ExtractedClaim[],
  embeddings: Map<string, number[]>,
  perspectiveLensMap: Map<string, { lens_id: string }>
): ScopeResult[] {
  const claimMap = new Map(claims.map(c => [c.id, c]));
  const results: ScopeResult[] = [];
  
  // For each theme with claims from >= 2 lenses
  for (const theme of themes) {
    if (theme.lens_ids.length < 2) continue;
    
    // Get all claims in this theme
    const themeClaims = theme.claim_ids.map(id => claimMap.get(id)).filter((c): c is ExtractedClaim => c !== undefined);
    
    // Group claims by lens
    const claimsByLens = new Map<string, ExtractedClaim[]>();
    for (const claim of themeClaims) {
      const lens = perspectiveLensMap.get(claim.perspective_id);
      if (!lens) continue;
      const lensId = lens.lens_id;
      if (!claimsByLens.has(lensId)) {
        claimsByLens.set(lensId, []);
      }
      claimsByLens.get(lensId)!.push(claim);
    }
    
    // Check all intra-theme cross-lens pairs
    const lensIds = [...claimsByLens.keys()];
    for (let i = 0; i < lensIds.length; i++) {
      for (let j = i + 1; j < lensIds.length; j++) {
        const lensAId = lensIds[i];
        const lensBId = lensIds[j];
        const claimsA = claimsByLens.get(lensAId) || [];
        const claimsB = claimsByLens.get(lensBId) || [];
        
        for (const claimA of claimsA) {
          for (const claimB of claimsB) {
            // Temporal scope-dependence
            if (claimA.valid_from && claimA.valid_until && claimB.valid_from && claimB.valid_until) {
              const aFrom = new Date(claimA.valid_from);
              const aUntil = new Date(claimA.valid_until);
              const bFrom = new Date(claimB.valid_from);
              const bUntil = new Date(claimB.valid_until);
              
              if (aUntil < bFrom || bUntil < aFrom) {
                results.push({
                  claim_a_id: claimA.id,
                  claim_b_id: claimB.id,
                  scope_dependent: true,
                  reason: 'temporal_non_overlap',
                });
                continue;
              }
            }
            
            // Entity-aspect scope-dependence
            if (
              claimA.about_entity_canonical &&
              claimB.about_entity_canonical &&
              claimA.about_entity_canonical === claimB.about_entity_canonical &&
              claimA.category === claimB.category
            ) {
              const embeddingA = embeddings.get(claimA.id);
              const embeddingB = embeddings.get(claimB.id);
              
              if (embeddingA && embeddingB) {
                const similarity = cosineSim(embeddingA, embeddingB);
                if (similarity < ENGINE_CONFIG.SCOPE_SIM_CEILING) {
                  results.push({
                    claim_a_id: claimA.id,
                    claim_b_id: claimB.id,
                    scope_dependent: true,
                    reason: 'entity_aspect',
                  });
                  continue;
                }
              }
            }
            
            // Not scope-dependent
            results.push({
              claim_a_id: claimA.id,
              claim_b_id: claimB.id,
              scope_dependent: false,
              reason: null,
            });
          }
        }
      }
    }
  }
  
  return results;
}
