import { OLLAMA_BASE_URL, OLLAMA_EMBED_MODEL, EMBED_DIMENSIONS } from '../config.js';

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
}

/**
 * Get embedding for text from Ollama API.
 * Implements 10s timeout and basic error handling.
 */
export async function getEmbedding(text: string): Promise<EmbeddingResponse> {
  const url = `${OLLAMA_BASE_URL}/api/embeddings`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_EMBED_MODEL,
        prompt: text,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as { embedding: number[] };

    if (!Array.isArray(data.embedding)) {
      throw new Error('Ollama response missing embedding array');
    }

    if (data.embedding.length !== EMBED_DIMENSIONS) {
      throw new Error(
        `Embedding dimension mismatch: expected ${EMBED_DIMENSIONS}, got ${data.embedding.length}`
      );
    }

    return {
      embedding: data.embedding,
      model: OLLAMA_EMBED_MODEL,
    };
  } finally {
    clearTimeout(timeout);
  }
}
