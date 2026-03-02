import { v5 as uuidv5 } from 'uuid';
import type { ExtractedClaim } from '../extraction/types.js';
import type { ClaimMatch } from './matching.js';

const THEME_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // fixed namespace for deterministic UUIDs

export interface Theme {
  theme_id: string;
  claim_ids: string[];
  lens_ids: string[];      // distinct
  strength: number;        // mean confidence_weight
  label: string;           // set later by labels module
}

/**
 * Union-Find data structure for clustering.
 */
class UnionFind {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();
  
  find(x: string): string {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
      return x;
    }
    
    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x)!));
    }
    return this.parent.get(x)!;
  }
  
  union(x: string, y: string): void {
    const rootX = this.find(x);
    const rootY = this.find(y);
    
    if (rootX === rootY) return;
    
    const rankX = this.rank.get(rootX) || 0;
    const rankY = this.rank.get(rootY) || 0;
    
    if (rankX < rankY) {
      this.parent.set(rootX, rootY);
    } else if (rankX > rankY) {
      this.parent.set(rootY, rootX);
    } else {
      this.parent.set(rootY, rootX);
      this.rank.set(rootX, rankX + 1);
    }
  }
  
  getComponents(): Map<string, string[]> {
    const components = new Map<string, string[]>();
    for (const [claimId] of this.parent) {
      const root = this.find(claimId);
      if (!components.has(root)) {
        components.set(root, []);
      }
      components.get(root)!.push(claimId);
    }
    return components;
  }
}

/**
 * Build themes from claim matches using single-linkage clustering.
 * Artifact 04 §5.3
 */
export function buildThemes(
  matches: ClaimMatch[],
  claims: ExtractedClaim[],
  perspectiveLensMap: Map<string, { lens_id: string }>
): Theme[] {
  const scoringClaims = claims.filter(c => c.scoring_eligible);
  const claimMap = new Map(scoringClaims.map(c => [c.id, c]));
  
  // Initialize union-find: each claim is its own set
  const uf = new UnionFind();
  for (const claim of scoringClaims) {
    uf.find(claim.id); // Initialize
  }
  
  // Union matched claims
  for (const match of matches) {
    uf.union(match.claim_a_id, match.claim_b_id);
  }
  
  // Get connected components
  const components = uf.getComponents();
  
  const themes: Theme[] = [];
  const matchedClaimIds = new Set<string>();
  
  // Build themes from components
  for (const [root, claimIds] of components) {
    if (claimIds.length === 0) continue;
    
    // Sort claim IDs for deterministic theme_id
    const sortedClaimIds = [...claimIds].sort();
    
    // Collect distinct lens IDs
    const lensIdsSet = new Set<string>();
    for (const claimId of sortedClaimIds) {
      const claim = claimMap.get(claimId);
      if (claim) {
        const lens = perspectiveLensMap.get(claim.perspective_id);
        if (lens) {
          lensIdsSet.add(lens.lens_id);
        }
      }
    }
    
    // Compute mean confidence weight
    const weights = sortedClaimIds
      .map(id => claimMap.get(id)?.confidence_weight ?? 0)
      .filter(w => w > 0);
    const strength = weights.length > 0
      ? weights.reduce((sum, w) => sum + w, 0) / weights.length
      : 0;
    
    // Generate deterministic theme_id
    const themeId = uuidv5(sortedClaimIds.join(','), THEME_NAMESPACE);
    
    themes.push({
      theme_id: themeId,
      claim_ids: sortedClaimIds,
      lens_ids: [...lensIdsSet].sort(),
      strength,
      label: '', // Set by labels module
    });
    
    // Track matched claims
    for (const claimId of sortedClaimIds) {
      matchedClaimIds.add(claimId);
    }
  }
  
  // Create single-claim themes for orphan claims
  for (const claim of scoringClaims) {
    if (!matchedClaimIds.has(claim.id)) {
      const lens = perspectiveLensMap.get(claim.perspective_id);
      if (lens) {
        const themeId = uuidv5(claim.id, THEME_NAMESPACE);
        themes.push({
          theme_id: themeId,
          claim_ids: [claim.id],
          lens_ids: [lens.lens_id],
          strength: claim.confidence_weight,
          label: '',
        });
      }
    }
  }
  
  // Sort themes by theme_id for deterministic output
  themes.sort((a, b) => a.theme_id.localeCompare(b.theme_id));
  
  return themes;
}
