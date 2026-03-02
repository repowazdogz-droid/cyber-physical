/**
 * File System Artifact Vault
 * 
 * File system implementation of IArtifactVault.
 * Stores artifacts under /tmp/artifactVault/{kind}/{id}.json
 * Atomic writes: .tmp then replace.
 * 
 * Version: 1.0.0
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { IArtifactVault } from './IArtifactVault';
import { ArtifactKind, ArtifactRecord, ArtifactMeta, ArtifactFilter, DEFAULT_PAYLOAD_SIZE_LIMIT } from './ArtifactTypes';
import { hashArtifact } from './Hashing';
import { CONTRACT_VERSION } from '../contracts/ContractVersion';

const DEFAULT_VAULT_ROOT = '/tmp/artifactVault';
const MAX_LIST_RESULTS = 50;

/**
 * Ensures directory exists, retrying if it's removed during creation.
 * Handles race conditions where directory is deleted by another process.
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return; // Success
    } catch (error: any) {
      if (error.code === 'ENOENT' && attempt < maxAttempts - 1) {
        // Directory or parent was removed, retry
        continue;
      }
      // EEXIST is fine (directory already exists), other errors should be thrown
      if (error.code !== 'EEXIST') {
        throw error;
      }
      return; // EEXIST means directory exists, success
    }
  }
}

/**
 * File System Artifact Vault implementation.
 */
export class FsArtifactVault implements IArtifactVault {
  private payloadSizeLimit: number;
  private vaultRoot: string;

  constructor(payloadSizeLimit: number = DEFAULT_PAYLOAD_SIZE_LIMIT, vaultRoot?: string) {
    this.payloadSizeLimit = payloadSizeLimit;
    this.vaultRoot = vaultRoot ?? DEFAULT_VAULT_ROOT;
  }

  async put<T>(
    kind: ArtifactKind,
    id: string,
    payload: T,
    metaExtras?: Partial<ArtifactMeta>
  ): Promise<ArtifactMeta> {
    // Validate payload size
    const jsonString = JSON.stringify(payload);
    const sizeBytes = Buffer.byteLength(jsonString, 'utf8');
    if (sizeBytes > this.payloadSizeLimit) {
      throw new Error(`Payload size ${sizeBytes} exceeds limit ${this.payloadSizeLimit}`);
    }

    // Compute content hash
    const contentHash = hashArtifact(payload);

    // Build metadata
    const meta: ArtifactMeta = {
      id,
      kind,
      createdAtIso: new Date().toISOString(),
      contractVersion: CONTRACT_VERSION,
      contentHash,
      sizeBytes,
      ...metaExtras
    };

    // Create artifact record
    const record: ArtifactRecord<T> = {
      meta,
      payload
    };

    // Ensure directory exists
    const kindDir = join(this.vaultRoot, kind);
    
    // Atomic write: write to .tmp first, then rename
    const filePath = join(kindDir, `${id}.json`);
    const tmpPath = `${filePath}.tmp`;
    
    // Ensure directories exist before write
    await ensureDirectoryExists(this.vaultRoot);
    await ensureDirectoryExists(kindDir);
    await fs.writeFile(tmpPath, JSON.stringify(record, null, 2), 'utf8');
    
    // Ensure directories exist before rename (atomic operation)
    await ensureDirectoryExists(this.vaultRoot);
    await ensureDirectoryExists(kindDir);
    await fs.rename(tmpPath, filePath);

    return meta;
  }

  async get<T>(kind: ArtifactKind, id: string): Promise<ArtifactRecord<T> | undefined> {
    const filePath = join(this.vaultRoot, kind, `${id}.json`);
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const record: ArtifactRecord<T> = JSON.parse(content);
      return record;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return undefined;
      }
      throw error;
    }
  }

  async list(kind: ArtifactKind, filter?: ArtifactFilter): Promise<ArtifactMeta[]> {
    const kindDir = join(this.vaultRoot, kind);
    
    try {
      const files = await fs.readdir(kindDir);
      const jsonFiles = files.filter(f => f.endsWith('.json') && !f.endsWith('.tmp'));
      
      const results: ArtifactMeta[] = [];
      
      for (const file of jsonFiles) {
        const id = file.replace('.json', '');
        const record = await this.get(kind, id);
        
        if (record) {
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
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async delete(kind: ArtifactKind, id: string): Promise<boolean> {
    const filePath = join(this.vaultRoot, kind, `${id}.json`);
    
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  async exists(kind: ArtifactKind, id: string): Promise<boolean> {
    const filePath = join(this.vaultRoot, kind, `${id}.json`);
    
    try {
      await fs.access(filePath);
      return true;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }
}
