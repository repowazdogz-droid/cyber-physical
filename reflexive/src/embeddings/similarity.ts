/**
 * Cosine similarity between two L2-normalized vectors.
 * Since nomic-embed-text returns normalized vectors, this is just the dot product.
 * Pure function. No side effects. Deterministic.
 */
export function cosineSim(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}
