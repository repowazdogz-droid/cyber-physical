/**
 * Storage
 * 
 * Stores canonical representations using artifact vault.
 * Gate 1a: JSON storage via artifact vault.
 * 
 * Version: 1.0.0
 */

import { ArtifactKind } from '../../../spine/artifacts/ArtifactTypes';
import { FsArtifactVault } from '../../../spine/artifacts/FsArtifactVault';
import { CanonicalRepresentation } from '../contracts/types/Repr';

const REPR_ARTIFACT_KIND = ArtifactKind.OPLAS_REPR;

/**
 * Storage interface for representations.
 */
export interface ReprStorage {
  store(repr: CanonicalRepresentation): Promise<string>;
  retrieve(reprId: string): Promise<CanonicalRepresentation | undefined>;
}

/**
 * File system storage implementation.
 */
export class FileReprStorage implements ReprStorage {
  private vault: FsArtifactVault;

  constructor(vaultRoot?: string) {
    this.vault = new FsArtifactVault(512 * 1024, vaultRoot);
  }

  async store(repr: CanonicalRepresentation): Promise<string> {
    const meta = await this.vault.put(
      REPR_ARTIFACT_KIND,
      repr.repr_id,
      repr
    );
    return meta.id;
  }

  async retrieve(reprId: string): Promise<CanonicalRepresentation | undefined> {
    const record = await this.vault.get<CanonicalRepresentation>(
      REPR_ARTIFACT_KIND,
      reprId
    );
    return record?.payload;
  }
}

