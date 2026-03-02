/**
 * Artifact Vault Interface
 * 
 * Interface for artifact storage and retrieval.
 * Bounded, deterministic, versioned.
 * 
 * Version: 1.0.0
 */

import { ArtifactKind, ArtifactRecord, ArtifactMeta, ArtifactFilter } from './ArtifactTypes';

/**
 * IArtifactVault: Interface for artifact storage.
 */
export interface IArtifactVault {
  /**
   * Stores an artifact.
   * @param kind Artifact kind
   * @param id Unique artifact ID
   * @param payload Artifact payload (will be hashed)
   * @param metaExtras Optional additional metadata
   * @returns Artifact metadata
   */
  put<T>(
    kind: ArtifactKind,
    id: string,
    payload: T,
    metaExtras?: Partial<ArtifactMeta>
  ): Promise<ArtifactMeta>;

  /**
   * Retrieves an artifact.
   * @param kind Artifact kind
   * @param id Artifact ID
   * @returns Artifact record or undefined if not found
   */
  get<T>(kind: ArtifactKind, id: string): Promise<ArtifactRecord<T> | undefined>;

  /**
   * Lists artifacts of a kind (bounded to 50).
   * @param kind Artifact kind
   * @param filter Optional filter
   * @returns Array of artifact metadata (bounded to 50)
   */
  list(kind: ArtifactKind, filter?: ArtifactFilter): Promise<ArtifactMeta[]>;

  /**
   * Deletes an artifact.
   * @param kind Artifact kind
   * @param id Artifact ID
   * @returns True if deleted, false if not found
   */
  delete(kind: ArtifactKind, id: string): Promise<boolean>;

  /**
   * Checks if an artifact exists.
   * @param kind Artifact kind
   * @param id Artifact ID
   * @returns True if exists, false otherwise
   */
  exists(kind: ArtifactKind, id: string): Promise<boolean>;
}








































