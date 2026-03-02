/**
 * Normalize divergence points by detecting false divergences.
 * 
 * If position_summary strings within a divergence theme are highly similar
 * (min pairwise similarity >= 0.92 or overlap >= 0.85), convert to convergence.
 */

import type { DivergencePoint, ConvergencePoint } from './types.js';

/**
 * Compute text overlap ratio between two strings.
 * Returns ratio of overlapping words / total unique words (Jaccard similarity).
 * Also checks for exact match or very high substring similarity.
 */
function computeTextOverlap(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 1.0;
  
  // Very similar strings (one contains the other with high coverage)
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.includes(shorter) && shorter.length / longer.length >= 0.85) {
    return 0.92; // Treat as high similarity
  }
  
  // Word-based Jaccard similarity
  const words1 = new Set(s1.split(/\s+/).filter(w => w.length > 0));
  const words2 = new Set(s2.split(/\s+/).filter(w => w.length > 0));
  
  if (words1.size === 0 && words2.size === 0) return 1.0;
  if (words1.size === 0 || words2.size === 0) return 0.0;
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Compute minimum pairwise similarity/overlap across position_summary strings.
 */
function computeMinPairwiseSimilarity(divergencePoint: DivergencePoint): number {
  const positions = divergencePoint.positions || [];
  if (positions.length < 2) return 1.0; // Single position = no divergence
  
  let minSimilarity = 1.0;
  
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const summary1 = positions[i].position_summary || '';
      const summary2 = positions[j].position_summary || '';
      
      // Use text overlap (Jaccard similarity on words)
      const overlap = computeTextOverlap(summary1, summary2);
      minSimilarity = Math.min(minSimilarity, overlap);
    }
  }
  
  return minSimilarity;
}

/**
 * Normalize divergence points by converting false divergences to convergences.
 * 
 * Returns: { normalizedConvergencePoints, remainingDivergencePoints }
 */
export function normalizeDivergencePoints(
  divergencePoints: DivergencePoint[],
  embeddings?: Map<string, number[]>
): {
  normalizedConvergencePoints: ConvergencePoint[];
  remainingDivergencePoints: DivergencePoint[];
} {
  const normalizedConvergencePoints: ConvergencePoint[] = [];
  const remainingDivergencePoints: DivergencePoint[] = [];
  
  for (const dp of divergencePoints) {
    const minSimilarity = computeMinPairwiseSimilarity(dp);
    
    // If min pairwise similarity >= 0.92 OR overlap >= 0.85, convert to convergence
    if (minSimilarity >= 0.85) {
      // Extract unique lens IDs from positions
      const participatingLensIds = new Set<string>();
      const allClaimIds: string[] = [];
      
      for (const pos of dp.positions) {
        participatingLensIds.add(pos.lens_id);
        allClaimIds.push(...pos.claim_ids);
      }
      
      // Convert to convergence point
      normalizedConvergencePoints.push({
        theme_id: dp.theme_id,
        theme_label: dp.theme_label,
        supporting_lenses: Array.from(participatingLensIds),
        supporting_claims: allClaimIds,
        strength: dp.severity, // Use severity as strength
        evidence_density: 0, // Will be computed later
      });
    } else {
      // Keep as divergence
      remainingDivergencePoints.push(dp);
    }
  }
  
  return {
    normalizedConvergencePoints,
    remainingDivergencePoints,
  };
}
