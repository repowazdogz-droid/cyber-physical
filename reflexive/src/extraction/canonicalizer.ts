import type { ExtractedClaim, CanonicalizationResult } from './types.js';

/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Normalize a string: trim, strip possessive, strip determiners, collapse whitespace, lowercase.
 * Order matters: strip possessive BEFORE lowercasing to handle both straight and curly apostrophes.
 */
function normalizeEntity(text: string): string {
  let normalized = text.trim();
  
  // Strip possessive FIRST (before lowercasing) - handles both ' and '
  // Match: 's or ' at end of string, or followed by space
  normalized = normalized.replace(/['']s(\s|$)/g, ' ');
  normalized = normalized.replace(/[''](\s|$)/g, ' ');
  
  // Collapse whitespace
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Lowercase
  normalized = normalized.toLowerCase();
  
  // Strip determiners (case-insensitive)
  normalized = normalized.replace(/^(the|a|an|of the|for the)\s+/, '');

  return normalized.trim();
}

/**
 * Extract noun phrases from text (sequences of 1-5 capitalized words, including camelCase).
 */
function extractNounPhrases(text: string): string[] {
  const phrases: string[] = [];
  const determiners = new Set(['The', 'A', 'An', 'Of', 'For']);
  
  // Extract capitalized sequences (including camelCase like "HelioTech")
  // Pattern: word starting with capital, optionally followed by camelCase or more capitalized words
  const capMatch = text.matchAll(/\b([A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*){0,4})\b/g);
  for (const match of capMatch) {
    const phrase = match[1];
    // Skip if phrase starts with a determiner (we'll get the noun part separately)
    const words = phrase.split(/\s+/);
    if (words.length > 1 && determiners.has(words[0])) {
      // Add the phrase without the determiner
      phrases.push(words.slice(1).join(' '));
    }
    // Also add the full phrase (for cases where determiner is part of the entity name)
    phrases.push(phrase);
  }

  // Extract quoted strings
  const quotedDouble = text.matchAll(/"([^"]+)"/g);
  for (const match of quotedDouble) {
    phrases.push(match[1]);
  }

  const quotedSingle = text.matchAll(/'([^']+)'/g);
  for (const match of quotedSingle) {
    phrases.push(match[1]);
  }

  // Remove duplicates
  return [...new Set(phrases)];
}

/**
 * Fallback extraction: attempt to extract entity from statement when candidate is empty.
 */
function fallbackExtraction(statement: string, stimulus_text: string): string {
  // Check for quoted proper noun
  const quotedMatch = statement.match(/"([^"]+)"/) || statement.match(/'([^']+)'/);
  if (quotedMatch) {
    return quotedMatch[1];
  }

  // Extract noun phrases from statement
  const statementPhrases = extractNounPhrases(statement);
  const stimulusPhrases = extractNounPhrases(stimulus_text);

  // Find longest match
  let longestMatch = '';
  for (const stmtPhrase of statementPhrases) {
    for (const stimPhrase of stimulusPhrases) {
      const normalizedStmt = normalizeEntity(stmtPhrase);
      const normalizedStim = normalizeEntity(stimPhrase);
      if (normalizedStmt === normalizedStim && stmtPhrase.length > longestMatch.length) {
        longestMatch = stmtPhrase;
      }
    }
  }
  if (longestMatch) {
    return longestMatch;
  }

  // Extract first noun phrase before verb (only if it starts with capital letter and is not a common word)
  const commonWords = ['this', 'that', 'these', 'those', 'the', 'a', 'an'];
  const verbPattern = /^(is|are|was|were|has|have|had|will|would|could|should|can|may|might|must|do|does|did)\b/i;
  const words = statement.split(/\s+/);
  let beforeVerb: string[] = [];
  for (const word of words) {
    if (verbPattern.test(word)) {
      break;
    }
    beforeVerb.push(word);
  }
  // Only return if first word starts with capital AND is not a common word
  if (beforeVerb.length > 0 && beforeVerb.length <= 4 && /^[A-Z]/.test(beforeVerb[0])) {
    const firstWord = beforeVerb[0].toLowerCase();
    if (!commonWords.includes(firstWord)) {
      return beforeVerb.join(' ');
    }
  }

  return 'unresolved';
}

/**
 * Match candidate against a list of entities using exact, substring, and fuzzy matching.
 * Used for stimulus entity matching.
 */
function matchEntity(
  candidate: string,
  entities: string[],
  minLengthForFuzzy: number = 6
): { match: string | null; method: 'exact' | 'substring' | 'fuzzy' | null } {
  const normalizedCandidate = normalizeEntity(candidate);

  // Try exact match first
  for (const entity of entities) {
    const normalizedEntity = normalizeEntity(entity);
    if (normalizedCandidate === normalizedEntity) {
      return { match: entity, method: 'exact' };
    }
  }

  // Try substring match
  let bestSubstring: { match: string; length: number } | null = null;
  for (const entity of entities) {
    const normalizedEntity = normalizeEntity(entity);
    if (normalizedCandidate.includes(normalizedEntity) || normalizedEntity.includes(normalizedCandidate)) {
      if (!bestSubstring || entity.length > bestSubstring.length) {
        bestSubstring = { match: entity, length: entity.length };
      }
    }
  }
  if (bestSubstring) {
    return { match: bestSubstring.match, method: 'substring' };
  }

  // Try fuzzy match (only if both strings are long enough)
  if (normalizedCandidate.length >= minLengthForFuzzy) {
    let bestFuzzy: { match: string; distance: number } | null = null;
    for (const entity of entities) {
      const normalizedEntity = normalizeEntity(entity);
      if (normalizedEntity.length >= minLengthForFuzzy) {
        const distance = levenshtein(normalizedCandidate, normalizedEntity);
        if (distance <= 2) {
          if (!bestFuzzy || distance < bestFuzzy.distance) {
            bestFuzzy = { match: entity, distance };
          }
        }
      }
    }
    if (bestFuzzy) {
      return { match: bestFuzzy.match, method: 'fuzzy' };
    }
  }

  return { match: null, method: null };
}

/**
 * Match candidate against existing canonicals using exact and substring matching ONLY.
 * No fuzzy matching to avoid false merges of similar but distinct words.
 */
function matchCrossClaim(
  candidate: string,
  existingCanonicals: string[]
): { match: string | null; method: 'exact' | 'substring' | null } {
  const normalizedCandidate = normalizeEntity(candidate);

  // Try exact match first
  for (const canonical of existingCanonicals) {
    const normalizedCanonical = normalizeEntity(canonical);
    if (normalizedCandidate === normalizedCanonical) {
      return { match: canonical, method: 'exact' };
    }
  }

  // Try substring match
  let bestSubstring: { match: string; length: number } | null = null;
  for (const canonical of existingCanonicals) {
    const normalizedCanonical = normalizeEntity(canonical);
    if (normalizedCandidate.includes(normalizedCanonical) || normalizedCanonical.includes(normalizedCandidate)) {
      if (!bestSubstring || canonical.length > bestSubstring.length) {
        bestSubstring = { match: canonical, length: canonical.length };
      }
    }
  }
  if (bestSubstring) {
    return { match: bestSubstring.match, method: 'substring' };
  }

  return { match: null, method: null };
}

/**
 * Canonicalize about_entity_candidate for all claims.
 * Modifies claims in place and returns the same array.
 */
export function canonicalizeClaims(
  claims: ExtractedClaim[],
  stimulus_text: string
): ExtractedClaim[] {
  // Extract stimulus entities
  const stimulusPhrases = extractNounPhrases(stimulus_text);
  const stimulusEntities = [...new Set(stimulusPhrases)];

  // Track assigned canonicals
  const assignedCanonicals = new Map<string, string>(); // claim_id -> canonical

  for (const claim of claims) {
    let candidate = claim.about_entity_candidate;

    // Fallback extraction if candidate is empty
    if (!candidate || candidate.trim() === '') {
      candidate = fallbackExtraction(claim.statement, stimulus_text);
      if (candidate === 'unresolved') {
        claim.about_entity_canonical = 'unresolved';
        claim.validity = 'invalid';
        claim.scoring_eligible = false;
        claim.repairs.push('about_entity: empty → unresolved via fallback_extraction');
        continue;
      }
    }

    // Normalize candidate
    const normalizedCandidate = normalizeEntity(candidate);

    // Try stimulus match
    const stimulusMatch = matchEntity(candidate, stimulusEntities);
    if (stimulusMatch.match) {
      // Preserve original case from stimulus entity
      claim.about_entity_canonical = stimulusMatch.match;
      claim.repairs.push(`about_entity: '${candidate}' → '${stimulusMatch.match}' via stimulus_match`);
      assignedCanonicals.set(claim.id, stimulusMatch.match);
      continue;
    }

    // Try cross-claim match (exact and substring only, no fuzzy)
    const existingCanonicals = Array.from(assignedCanonicals.values());
    const crossMatch = matchCrossClaim(candidate, existingCanonicals);
    if (crossMatch.match) {
      claim.about_entity_canonical = crossMatch.match;
      claim.repairs.push(`about_entity: '${candidate}' → '${crossMatch.match}' via cross_claim_match`);
      assignedCanonicals.set(claim.id, crossMatch.match);
      continue;
    }

    // No match found: use normalized candidate as new canonical
    // Always use normalized version (lowercase, possessive stripped, determiners removed)
    // This ensures consistent canonicalization even for proper nouns
    claim.about_entity_canonical = normalizedCandidate;
    claim.repairs.push(`about_entity: '${candidate}' → '${normalizedCandidate}' via normalized`);
    assignedCanonicals.set(claim.id, normalizedCandidate);
  }

  return claims;
}
