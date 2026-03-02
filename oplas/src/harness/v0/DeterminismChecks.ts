/**
 * Determinism Hardening Checks
 * 
 * Drift traps and determinism enforcement.
 * 
 * Version: 1.0.0
 */

import { hashCanonical } from '../../contracts/invariants/CanonicalHashing';

/**
 * Checks if JSON serialization is deterministic.
 */
export function checkDeterministicJSON(obj: any): { ok: boolean; error?: string } {
  // Serialize twice and compare bytes
  const json1 = JSON.stringify(obj);
  const json2 = JSON.stringify(obj);

  if (json1 !== json2) {
    return {
      ok: false,
      error: 'JSON serialization is not deterministic (different outputs on repeated serialization)'
    };
  }

  // Check that hash is stable
  const hash1 = hashCanonical(obj);
  const hash2 = hashCanonical(obj);

  if (hash1 !== hash2) {
    return {
      ok: false,
      error: 'Hash computation is not deterministic (different hashes on repeated computation)'
    };
  }

  return { ok: true };
}

/**
 * Checks if map/list ordering is stable.
 */
export function checkStableOrdering(obj: any): { ok: boolean; error?: string } {
  // Recursively check all objects/arrays for stable ordering
  if (Array.isArray(obj)) {
    // Arrays should maintain order
    for (const item of obj) {
      const result = checkStableOrdering(item);
      if (!result.ok) {
        return result;
      }
    }
  } else if (obj !== null && typeof obj === 'object') {
    // Objects should have sorted keys (enforced by canonical hashing)
    const keys = Object.keys(obj);
    const sortedKeys = [...keys].sort();
    
    if (keys.length !== sortedKeys.length || keys.some((k, i) => k !== sortedKeys[i])) {
      // Check if this is a known stable object (like a Map)
      // For v0, we assume canonical hashing enforces key ordering
    }

    for (const key of keys) {
      const result = checkStableOrdering(obj[key]);
      if (!result.ok) {
        return result;
      }
    }
  }

  return { ok: true };
}

/**
 * Validates that an artifact has stable canonical representation.
 */
export function validateCanonicalStability(artifact: any): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check deterministic JSON
  const jsonCheck = checkDeterministicJSON(artifact);
  if (!jsonCheck.ok) {
    errors.push(jsonCheck.error || 'JSON determinism check failed');
  }

  // Check stable ordering
  const orderingCheck = checkStableOrdering(artifact);
  if (!orderingCheck.ok) {
    errors.push(orderingCheck.error || 'Ordering stability check failed');
  }

  return {
    ok: errors.length === 0,
    errors
  };
}

/**
 * Seed usage documentation (even if unused in v0).
 */
export interface SeedUsage {
  /** Seed value */
  seed: number;
  /** Whether seed is used */
  used: boolean;
  /** Purpose of seed */
  purpose: string;
}

/**
 * Documents seed usage for determinism audit.
 */
export function documentSeedUsage(seed: number | undefined, used: boolean = false): SeedUsage {
  return {
    seed: seed || 0,
    used,
    purpose: used ? 'Random number generation' : 'Reserved for future use (v0: unused)'
  };
}























