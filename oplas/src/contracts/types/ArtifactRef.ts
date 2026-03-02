/**
 * Artifact Reference Types
 * 
 * References to artifacts in the system.
 * 
 * Version: 1.0.0
 */

import { ArtifactKind } from '../enums/ArtifactKinds';

/**
 * ArtifactRef: Reference to an artifact.
 */
export interface ArtifactRef {
  /** Artifact kind */
  kind: ArtifactKind;
  /** Content hash (required for derived artifacts) */
  content_hash?: string;
  /** URI (local path or content-addressable store key) */
  uri: string;
  /** Media type (e.g., application/json) */
  media_type: string;
}

/**
 * Invariants:
 * - content_hash required for all derived artifacts
 * - uri must be immutable for derived artifacts
 */























