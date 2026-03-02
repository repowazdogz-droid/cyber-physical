/**
 * Vault v0 Index
 * 
 * Builds and maintains the concept vault index.
 * 
 * Version: 1.0.0
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { ConceptCard } from '../../contracts/types/ConceptCard';
import { signatureKeys } from './SignatureKeys';

/**
 * Index Entry: Maps a key to concept IDs.
 */
export interface IndexEntry {
  /** Key */
  key: string;
  /** Concept IDs (with version) */
  concept_ids: string[];
}

/**
 * Index: Maps keys to concept IDs.
 */
export interface Index {
  /** By key */
  by_key: Record<string, string[]>;
  /** By domain */
  by_domain: Record<string, string[]>;
}

/**
 * Builds index from concept cards.
 */
export function buildIndex(concepts: ConceptCard[]): Index {
  const by_key: Record<string, string[]> = {};
  const by_domain: Record<string, string[]> = {};

  for (const concept of concepts) {
    const conceptId = `${concept.id}@${concept.version}`;
    
    // Extract keys
    const keys = signatureKeys(concept);
    
    // Add to by_key index
    for (const key of keys) {
      if (!by_key[key]) {
        by_key[key] = [];
      }
      if (!by_key[key].includes(conceptId)) {
        by_key[key].push(conceptId);
      }
    }

    // Infer domain from compatibility (v0: assume grid_2d for now)
    const domain = 'grid_2d'; // TODO: Extract from concept.compatibility
    if (!by_domain[domain]) {
      by_domain[domain] = [];
    }
    if (!by_domain[domain].includes(conceptId)) {
      by_domain[domain].push(conceptId);
    }
  }

  return { by_key, by_domain };
}

/**
 * Writes index to disk.
 */
export async function writeIndex(index: Index, vaultRoot: string): Promise<void> {
  const indexDir = join(vaultRoot, 'index');
  const byDomainDir = join(indexDir, 'by_domain');
  const byKeyDir = join(indexDir, 'by_key');

  await fs.mkdir(byDomainDir, { recursive: true });
  await fs.mkdir(byKeyDir, { recursive: true });

  // Write by_domain
  for (const [domain, conceptIds] of Object.entries(index.by_domain)) {
    await fs.writeFile(
      join(byDomainDir, `${domain}.json`),
      JSON.stringify(conceptIds, null, 2),
      'utf8'
    );
  }

  // Write by_key
  for (const [key, conceptIds] of Object.entries(index.by_key)) {
    const keyDir = join(byKeyDir, key);
    await fs.mkdir(keyDir, { recursive: true });
    
    // Write one file per concept ID
    for (const conceptId of conceptIds) {
      await fs.writeFile(
        join(keyDir, `${conceptId}.json`),
        JSON.stringify({ concept_id: conceptId }, null, 2),
        'utf8'
      );
    }
  }
}

/**
 * Reads index from disk.
 */
export async function readIndex(vaultRoot: string): Promise<Index> {
  const indexDir = join(vaultRoot, 'index');
  const byDomainDir = join(indexDir, 'by_domain');
  const byKeyDir = join(indexDir, 'by_key');

  const by_domain: Record<string, string[]> = {};
  const by_key: Record<string, string[]> = {};

  try {
    // Read by_domain
    const domainFiles = await fs.readdir(byDomainDir);
    for (const file of domainFiles) {
      if (file.endsWith('.json')) {
        const domain = file.replace('.json', '');
        const content = await fs.readFile(join(byDomainDir, file), 'utf8');
        by_domain[domain] = JSON.parse(content);
      }
    }

    // Read by_key
    const keyDirs = await fs.readdir(byKeyDir);
    for (const key of keyDirs) {
      const keyDir = join(keyDir, key);
      const files = await fs.readdir(keyDir);
      const conceptIds: string[] = [];
      for (const file of files) {
        if (file.endsWith('.json')) {
          const conceptId = file.replace('.json', '');
          conceptIds.push(conceptId);
        }
      }
      by_key[key] = conceptIds;
      by_key[key] = conceptIds;
    }
  } catch (error) {
    // Index doesn't exist yet
    return { by_key: {}, by_domain: {} };
  }

  return { by_key, by_domain };
}
