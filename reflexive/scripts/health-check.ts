import { query } from '../src/db/client.js';
import { OLLAMA_BASE_URL, OLLAMA_EMBED_MODEL, EMBED_DIMENSIONS } from '../src/config.js';

async function checkPostgres(): Promise<void> {
  try {
    await query('SELECT 1');
    console.log('✓ Postgres connected');
  } catch (error) {
    console.error('✗ Postgres connection failed:', error);
    throw error;
  }
}

async function checkOllama(): Promise<void> {
  try {
    // Check if model is available
    const tagsResponse = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!tagsResponse.ok) {
      throw new Error(`Ollama API returned ${tagsResponse.status}`);
    }

    const tagsData = await tagsResponse.json();
    const models = tagsData.models || [];
    const modelNames = models.map((m: { name: string }) => m.name);

    if (modelNames.includes(OLLAMA_EMBED_MODEL)) {
      console.log(`✓ ${OLLAMA_EMBED_MODEL} available`);
    } else {
      console.log(`⊘ ${OLLAMA_EMBED_MODEL} not found, pulling...`);
      await pullModel();
      console.log(`✓ ${OLLAMA_EMBED_MODEL} pulled`);
    }

    // Test embedding
    const embedResponse = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_EMBED_MODEL,
        prompt: 'test',
      }),
    });

    if (!embedResponse.ok) {
      throw new Error(`Embedding API returned ${embedResponse.status}`);
    }

    const embedData = await embedResponse.json();
    const embedding = embedData.embedding || [];

    if (embedding.length !== EMBED_DIMENSIONS) {
      throw new Error(
        `Expected embedding dimension ${EMBED_DIMENSIONS}, got ${embedding.length}`
      );
    }

    console.log(`✓ Embedding test passed (${EMBED_DIMENSIONS} dimensions)`);
  } catch (error) {
    console.error('✗ Ollama check failed:', error);
    throw error;
  }
}

async function pullModel(): Promise<void> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: OLLAMA_EMBED_MODEL }),
  });

  if (!response.ok) {
    throw new Error(`Model pull failed: ${response.status}`);
  }

  // Read streaming response until done
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  while (true) {
    const { done } = await reader.read();
    if (done) break;
  }
}

async function main(): Promise<void> {
  try {
    await checkPostgres();
    await checkOllama();
    console.log('\n✓ All health checks passed');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Health check failed');
    process.exit(1);
  }
}

main();
