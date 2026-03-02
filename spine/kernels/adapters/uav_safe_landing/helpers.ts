/**
 * Helpers: Utility functions for UAV safe landing kernel.
 */

/**
 * Simple deterministic hash (FNV-1a).
 */
export function hashString(s: string): string {
  let hash = 2166136261;
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}








































