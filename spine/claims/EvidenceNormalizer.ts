/**
 * Evidence Normalizer
 * 
 * Normalizes evidence for safe display across web, recap, and XR surfaces.
 * Bounded, deterministic, strips internal/system markers.
 * 
 * Version: 1.0.0
 */

import { ClaimEvidenceContract } from '../contracts/ClaimContracts';

/**
 * Normalized Evidence Item: Display-safe evidence.
 */
export interface NormalizedEvidenceItem {
  /** Type */
  type: string;
  /** Reference (max 100 chars) */
  reference: string;
  /** Description (max 120 chars) */
  description: string;
  /** Data (bounded, max 5 keys, no internal/system) */
  data?: Record<string, string | number | boolean>;
}

/**
 * Normalized Evidence: Bounded array of display-safe evidence.
 */
export interface NormalizedEvidence {
  /** Items (bounded, max 5) */
  items: NormalizedEvidenceItem[];
}

/**
 * Internal/system key patterns to strip.
 */
const INTERNAL_PATTERNS = [
  /internal/i,
  /system/i,
  /debug/i,
  /trace_internal/i,
  /system_guardrail/i
];

/**
 * Checks if a key should be stripped (contains internal/system markers).
 */
function shouldStripKey(key: string): boolean {
  return INTERNAL_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * Strips internal/system keys from an object.
 * Returns new object with only safe keys.
 */
export function stripInternalKeys<T extends Record<string, any>>(obj: T): Partial<T> {
  const safe: Partial<T> = {};
  let keyCount = 0;
  const MAX_KEYS = 5;
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (keyCount >= MAX_KEYS) {
        break; // Bounded
      }
      
      if (!shouldStripKey(key)) {
        // Also check value if it's a string
        const value = obj[key];
        if (typeof value === 'string' && !shouldStripKey(value)) {
          safe[key] = value;
          keyCount++;
        } else if (typeof value !== 'string') {
          safe[key] = value;
          keyCount++;
        }
      }
    }
  }
  
  return safe;
}

/**
 * Truncates text to max length with ellipsis.
 */
export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) {
    return text;
  }
  return text.substring(0, maxLen - 3) + '...';
}

/**
 * Normalizes evidence for display.
 * Bounded, deterministic, display-safe.
 */
export function normalizeEvidenceForDisplay(
  evidence: ClaimEvidenceContract | unknown
): NormalizedEvidence {
  const items: NormalizedEvidenceItem[] = [];
  const MAX_ITEMS = 5;
  
  // Handle array of evidence
  if (Array.isArray(evidence)) {
    for (let i = 0; i < Math.min(evidence.length, MAX_ITEMS); i++) {
      const item = evidence[i];
      if (item && typeof item === 'object') {
        const normalized = normalizeSingleEvidence(item);
        if (normalized) {
          items.push(normalized);
        }
      }
    }
  } else if (evidence && typeof evidence === 'object') {
    // Single evidence item
    const normalized = normalizeSingleEvidence(evidence);
    if (normalized) {
      items.push(normalized);
    }
  }
  
  return { items };
}

/**
 * Normalizes a single evidence item.
 */
function normalizeSingleEvidence(item: any): NormalizedEvidenceItem | null {
  if (!item || typeof item !== 'object') {
    return null;
  }
  
  // Extract fields (with defaults)
  const type = typeof item.type === 'string' ? item.type : 'unknown';
  const reference = typeof item.reference === 'string' 
    ? truncate(item.reference, 100) 
    : '';
  const description = typeof item.description === 'string'
    ? truncate(item.description, 120)
    : '';
  
  // Normalize data (strip internal keys, bound size)
  let data: Record<string, string | number | boolean> | undefined;
  if (item.data && typeof item.data === 'object') {
    const stripped = stripInternalKeys(item.data);
    if (Object.keys(stripped).length > 0) {
      data = stripped as Record<string, string | number | boolean>;
    }
  }
  
  // Skip if reference is internal/system
  if (shouldStripKey(reference)) {
    return null;
  }
  
  return {
    type,
    reference,
    description,
    data
  };
}

/**
 * Normalizes evidence array deterministically (sorted by reference).
 */
export function normalizeEvidenceArray(
  evidence: ClaimEvidenceContract[]
): NormalizedEvidence {
  // Sort deterministically by reference
  const sorted = [...evidence].sort((a, b) => {
    const refA = a.reference || '';
    const refB = b.reference || '';
    return refA.localeCompare(refB);
  });
  
  return normalizeEvidenceForDisplay(sorted);
}








































