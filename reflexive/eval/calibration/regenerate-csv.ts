import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataPath = resolve(__dirname, 'similarity-labeling-dataset.json');
const csvPath = resolve(__dirname, 'similarity-labeling.csv');

const pairs = JSON.parse(readFileSync(dataPath, 'utf-8'));

// Sort by cosine_similarity DESC (obvious matches first)
pairs.sort((a: any, b: any) => b.cosine_similarity - a.cosine_similarity);

// CSV header — exact schema
const header = 'claim_a_id,claim_a_text,claim_b_id,claim_b_text,cosine_similarity,label';

const rows = pairs.map((p: any) => {
  // Escape quotes in claim text
  const aText = `"${(p.claim_a_text || '').replace(/"/g, '""')}"`;
  const bText = `"${(p.claim_b_text || '').replace(/"/g, '""')}"`;
  return `${p.claim_a_id},${aText},${p.claim_b_id},${bText},${p.cosine_similarity},`;
});

writeFileSync(csvPath, [header, ...rows].join('\n'));
console.log(`CSV written: ${csvPath}`);
console.log(`Total pairs: ${pairs.length}`);
console.log(`Similarity range: [${pairs[pairs.length-1].cosine_similarity}, ${pairs[0].cosine_similarity}]`);
console.log(`Sorted: DESC by cosine_similarity`);
console.log('Label column: EMPTY (ready for human labeling)');
