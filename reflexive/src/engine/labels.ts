import type { ExtractedClaim } from '../extraction/types.js';
import type { Theme } from './themes.js';

/**
 * Label a theme based on analytical lens claim or shortest claim.
 * Artifact 04 §5.8
 */
export function labelTheme(
  theme: Theme,
  claims: ExtractedClaim[],
  perspectiveLensMap: Map<string, { lens_name: string }>
): string {
  const claimMap = new Map(claims.map(c => [c.id, c]));
  const themeClaims = theme.claim_ids.map(id => claimMap.get(id)).filter((c): c is ExtractedClaim => c !== undefined);
  
  // Find claims from analytical lens
  const analyticalClaims = themeClaims.filter(c => {
    const lens = perspectiveLensMap.get(c.perspective_id);
    return lens && lens.lens_name.toLowerCase().includes('analytical');
  });
  
  if (analyticalClaims.length > 0) {
    // Use analytical claim statement, truncated to 120 chars
    const statement = analyticalClaims[0].statement;
    return statement.length > 120 ? statement.substring(0, 120) + '...' : statement;
  }
  
  // Use shortest claim statement
  if (themeClaims.length > 0) {
    const shortest = themeClaims.reduce((min, c) =>
      c.statement.length < min.statement.length ? c : min
    );
    
    // Tie-break: alphabetical sort by claim_id
    const tied = themeClaims.filter(c => c.statement.length === shortest.statement.length);
    tied.sort((a, b) => a.id.localeCompare(b.id));
    
    const selected = tied[0];
    const statement = selected.statement;
    return statement.length > 120 ? statement.substring(0, 120) + '...' : statement;
  }
  
  return 'Unlabeled theme';
}
