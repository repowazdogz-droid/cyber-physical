// spine/llm/modes/attachOmegaMeta.ts

import type { OmegaMeta } from "./OmegaMeta";

/**
 * Safely attaches omegaMeta to an object that may have an omega field.
 * Returns the object unchanged if omegaMeta is undefined.
 */
export function attachOmegaMeta<T extends { omega?: OmegaMeta }>(
  base: T,
  omegaMeta?: OmegaMeta
): T {
  if (!omegaMeta) return base;
  return { ...base, omega: omegaMeta };
}




































