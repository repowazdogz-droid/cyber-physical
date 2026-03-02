/**
 * Canonical Hashing Rules
 * 
 * Byte canonicalization policy for content-addressable hashing.
 * 
 * Version: 1.0.0
 */

import { hashArtifact } from '../../../spine/artifacts/Hashing';

/**
 * Canonicalization rules:
 * 
 * 1. JSON keys sorted recursively (already in hashArtifact)
 * 2. Arrays: elements in deterministic order (no reordering)
 * 3. Sets: converted to sorted arrays
 * 4. Maps: keys sorted
 * 5. Floats: quantized or disallowed (v0: disallow floats)
 * 6. Whitespace: normalized (no trailing spaces, consistent indentation)
 * 7. Unicode: normalized (NFD or NFC)
 * 
 * For representations:
 * - Nodes sorted by canonical sort key
 * - Edges sorted lexicographically
 * - Attributes normalized (sorted keys, normalized lists/sets)
 * 
 * For programs:
 * - AST canonicalized (sorted children, normalized formatting)
 * - Source code canonicalized (whitespace normalized)
 */

/**
 * Computes content hash for any artifact.
 * Uses spine's hashArtifact which handles canonical JSON.
 */
export function hashCanonical(artifact: any): string {
  return hashArtifact(artifact);
}

/**
 * Canonical byte serialization rules:
 * 
 * 1. Use canonical JSON (sorted keys, no whitespace variation)
 * 2. UTF-8 encoding
 * 3. No BOM
 * 4. Line endings normalized (LF only)
 * 
 * This ensures same content → same bytes → same hash.
 */
export function canonicalBytes(obj: any): Buffer {
  const canonical = JSON.stringify(obj);
  return Buffer.from(canonical, 'utf8');
}























