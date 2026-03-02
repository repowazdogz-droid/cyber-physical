import { query } from '../db/client.js';
import { getEmbedding } from './client.js';
import { OLLAMA_EMBED_MODEL, EMBED_DIMENSIONS } from '../config.js';
import type { ExtractedClaim } from '../extraction/types.js';

/**
 * Parse Postgres float8[] array string format: '{0.1,0.2,...}' -> [0.1, 0.2, ...]
 */
function parsePgArray(pgArray: string | number[]): number[] {
  if (Array.isArray(pgArray)) {
    return pgArray;
  }
  // Remove braces and split by comma
  const cleaned = pgArray.slice(1, -1);
  return cleaned.split(',').map(Number);
}

/**
 * Format JavaScript array as Postgres float8[] array literal.
 */
function formatPgArray(arr: number[]): string {
  return `{${arr.join(',')}}`;
}

/**
 * Ensure embeddings exist for all scoring-eligible claims.
 * Returns a map of claim_id -> embedding vector.
 * Implements caching (DB lookup) and retry logic.
 */
export async function ensureEmbeddings(claims: ExtractedClaim[]): Promise<Map<string, number[]>> {
  const embeddingMap = new Map<string, number[]>();
  
  // Filter to only scoring-eligible claims upfront
  const scoringClaims = claims.filter((c) => c.scoring_eligible);
  
  // Early return if no scoring claims
  if (scoringClaims.length === 0) {
    return embeddingMap;
  }

  // 1. Batch load existing embeddings from DB
  const ids = scoringClaims.map((c) => c.id);
  const existing = await query(
    `SELECT claim_id, embedding FROM claim_embeddings WHERE claim_id = ANY($1)`,
    [ids]
  );
  for (const row of existing.rows) {
    const embedding = parsePgArray(row.embedding as string | number[]);
    embeddingMap.set(row.claim_id as string, embedding);
  }

  // 2. Compute missing embeddings sequentially
  for (const claim of scoringClaims) {
    if (embeddingMap.has(claim.id)) continue; // cache hit

    let embedding: number[];
    try {
      const response = await getEmbedding(claim.statement);
      embedding = response.embedding;
    } catch (err) {
      // One retry
      try {
        const response = await getEmbedding(claim.statement);
        embedding = response.embedding;
      } catch (retryErr) {
        // If embedding fails after retry, mark claim as non-scoring
        claim.scoring_eligible = false;
        claim.repairs.push(
          `embedding_failed: ${retryErr instanceof Error ? retryErr.message : 'unknown'}`
        );
        continue;
      }
    }

    // 3. Store in DB
    const pgArray = formatPgArray(embedding);
    await query(
      `INSERT INTO claim_embeddings (claim_id, embedding, model_id, dimensions, created_at)
       VALUES ($1, $2::float8[], $3, $4, NOW())
       ON CONFLICT (claim_id) DO NOTHING`,
      [claim.id, pgArray, OLLAMA_EMBED_MODEL, EMBED_DIMENSIONS]
    );

    embeddingMap.set(claim.id, embedding);
  }

  return embeddingMap;
}
