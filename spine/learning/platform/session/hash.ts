/**
 * Deterministic Hash Helper
 * 
 * Simple, stable hash function for deterministic hashing.
 * Uses FNV-1a algorithm (no crypto dependencies).
 * 
 * Version: 0.1
 */

/**
 * FNV-1a hash function (32-bit).
 * Deterministic and stable across platforms.
 */
export function hashString(input: string): string {
  const FNV_OFFSET_BASIS = 2166136261;
  const FNV_PRIME = 16777619;
  
  let hash = FNV_OFFSET_BASIS;
  
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash * FNV_PRIME) >>> 0; // Force unsigned 32-bit
  }
  
  return Math.abs(hash).toString(16).substring(0, 16);
}








































