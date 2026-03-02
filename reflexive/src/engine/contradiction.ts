import { ENGINE_CONFIG } from '../config.js';
import type { ExtractedClaim } from '../extraction/types.js';
import type { Theme } from './themes.js';
import type { ScopeResult } from './scope.js';

export interface ContradictionResult {
  claim_a_id: string;
  claim_b_id: string;
  contradictory: boolean;
  rule: 'polarity_opposition' | 'quantitative_opposition' | 'explicit_opposition' | null;
  details: string;
}

const OPPOSITION_PAIRS: [string, string][] = [
  ['viable', 'unviable'],
  ['sufficient', 'insufficient'],
  ['likely', 'unlikely'],
  ['overvalued', 'undervalued'],
  ['premature', 'timely'],
  ['strengthen', 'weaken'],
  ['benefit', 'harm'],
  ['growth', 'decline'],
];

/**
 * Check if a word appears in text (whole-word matching).
 * Excludes negated forms (e.g., "not viable" should not match "viable" for opposition).
 */
function containsWord(text: string, word: string): boolean {
  // Check for word with negation prefix (not, un-, non-, etc.)
  const negatedPattern = new RegExp(`\\b(?:not|un|non|in|dis|anti)\\s*${word}\\b`, 'i');
  if (negatedPattern.test(text)) {
    return false; // Word is negated, don't match
  }
  const regex = new RegExp(`\\b${word}\\b`, 'i');
  return regex.test(text);
}

/**
 * Extract quantitative values from statement text.
 * Only matches numbers in quantitative contexts (currency, percentages, multipliers, change phrases, number+unit).
 * This avoids false positives from incidental numbers like "lens 1" vs "lens 3".
 */
const QUANT_PATTERNS = [
  /\$[\d,.]+[BMKTbmkt]?/g,           // currency: $500M, $12.5B
  /[\d,.]+%/g,                         // percentage: 15%, 2.5%
  /[\d,.]+x/g,                         // multiplier: 3.5x, 10x
  /(?:increased?|decreased?|grew|fell|dropped|rose|gained|lost|declined)\s+(?:by\s+)?[\d,.]+/gi,  // change phrases
  /[\d,.]+\s*(?:billion|million|thousand|trillion|percent|months?|years?|quarters?|days?|weeks?)/gi, // number + unit
];

function extractQuantitativeValues(statement: string): number[] {
  const values: number[] = [];
  for (const pattern of QUANT_PATTERNS) {
    const matches = statement.matchAll(pattern);
    for (const match of matches) {
      // Extract the numeric part
      const numMatch = match[0].match(/[\d,.]+/);
      if (numMatch) {
        const num = parseFloat(numMatch[0].replace(/,/g, ''));
        if (!isNaN(num) && num > 0) values.push(num);
      }
    }
  }
  return values;
}

/**
 * Detect contradictions in themes.
 * Artifact 04 §5.7
 * Only runs on pairs NOT marked scope-dependent.
 */
export function detectContradictions(
  themes: Theme[],
  claims: ExtractedClaim[],
  scope_results: ScopeResult[],
  perspectiveLensMap: Map<string, { lens_id: string }>
): ContradictionResult[] {
  const claimMap = new Map(claims.map(c => [c.id, c]));
  const scopeMap = new Map<string, boolean>();
  
  // Build scope map: (claim_a_id, claim_b_id) -> is_scope_dependent
  for (const scope of scope_results) {
    const key1 = `${scope.claim_a_id}:${scope.claim_b_id}`;
    const key2 = `${scope.claim_b_id}:${scope.claim_a_id}`;
    scopeMap.set(key1, scope.scope_dependent);
    scopeMap.set(key2, scope.scope_dependent);
  }
  
  const results: ContradictionResult[] = [];
  
  // For each theme with claims from >= 2 lenses
  for (const theme of themes) {
    if (theme.lens_ids.length < 2) continue;
    
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
    
    // Check all intra-theme cross-lens pairs NOT scope-dependent
    const lensIds = [...claimsByLens.keys()];
    for (let i = 0; i < lensIds.length; i++) {
      for (let j = i + 1; j < lensIds.length; j++) {
        const claimsA = claimsByLens.get(lensIds[i]) || [];
        const claimsB = claimsByLens.get(lensIds[j]) || [];
        
        for (const claimA of claimsA) {
          for (const claimB of claimsB) {
            const scopeKey = `${claimA.id}:${claimB.id}`;
            if (scopeMap.get(scopeKey) === true) {
              // Skip scope-dependent pairs
              results.push({
                claim_a_id: claimA.id,
                claim_b_id: claimB.id,
                contradictory: false,
                rule: null,
                details: 'scope_dependent',
              });
              continue;
            }
            
            // Rule 1: Polarity opposition
            if (
              claimA.polarity &&
              claimB.polarity &&
              claimA.polarity !== 'neutral' &&
              claimB.polarity !== 'neutral' &&
              claimA.polarity !== claimB.polarity &&
              claimA.about_entity_canonical &&
              claimB.about_entity_canonical &&
              claimA.about_entity_canonical === claimB.about_entity_canonical &&
              claimA.category === claimB.category
            ) {
              results.push({
                claim_a_id: claimA.id,
                claim_b_id: claimB.id,
                contradictory: true,
                rule: 'polarity_opposition',
                details: `${claimA.polarity} vs ${claimB.polarity}`,
              });
              continue;
            }
            
            // Rule 2: Quantitative opposition
            // Only match numbers in quantitative contexts (currency, percentages, multipliers, change phrases, number+unit)
            const numsA = extractQuantitativeValues(claimA.statement);
            const numsB = extractQuantitativeValues(claimB.statement);
            
            if (numsA.length > 0 && numsB.length > 0) {
              const valA = numsA[0];
              const valB = numsB[0];
              
              const diff = Math.abs(valA - valB);
              const maxVal = Math.max(valA, valB);
              const ratio = diff / maxVal;
              
              if (ratio > ENGINE_CONFIG.QUANT_DIFF) {
                results.push({
                  claim_a_id: claimA.id,
                  claim_b_id: claimB.id,
                  contradictory: true,
                  rule: 'quantitative_opposition',
                  details: `${valA} vs ${valB} (${(ratio * 100).toFixed(1)}% diff)`,
                });
                continue;
              }
            }
            
            // Rule 3: Explicit opposition
            if (
              claimA.about_entity_canonical &&
              claimB.about_entity_canonical &&
              claimA.about_entity_canonical === claimB.about_entity_canonical &&
              claimA.category === claimB.category
            ) {
              for (const [termA, termB] of OPPOSITION_PAIRS) {
                // Check if either term appears as a standalone word (not as part of the other term)
                // e.g., "unviable" contains "viable" but we should match "unviable" not "viable"
                const hasA = containsWord(claimA.statement, termA) && !containsWord(claimA.statement, termB);
                const hasB = containsWord(claimB.statement, termB) && !containsWord(claimB.statement, termA);
                
                if (hasA && hasB) {
                  results.push({
                    claim_a_id: claimA.id,
                    claim_b_id: claimB.id,
                    contradictory: true,
                    rule: 'explicit_opposition',
                    details: `${termA} vs ${termB}`,
                  });
                  break;
                }
                
                // Check reverse
                const hasARev = containsWord(claimA.statement, termB) && !containsWord(claimA.statement, termA);
                const hasBRev = containsWord(claimB.statement, termA) && !containsWord(claimB.statement, termB);
                
                if (hasARev && hasBRev) {
                  results.push({
                    claim_a_id: claimA.id,
                    claim_b_id: claimB.id,
                    contradictory: true,
                    rule: 'explicit_opposition',
                    details: `${termB} vs ${termA}`,
                  });
                  break;
                }
              }
              
              if (results.length > 0 && results[results.length - 1].contradictory) {
                continue;
              }
            }
            
            // Not contradictory
            results.push({
              claim_a_id: claimA.id,
              claim_b_id: claimB.id,
              contradictory: false,
              rule: null,
              details: '',
            });
          }
        }
      }
    }
  }
  
  return results;
}
