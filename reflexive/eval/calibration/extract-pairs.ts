import { pool } from '../../src/db/client.js';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ClaimRow {
  id: string;
  perspective_id: string;
  lens_id: string;
  lens_name: string;
  statement: string;
  about_entity: string;
  polarity: string;
  category: string;
  embedding: number[];
  analysis_id: string;
}

interface ClaimPair {
  pair_id: number;
  claim_a_id: string;
  claim_a_text: string;
  claim_a_entity: string;
  claim_a_polarity: string;
  claim_a_lens: string;
  claim_b_id: string;
  claim_b_text: string;
  claim_b_entity: string;
  claim_b_polarity: string;
  claim_b_lens: string;
  cosine_similarity: number;
  entity_match: boolean;
  same_analysis: boolean;
  label?: 'same' | 'different';
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function normalizeEntity(entity: string): string {
  return entity.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
  // Load all claims with embeddings from completed analyses
  const claimsResult = await pool.query(`
    SELECT
      c.id,
      c.perspective_id,
      c.content as statement,
      COALESCE(c.about_entity_canonical, c.about_entity_candidate, '') as about_entity,
      c.polarity,
      c.category,
      p.lens_id,
      l.name as lens_name,
      p.analysis_id,
      e.embedding
    FROM claims c
    JOIN perspectives p ON p.id = c.perspective_id
    JOIN lenses l ON l.id = p.lens_id
    JOIN analyses a ON a.id = p.analysis_id
    LEFT JOIN claim_embeddings e ON e.claim_id = c.id
    WHERE a.state = 'completed'
      AND c.scoring_eligible = true
      AND e.embedding IS NOT NULL
    ORDER BY p.analysis_id, p.lens_id
  `);

  const claims: ClaimRow[] = claimsResult.rows.map(row => {
    // Parse embedding - could be array or string
    let embedding: number[];
    if (Array.isArray(row.embedding)) {
      embedding = row.embedding;
    } else if (typeof row.embedding === 'string') {
      embedding = JSON.parse(row.embedding);
    } else {
      throw new Error(`Unexpected embedding type for claim ${row.id}`);
    }

    return {
      id: row.id,
      perspective_id: row.perspective_id,
      lens_id: row.lens_id,
      lens_name: row.lens_name,
      statement: row.statement,
      about_entity: row.about_entity || '',
      polarity: row.polarity || 'neutral',
      category: row.category,
      embedding,
      analysis_id: row.analysis_id,
    };
  });

  console.log(`Loaded ${claims.length} claims from completed analyses`);

  // Group claims by analysis
  const byAnalysis = new Map<string, ClaimRow[]>();
  for (const c of claims) {
    if (!byAnalysis.has(c.analysis_id)) byAnalysis.set(c.analysis_id, []);
    byAnalysis.get(c.analysis_id)!.push(c);
  }

  console.log(`Across ${byAnalysis.size} analyses`);

  // Generate cross-lens pairs within each analysis
  const allPairs: ClaimPair[] = [];
  let pairId = 0;

  for (const [analysisId, analysisClaims] of byAnalysis) {
    // Only pair claims from DIFFERENT lenses (cross-lens)
    for (let i = 0; i < analysisClaims.length; i++) {
      for (let j = i + 1; j < analysisClaims.length; j++) {
        const a = analysisClaims[i];
        const b = analysisClaims[j];

        // Skip same-lens pairs
        if (a.lens_id === b.lens_id) continue;

        // Hard gate check: entity must match (case-insensitive)
        const entityMatch = normalizeEntity(a.about_entity) === normalizeEntity(b.about_entity);

        // Only include pairs that pass the hard gate (entity match)
        // Plus a sample of non-matching pairs for contrast
        if (!entityMatch) {
          // Include 10% of non-matching pairs for calibration contrast
          if (Math.random() > 0.10) continue;
        }

        // Compute cosine similarity
        if (!a.embedding || !b.embedding) continue;
        const sim = cosineSimilarity(a.embedding, b.embedding);

        allPairs.push({
          pair_id: pairId++,
          claim_a_id: a.id,
          claim_a_text: a.statement,
          claim_a_entity: a.about_entity,
          claim_a_polarity: a.polarity,
          claim_a_lens: a.lens_name,
          claim_b_id: b.id,
          claim_b_text: b.statement,
          claim_b_entity: b.about_entity,
          claim_b_polarity: b.polarity,
          claim_b_lens: b.lens_name,
          cosine_similarity: Math.round(sim * 10000) / 10000,
          entity_match: entityMatch,
          same_analysis: true,
        });
      }
    }
  }

  console.log(`Generated ${allPairs.length} cross-lens pairs`);

  // Sort by similarity to get a spread, then shuffle for unbiased labeling
  // First, sample to get ~100 pairs with good distribution
  const targetPairs = 100;

  // Stratified sample: get pairs from different similarity bands
  const sorted = [...allPairs].sort((a, b) => a.cosine_similarity - b.cosine_similarity);

  let sampled: ClaimPair[];
  if (allPairs.length <= targetPairs) {
    sampled = allPairs;
  } else {
    // Take pairs from across the similarity spectrum
    const step = Math.floor(sorted.length / targetPairs);
    sampled = [];
    for (let i = 0; i < sorted.length && sampled.length < targetPairs; i += step) {
      sampled.push(sorted[i]);
    }
    // Fill remaining slots randomly
    const remaining = sorted.filter(p => !sampled.includes(p));
    while (sampled.length < targetPairs && remaining.length > 0) {
      const idx = Math.floor(Math.random() * remaining.length);
      sampled.push(remaining.splice(idx, 1)[0]);
    }
  }

  // Fisher-Yates shuffle for unbiased ordering
  for (let i = sampled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sampled[i], sampled[j]] = [sampled[j], sampled[i]];
  }

  // Re-number after shuffle
  sampled.forEach((p, i) => p.pair_id = i + 1);

  console.log(`Sampled ${sampled.length} pairs for labeling`);
  console.log(`Similarity range: [${Math.min(...sampled.map(p => p.cosine_similarity)).toFixed(4)}, ${Math.max(...sampled.map(p => p.cosine_similarity)).toFixed(4)}]`);

  // Save JSON
  const jsonPath = resolve(__dirname, 'similarity-labeling-dataset.json');
  writeFileSync(jsonPath, JSON.stringify(sampled, null, 2));
  console.log(`JSON saved: ${jsonPath}`);

  // Save CSV for human labeling
  const csvHeader = 'pair_id,claim_a,claim_b,similarity,entity_match,lens_a,lens_b,label';
  const csvRows = sampled.map(p =>
    `${p.pair_id},"${p.claim_a_text.replace(/"/g, '""')}","${p.claim_b_text.replace(/"/g, '""')}",${p.cosine_similarity},${p.entity_match},${p.claim_a_lens},${p.claim_b_lens},`
  );
  const csvPath = resolve(__dirname, 'similarity-labeling.csv');
  writeFileSync(csvPath, [csvHeader, ...csvRows].join('\n'));
  console.log(`CSV saved: ${csvPath}`);

  // Print distribution stats
  const sims = sampled.map(p => p.cosine_similarity);
  const bands = {
    'below_0.70': sims.filter(s => s < 0.70).length,
    '0.70-0.80': sims.filter(s => s >= 0.70 && s < 0.80).length,
    '0.80-0.85': sims.filter(s => s >= 0.80 && s < 0.85).length,
    '0.85-0.90': sims.filter(s => s >= 0.85 && s < 0.90).length,
    'above_0.90': sims.filter(s => s >= 0.90).length,
  };
  console.log('Similarity distribution:');
  for (const [band, count] of Object.entries(bands)) {
    console.log(`  ${band}: ${count} pairs`);
  }

  await pool.end();
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
