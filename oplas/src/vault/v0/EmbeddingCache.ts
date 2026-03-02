/**
 * Embedding Cache
 * 
 * Caches repr embeddings by repr_id and embedder version.
 * 
 * Version: 1.0.0
 */

import { join } from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { CanonicalRepresentation } from '../../contracts/types/Repr';
import { embedRepr, quantizeEmbedding, dequantizeEmbedding, getEmbedderMetadata, Embedding } from './Embedder';
import { hashCanonical } from '../../contracts/invariants/CanonicalHashing';

/**
 * Cached embedding entry.
 */
interface CachedEmbedding {
  repr_id: string;
  embedder_version: string;
  weights_hash: string;
  embedding_quantized: number[];
  cache_hash: string;
}

/**
 * Gets cache key for repr embedding.
 */
function getCacheKey(repr_id: string, embedder_version: string, weights_hash: string): string {
  return `${repr_id}:${embedder_version}:${weights_hash}`;
}

/**
 * Gets cached embedding for repr.
 */
export async function getCachedEmbedding(
  repr: CanonicalRepresentation,
  vaultRoot: string
): Promise<Embedding | null> {
  const embedder = getEmbedderMetadata();
  const cacheKey = getCacheKey(repr.repr_id, embedder.version, embedder.weights_hash);
  const cachePath = join(vaultRoot, 'embeddings', 'cache', `${hashCanonical(cacheKey).slice(0, 16)}.json`);

  if (!existsSync(cachePath)) {
    return null;
  }

  try {
    const cachedJson = await readFile(cachePath, 'utf8');
    const cached: CachedEmbedding = JSON.parse(cachedJson);

    // Verify cache key matches
    if (
      cached.repr_id !== repr.repr_id ||
      cached.embedder_version !== embedder.version ||
      cached.weights_hash !== embedder.weights_hash
    ) {
      return null;
    }

    const quantized = new Int8Array(cached.embedding_quantized);
    return dequantizeEmbedding(quantized);
  } catch (error) {
    return null;
  }
}

/**
 * Caches embedding for repr.
 */
export async function cacheEmbedding(
  repr: CanonicalRepresentation,
  embedding: Embedding,
  vaultRoot: string
): Promise<void> {
  const embedder = getEmbedderMetadata();
  const cacheKey = getCacheKey(repr.repr_id, embedder.version, embedder.weights_hash);
  const cacheDir = join(vaultRoot, 'embeddings', 'cache');
  const cachePath = join(cacheDir, `${hashCanonical(cacheKey).slice(0, 16)}.json`);

  if (!existsSync(cacheDir)) {
    await mkdir(cacheDir, { recursive: true });
  }

  const quantized = quantizeEmbedding(embedding);
  const cached: CachedEmbedding = {
    repr_id: repr.repr_id,
    embedder_version: embedder.version,
    weights_hash: embedder.weights_hash,
    embedding_quantized: Array.from(quantized),
    cache_hash: hashCanonical(cacheKey)
  };

  await writeFile(cachePath, JSON.stringify(cached, null, 2), 'utf8');
}

/**
 * Gets or computes embedding for repr (with caching).
 */
export async function getOrComputeEmbedding(
  repr: CanonicalRepresentation,
  vaultRoot: string
): Promise<Embedding> {
  // Try cache first
  const cached = await getCachedEmbedding(repr, vaultRoot);
  if (cached) {
    return cached;
  }

  // Compute and cache
  const embedding = embedRepr(repr);
  await cacheEmbedding(repr, embedding, vaultRoot);
  return embedding;
}























