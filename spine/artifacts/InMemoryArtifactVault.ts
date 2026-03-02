/**
 * In-Memory Artifact Vault
 * 
 * In-memory implementation for tests.
 * Bounded maps, FIFO eviction per kind (cap 200 total).
 * 
 * Version: 1.0.0
 */

import { IArtifactVault } from './IArtifactVault';
import { ArtifactKind, ArtifactRecord, ArtifactMeta, ArtifactFilter } from './ArtifactTypes';
import { hashArtifact } from './Hashing';
import { CONTRACT_VERSION } from '../contracts/ContractVersion';

const MAX_TOTAL_ARTIFACTS = 200;
const MAX_LIST_RESULTS = 50;

/**
 * In-Memory Artifact Vault implementation.
 */
export class InMemoryArtifactVault implements IArtifactVault {
  private storage: Map<string, ArtifactRecord> = new Map();
  private accessOrder: string[] = []; // For FIFO eviction

  private getKey(kind: ArtifactKind, id: string): string {
    return `${kind}:${id}`;
  }

  private evictIfNeeded(): void {
    if (this.storage.size < MAX_TOTAL_ARTIFACTS) {
      return;
    }

    // FIFO eviction: remove oldest accessed
    while (this.storage.size >= MAX_TOTAL_ARTIFACTS && this.accessOrder.length > 0) {
      const oldestKey = this.accessOrder.shift()!;
      this.storage.delete(oldestKey);
    }
  }

  async put<T>(
    kind: ArtifactKind,
    id: string,
    payload: T,
    metaExtras?: Partial<ArtifactMeta>
  ): Promise<ArtifactMeta> {
    const contentHash = hashArtifact(payload);
    const jsonString = JSON.stringify(payload);
    const sizeBytes = Buffer.byteLength(jsonString, 'utf8');

    const meta: ArtifactMeta = {
      id,
      kind,
      createdAtIso: new Date().toISOString(),
      contractVersion: CONTRACT_VERSION,
      contentHash,
      sizeBytes,
      ...metaExtras
    };

    const key = this.getKey(kind, id);
    const record: ArtifactRecord<T> = {
      meta,
      payload
    };

    // Remove from access order if exists (will be re-added)
    const existingIndex = this.accessOrder.indexOf(key);
    if (existingIndex >= 0) {
      this.accessOrder.splice(existingIndex, 1);
    }

    this.storage.set(key, record);
    this.accessOrder.push(key);

    this.evictIfNeeded();

    return meta;
  }

  async get<T>(kind: ArtifactKind, id: string): Promise<ArtifactRecord<T> | undefined> {
    const key = this.getKey(kind, id);
    const record = this.storage.get(key);
    
    if (record) {
      // Update access order (move to end)
      const index = this.accessOrder.indexOf(key);
      if (index >= 0) {
        this.accessOrder.splice(index, 1);
      }
      this.accessOrder.push(key);
    }

    return record as ArtifactRecord<T> | undefined;
  }

  async list(kind: ArtifactKind, filter?: ArtifactFilter): Promise<ArtifactMeta[]> {
    const results: ArtifactMeta[] = [];

    for (const [key, record] of this.storage.entries()) {
      if (key.startsWith(`${kind}:`)) {
        // Apply filters
        if (filter) {
          if (filter.tags && (!record.meta.tags || !filter.tags.every(tag => record.meta.tags!.includes(tag)))) {
            continue;
          }
          if (filter.contractVersion && record.meta.contractVersion !== filter.contractVersion) {
            continue;
          }
          if (filter.createdAfter && record.meta.createdAtIso < filter.createdAfter) {
            continue;
          }
          if (filter.createdBefore && record.meta.createdAtIso > filter.createdBefore) {
            continue;
          }
        }

        results.push(record.meta);
      }
    }

    // Sort by createdAtIso (newest first) and bound to max results
    results.sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
    return results.slice(0, MAX_LIST_RESULTS);
  }

  async delete(kind: ArtifactKind, id: string): Promise<boolean> {
    const key = this.getKey(kind, id);
    const existed = this.storage.has(key);
    
    if (existed) {
      this.storage.delete(key);
      const index = this.accessOrder.indexOf(key);
      if (index >= 0) {
        this.accessOrder.splice(index, 1);
      }
    }

    return existed;
  }

  async exists(kind: ArtifactKind, id: string): Promise<boolean> {
    const key = this.getKey(kind, id);
    return this.storage.has(key);
  }
}








































