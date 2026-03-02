import { pool } from '../../src/db/client.js';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  // Query all completed analyses with their synthesis data
  const result = await pool.query(`
    SELECT
      s.analysis_id,
      a.case_id,
      c.stimulus_type,
      s.confidence_score,
      s.confidence_breakdown,
      s.convergence_points,
      s.divergence_points,
      s.orphan_claims,
      s.created_at
    FROM syntheses s
    JOIN analyses a ON a.id = s.analysis_id
    JOIN cases c ON c.id = a.case_id
    WHERE a.state = 'completed'
    ORDER BY s.created_at ASC
  `);

  console.log(`Found ${result.rows.length} completed analyses`);

  const rows: string[] = [];
  const header = 'analysis_id,stimulus_id,created_at,confidence_score,agreement_factor,evidence_density_factor,unsupported_penalty,divergence_penalty,lens_count_factor,convergence_count,divergence_count,orphan_count,human_quality_rating';
  rows.push(header);

  for (const row of result.rows) {
    const breakdown = typeof row.confidence_breakdown === 'string'
      ? JSON.parse(row.confidence_breakdown)
      : row.confidence_breakdown;
    const convergence = typeof row.convergence_points === 'string'
      ? JSON.parse(row.convergence_points)
      : (row.convergence_points || []);
    const divergence = typeof row.divergence_points === 'string'
      ? JSON.parse(row.divergence_points)
      : (row.divergence_points || []);
    const orphans = typeof row.orphan_claims === 'string'
      ? JSON.parse(row.orphan_claims)
      : (row.orphan_claims || []);

    // Determine stimulus_id from case context if available
    const stimId = row.stimulus_type || 'unknown';

    const csvRow = [
      row.analysis_id,
      stimId,
      row.created_at?.toISOString?.() || row.created_at || '',
      row.confidence_score?.toFixed(4) || '0',
      breakdown?.agreement_factor?.toFixed(4) || '0',
      breakdown?.evidence_density_factor?.toFixed(4) || '0',
      breakdown?.unsupported_penalty?.toFixed(4) || '0',
      breakdown?.divergence_penalty?.toFixed(4) || '0',
      breakdown?.lens_count_factor?.toFixed(4) || '1',
      Array.isArray(convergence) ? convergence.length : 0,
      Array.isArray(divergence) ? divergence.length : 0,
      Array.isArray(orphans) ? orphans.length : 0,
      '' // human_quality_rating — blank for human to fill
    ].join(',');

    rows.push(csvRow);
  }

  const csvPath = resolve(__dirname, 'weight-rating.csv');
  writeFileSync(csvPath, rows.join('\n'));
  console.log(`CSV written: ${csvPath}`);
  console.log(`Rows: ${result.rows.length}`);
  console.log('');
  console.log('Component value ranges:');
  
  const scores = result.rows.map(r => r.confidence_score).filter(Boolean);
  if (scores.length > 0) {
    console.log(`  confidence: [${Math.min(...scores).toFixed(4)}, ${Math.max(...scores).toFixed(4)}]`);
  }

  // Also try to get stimulus text snippets for context during rating
  const contextResult = await pool.query(`
    SELECT
      s.analysis_id,
      c.stimulus_text
    FROM syntheses s
    JOIN analyses a ON a.id = s.analysis_id
    JOIN cases c ON c.id = a.case_id
    WHERE a.state = 'completed'
    ORDER BY s.created_at ASC
  `);

  // Write a companion context file for the human rater
  const contextRows: string[] = ['analysis_id,stimulus_snippet'];
  for (const row of contextResult.rows) {
    const snippet = (row.stimulus_text || '').substring(0, 120).replace(/"/g, '""').replace(/\n/g, ' ');
    contextRows.push(`${row.analysis_id},"${snippet}"`);
  }
  const contextPath = resolve(__dirname, 'weight-rating-context.csv');
  writeFileSync(contextPath, contextRows.join('\n'));
  console.log(`Context file written: ${contextPath}`);

  await pool.end();
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
