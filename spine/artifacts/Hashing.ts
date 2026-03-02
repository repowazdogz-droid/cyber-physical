/**
 * Hashing
 * 
 * Deterministic canonical JSON hash utilities.
 * Stable key ordering, no time-based logic.
 * 
 * Version: 1.0.0
 */

import { createHash } from 'crypto';

/**
 * Canonicalizes JSON by sorting keys recursively.
 * Ensures deterministic hash regardless of key order.
 */
function canonicalizeJSON(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => canonicalizeJSON(item));
  }

  if (typeof obj === 'object') {
    const sorted: Record<string, any> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = canonicalizeJSON(obj[key]);
    }
    return sorted;
  }

  return obj;
}

/**
 * Hashes an artifact payload deterministically.
 * Uses canonical JSON (sorted keys) + SHA-256.
 * No time-based logic.
 */
export function hashArtifact(payload: any): string {
  const canonical = canonicalizeJSON(payload);
  const jsonString = JSON.stringify(canonical);
  const hash = createHash('sha256');
  hash.update(jsonString);
  return hash.digest('hex');
}

/**
 * Hashes a string directly (for IDs, etc.).
 */
export function hashString(input: string): string {
  const hash = createHash('sha256');
  hash.update(input);
  return hash.digest('hex');
}

/**
 * Hashes bytes (Buffer).
 */
export function sha256Bytes(buffer: Buffer): string {
  const hash = createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

/**
 * Hashes a string using SHA-256.
 */
export function sha256String(input: string): string {
  return hashString(input);
}

/**
 * Hashes manifest root (sorted file hashes).
 * Stable ordering: files sorted by name, then hash concatenated.
 */
export function hashManifestRoot(files: Array<{ name: string; sha256: string }>): string {
  const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name));
  const concatenated = sorted.map(f => `${f.name}:${f.sha256}`).join('|');
  return hashString(concatenated);
}

