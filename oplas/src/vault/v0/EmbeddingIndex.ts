/**
 * Embedding Index
 * 
 * Storage and retrieval of concept embeddings.
 * 
 * Version: 1.0.0
 */

import { join } from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { ConceptCard } from '../../contracts/types/ConceptCard';
import { embedConcept, quantizeEmbedding, dequantizeEmbedding, getEmbedderMetadata, Embedding, cosineSimilarity } from './Embedder';
import { hashCanonical } from '../../contracts/invariants/CanonicalHashing';

/**
 * Concept vector entry.
 */
export interface ConceptVector {
  /** Concept ID@version */
  concept_id: string;
  /** Quantized embedding */
  embedding_quantized: number[]; // Int8 array as JSON
}

/**
 * Embedding index structure.
 */
export interface EmbeddingIndex {
  /** Embedder metadata */
  embedder: {
    version: string;
    weights_hash: string;
    dimension: number;
  };
  /** Concept vectors */
  concept_vectors: Record<string, ConceptVector>;
  /** Index hash */
  index_hash: string;
}

/**
 * Builds embedding index from concept cards.
 */
export async function buildEmbeddingIndex(
  concepts: ConceptCard[],
  vaultRoot: string
): Promise<EmbeddingIndex> {
  const embedder = getEmbedderMetadata();
  const conceptVectors: Record<string, ConceptVector> = {};

  for (const concept of concepts) {
    const conceptId = `${concept.id}@${concept.version}`;
    const embedding = embedConcept(concept);
    const quantized = quantizeEmbedding(embedding);
    
    conceptVectors[conceptId] = {
      concept_id: conceptId,
      embedding_quantized: Array.from(quantized)
    };
  }

  // Compute index hash
  const indexJson = JSON.stringify({
    embedder,
    concept_vectors: conceptVectors
  });
  const indexHash = hashCanonical(indexJson);

  const index: EmbeddingIndex = {
    embedder,
    concept_vectors: conceptVectors,
    index_hash: indexHash
  };

  // Write index
  await writeEmbeddingIndex(index, vaultRoot);

  return index;
}

/**
 * Writes embedding index to disk.
 */
export async function writeEmbeddingIndex(
  index: EmbeddingIndex,
  vaultRoot: string
): Promise<void> {
  const embeddingsDir = join(vaultRoot, 'embeddings');
  if (!existsSync(embeddingsDir)) {
    await mkdir(embeddingsDir, { recursive: true });
  }

  // Write embedder metadata
  const embedderPath = join(embeddingsDir, 'embedder.json');
  await writeFile(embedderPath, JSON.stringify(index.embedder, null, 2), 'utf8');

  // Write concept vectors (JSONL format)
  const vectorsPath = join(embeddingsDir, 'concept_vectors.jsonl');
  const lines: string[] = [];
  for (const [conceptId, vector] of Object.entries(index.concept_vectors)) {
    lines.push(JSON.stringify({ concept_id: conceptId, ...vector }));
  }
  await writeFile(vectorsPath, lines.join('\n'), 'utf8');

  // Write index hash
  const hashPath = join(embeddingsDir, 'ann.index.sha256');
  await writeFile(hashPath, index.index_hash, 'utf8');
}

/**
 * Reads embedding index from disk.
 */
export async function readEmbeddingIndex(vaultRoot: string): Promise<EmbeddingIndex | null> {
  const embeddingsDir = join(vaultRoot, 'embeddings');
  const embedderPath = join(embeddingsDir, 'embedder.json');
  const vectorsPath = join(embeddingsDir, 'concept_vectors.jsonl');
  const hashPath = join(embeddingsDir, 'ann.index.sha256');

  if (!existsSync(embedderPath) || !existsSync(vectorsPath)) {
    return null;
  }

  // Read embedder metadata
  const embedderJson = await readFile(embedderPath, 'utf8');
  const embedder = JSON.parse(embedderJson);

  // Read concept vectors
  const vectorsJsonl = await readFile(vectorsPath, 'utf8');
  const conceptVectors: Record<string, ConceptVector> = {};
  for (const line of vectorsJsonl.trim().split('\n')) {
    if (line.trim()) {
      const entry = JSON.parse(line);
      conceptVectors[entry.concept_id] = entry;
    }
  }

  // Read index hash
  const indexHash = existsSync(hashPath)
    ? await readFile(hashPath, 'utf8').then(s => s.trim())
    : '';

  return {
    embedder,
    concept_vectors: conceptVectors,
    index_hash: indexHash
  };
}

/**
 * Gets embedding for a concept.
 */
export function getConceptEmbedding(
  index: EmbeddingIndex,
  conceptId: string
): Embedding | null {
  const vector = index.concept_vectors[conceptId];
  if (!vector) {
    return null;
  }

  const quantized = new Int8Array(vector.embedding_quantized);
  return dequantizeEmbedding(quantized);
}

/**
 * Computes similarity scores for concepts.
 * Returns sorted list of (conceptId, similarity) pairs.
 */
export function computeSimilarities(
  queryEmbedding: Embedding,
  index: EmbeddingIndex,
  conceptIds: string[]
): Array<{ concept_id: string; similarity: number }> {
  const scores: Array<{ concept_id: string; similarity: number }> = [];

  for (const conceptId of conceptIds) {
    const conceptEmbedding = getConceptEmbedding(index, conceptId);
    if (conceptEmbedding) {
      const similarity = cosineSimilarity(queryEmbedding, conceptEmbedding);
      scores.push({ concept_id: conceptId, similarity });
    }
  }

  // Sort by similarity descending
  scores.sort((a, b) => b.similarity - a.similarity);

  return scores;
}

