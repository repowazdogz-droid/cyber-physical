import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function parseCSV(content: string): string[][] {
  const lines = content.trim().split('\n');
  return lines.map(line => {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        if (inQuotes && j + 1 < line.length && line[j + 1] === '"') {
          current += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());
    return fields;
  });
}

function bootstrapRating(row: string[], headers: string[]): number {
  const getField = (name: string): string => {
    const idx = headers.indexOf(name);
    return idx >= 0 ? row[idx] : '';
  };

  let rating = 3; // base = 3

  const confidenceScore = parseFloat(getField('confidence_score')) || 0;
  const agreementFactor = parseFloat(getField('agreement_factor')) || 0;
  const unsupportedPenalty = parseFloat(getField('unsupported_penalty')) || 0;
  const orphanCountStr = getField('orphan_count');
  const orphanCount = orphanCountStr ? parseInt(orphanCountStr) : null;

  // +1 if confidence_score >= 0.22
  if (confidenceScore >= 0.22) rating += 1;

  // +1 if agreement_factor >= 0.45
  if (agreementFactor >= 0.45) rating += 1;

  // -1 if unsupported_penalty >= 0.35
  if (unsupportedPenalty >= 0.35) rating -= 1;

  // -1 if orphan_count exists and orphan_count >= 16
  if (orphanCount !== null && orphanCount >= 16) rating -= 1;

  // Clamp to [1,5]
  return Math.max(1, Math.min(5, rating));
}

async function main() {
  const inputPath = resolve(__dirname, 'weight-rating.csv');
  const outputPath = resolve(__dirname, 'weight-rating.bootstrapped.csv');

  const content = readFileSync(inputPath, 'utf-8');
  const rows = parseCSV(content);
  
  if (rows.length === 0) {
    console.error('ERROR: Empty CSV');
    process.exit(1);
  }

  const headers = rows[0];
  const ratingIdx = headers.indexOf('human_quality_rating');
  
  if (ratingIdx === -1) {
    console.error('ERROR: human_quality_rating column not found');
    process.exit(1);
  }

  const outputRows: string[] = [];
  outputRows.push(headers.join(','));

  const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (let i = 1; i < rows.length; i++) {
    const row = [...rows[i]];
    const rating = bootstrapRating(row, headers);
    row[ratingIdx] = rating.toString();
    outputRows.push(row.join(','));
    ratingCounts[rating]++;
  }

  writeFileSync(outputPath, outputRows.join('\n'));
  
  console.log('=== Bootstrap Ratings Generated ===');
  console.log(`Input: ${inputPath}`);
  console.log(`Output: ${outputPath}`);
  console.log(`Rows processed: ${rows.length - 1}`);
  console.log('');
  console.log('Rating distribution:');
  for (let r = 1; r <= 5; r++) {
    console.log(`  ${r}: ${ratingCounts[r]}`);
  }
  console.log('');
  console.log('NOTE: These are bootstrapped ratings for calibration testing.');
  console.log('      Replace with human ratings when available.');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
