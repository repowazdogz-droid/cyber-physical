import type { PolarityResult } from './types.js';

const POSITIVE_TERMS = [
  'viable', 'sufficient', 'likely', 'strong', 'benefit', 'strengthen',
  'growth', 'successful', 'timely', 'adequate', 'favorable', 'promising',
  'sound', 'profitable', 'efficient', 'robust', 'stable', 'resilient',
];

const NEGATIVE_TERMS = [
  'unviable', 'insufficient', 'unlikely', 'weak', 'harm', 'weaken',
  'decline', 'failing', 'premature', 'inadequate', 'unfavorable', 'risky',
  'unsound', 'overpay', 'overvalued', 'fragile', 'unstable', 'inefficient',
  'unprofitable', 'volatile', 'deteriorating',
];

const NEGATION_MARKERS = [
  'not', 'no', 'never', "won't", 'cannot', "don't", "doesn't",
  "isn't", "aren't", "wasn't", "weren't", "wouldn't", "couldn't",
  "shouldn't", 'neither', 'nor', 'lack', 'without',
];

/**
 * Tokenize text: split on non-alphanumeric, keeping apostrophes in contractions.
 */
function tokenize(text: string): string[] {
  // Split on non-alphanumeric, but preserve apostrophes within words
  const tokens: string[] = [];
  const words = text.split(/\s+/);
  for (const word of words) {
    // Split word by non-alphanumeric except apostrophes
    const parts = word.split(/([^a-zA-Z0-9']+)/);
    for (const part of parts) {
      if (part.trim()) {
        tokens.push(part.toLowerCase());
      }
    }
  }
  return tokens;
}

/**
 * Check if a term matches as a whole word in a token array.
 */
function isWholeWordMatch(term: string, tokens: string[], index: number): boolean {
  const termTokens = tokenize(term);
  if (index + termTokens.length > tokens.length) {
    return false;
  }
  for (let i = 0; i < termTokens.length; i++) {
    if (tokens[index + i] !== termTokens[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Check if a negation marker appears within the preceding N tokens.
 */
function hasNegationMarker(tokens: string[], index: number, lookback: number = 3): boolean {
  const start = Math.max(0, index - lookback);
  for (let i = start; i < index; i++) {
    const token = tokens[i];
    // Remove trailing punctuation for matching
    const cleanToken = token.replace(/[.,!?;:]$/, '');
    if (NEGATION_MARKERS.includes(cleanToken)) {
      return true;
    }
  }
  return false;
}

/**
 * Classify polarity of a statement using keyword matching and negation detection.
 * Implements Artifact 04 §5.5.
 */
export function classifyPolarity(statement: string): PolarityResult {
  const tokens = tokenize(statement);
  const matchedTerms: string[] = [];
  const negationInversions: string[] = [];
  let positiveCount = 0;
  let negativeCount = 0;

  // Scan for positive terms
  for (let i = 0; i < tokens.length; i++) {
    for (const term of POSITIVE_TERMS) {
      if (isWholeWordMatch(term, tokens, i)) {
        const hasNegation = hasNegationMarker(tokens, i);
        matchedTerms.push(term);
        if (hasNegation) {
          negativeCount++;
          negationInversions.push(`${term} (negated)`);
        } else {
          positiveCount++;
        }
        // Skip past this term
        i += tokenize(term).length - 1;
        break;
      }
    }
  }

  // Scan for negative terms
  for (let i = 0; i < tokens.length; i++) {
    for (const term of NEGATIVE_TERMS) {
      if (isWholeWordMatch(term, tokens, i)) {
        const hasNegation = hasNegationMarker(tokens, i);
        matchedTerms.push(term);
        if (hasNegation) {
          positiveCount++;
          negationInversions.push(`${term} (negated)`);
        } else {
          negativeCount++;
        }
        // Skip past this term
        i += tokenize(term).length - 1;
        break;
      }
    }
  }

  // Determine polarity
  let polarity: 'positive' | 'negative' | 'neutral';
  if (positiveCount > 0 && negativeCount === 0) {
    polarity = 'positive';
  } else if (negativeCount > 0 && positiveCount === 0) {
    polarity = 'negative';
  } else {
    polarity = 'neutral';
  }

  return {
    polarity,
    matched_terms: matchedTerms,
    negation_inversions: negationInversions,
  };
}
