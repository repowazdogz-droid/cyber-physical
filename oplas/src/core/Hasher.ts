/**
 * Hasher
 * 
 * Content-addressable hashing for representations.
 * Uses spine hashing utilities.
 * 
 * Version: 1.0.0
 */

import { hashArtifact } from '../../../spine/artifacts/Hashing';
import { CanonicalRepresentation } from './ReprTypes';

/**
 * Computes content hash for a canonical representation.
 * Deterministic: same repr → same hash.
 */
export function hashRepr(repr: CanonicalRepresentation): string {
  // Use spine's hashArtifact which canonicalizes JSON
  return hashArtifact(repr);
}

/**
 * Sets repr_id on a canonical representation.
 * Mutates the input (for convenience in pipeline).
 */
export function setReprId(repr: CanonicalRepresentation): void {
  repr.repr_id = hashRepr(repr);
}























