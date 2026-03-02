/**
 * Policy Pack: Composable safety primitives for kernels.
 * Domain-agnostic, deterministic, bounded.
 * 
 * Version: 0.1
 */

/**
 * Biases toward harder (more conservative) outcome in ordered list.
 * If current outcome is ambiguous, moves to next harder outcome.
 */
export function biasTowardHarderOutcome(
  outcomeOrder: string[],
  currentOutcome: string
): string {
  const currentIndex = outcomeOrder.indexOf(currentOutcome);
  if (currentIndex === -1) {
    return outcomeOrder[outcomeOrder.length - 1]; // Default to hardest
  }
  
  // If not at the end, bias to next harder outcome
  if (currentIndex < outcomeOrder.length - 1) {
    return outcomeOrder[currentIndex + 1];
  }
  
  return currentOutcome; // Already at hardest
}

/**
 * Treats ambiguity as worst case.
 * If authority/confidence is uncertain, treats as worst credible value.
 */
export function treatAmbiguityAsWorst<T extends Record<string, any>>(
  config: {
    authorityKey: string;
    confidenceKey?: string;
  },
  input: T
): T {
  const result = { ...input };
  
  // Check if confidence indicates uncertainty
  if (config.confidenceKey && input[config.confidenceKey]) {
    const confidence = input[config.confidenceKey];
    if (confidence === 'low' || confidence === 'unknown' || confidence === false) {
      // Bias authority to worst case
      // This is domain-specific; override in your kernel if needed
      return result;
    }
  }
  
  // If authority itself is marked uncertain, treat as worst
  if (input.uncertainty && input.uncertainty[config.authorityKey]) {
    // Domain-specific worst case handling
    // Override in your kernel implementation
    return result;
  }
  
  return result;
}

/**
 * Creates a disallow rule helper.
 * Returns a function that checks if outcome is disallowed.
 */
export function disallowOutcomes(
  disallowed: string[],
  reason: string
): (outcome: string) => { disallowed: boolean; reason: string } | null {
  return (outcome: string) => {
    if (disallowed.includes(outcome)) {
      return { disallowed: true, reason };
    }
    return null;
  };
}

/**
 * Creates an override rule helper.
 * Returns a function that checks if override condition is met.
 */
export function overrideOutcomeWhen<T extends Record<string, any>>(
  predicate: (input: T) => boolean,
  forcedOutcome: string,
  reason: string
): (input: T) => { override: boolean; outcome: string; reason: string } | null {
  return (input: T) => {
    if (predicate(input)) {
      return { override: true, outcome: forcedOutcome, reason };
    }
    return null;
  };
}

/**
 * Time-box outcome metadata (logic-only, no timers).
 * Returns metadata about time constraints for an outcome.
 */
export function timeBoxOutcome(
  outcomeId: string,
  maxMs: number,
  reason: string
): {
  outcomeId: string;
  maxDurationMs: number;
  reason: string;
  timestamp: string;
} {
  return {
    outcomeId,
    maxDurationMs: maxMs,
    reason,
    timestamp: new Date().toISOString() // For logging only, not used in decision
  };
}

/**
 * Bounds text to max length.
 */
export function boundedText(s: string, maxLen: number): string {
  if (s.length <= maxLen) {
    return s;
  }
  return s.substring(0, maxLen - 3) + '...';
}

/**
 * Safe label: strips "internal/system", trims, normalizes.
 */
export function safeLabel(s: string): string {
  return s
    .replace(/internal/gi, '')
    .replace(/system/gi, '')
    .trim()
    .replace(/\s+/g, ' ')
    .substring(0, 100); // Max 100 chars
}








































