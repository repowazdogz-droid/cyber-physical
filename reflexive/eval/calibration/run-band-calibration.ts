import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ENGINE_CONFIG } from '../../src/config.js';
import { analyzeDistribution } from './distribution-analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',');
    const row: Record<string, string> = {};
    headers.forEach((h, j) => row[h.trim()] = (vals[j] || '').trim());
    rows.push(row);
  }
  return rows;
}

interface Analysis {
  agreement_factor: number;
  evidence_density_factor: number;
  unsupported_penalty: number;
  divergence_penalty: number;
  lens_count_factor: number;
}

function computeScore(a: Analysis, W_a: number, W_e: number, W_u: number, W_d: number): number {
  const raw = (W_a * a.agreement_factor + W_e * a.evidence_density_factor
    - W_u * a.unsupported_penalty - W_d * a.divergence_penalty) * a.lens_count_factor;
  return Math.max(0, Math.min(1, raw));
}

async function main() {
  // Load rating CSV (use bootstrapped if human not available)
  const humanPath = resolve(__dirname, 'weight-rating.csv');
  const bootstrappedPath = resolve(__dirname, 'weight-rating.bootstrapped.csv');
  
  let csvPath: string;
  try {
    const humanContent = readFileSync(humanPath, 'utf-8');
    const humanRows = parseCSV(humanContent);
    const hasRatings = humanRows.length > 1 && humanRows.slice(1).some(row => {
      const rating = parseInt(row.human_quality_rating || '');
      return !isNaN(rating) && rating >= 1 && rating <= 5;
    });
    csvPath = hasRatings ? humanPath : bootstrappedPath;
  } catch {
    csvPath = bootstrappedPath;
  }
  
  const csvContent = readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvContent);

  console.log('=== REFLEXIVE Band Boundary Calibration ===');
  console.log(`Loaded ${rows.length} analyses`);

  // Get current weights from config
  const W_a = ENGINE_CONFIG.W_a;
  const W_e = ENGINE_CONFIG.W_e;
  const W_u = ENGINE_CONFIG.W_u;
  const W_d = ENGINE_CONFIG.W_d;

  // Recompute scores with current weights
  const analyses: Analysis[] = [];
  for (const row of rows) {
    analyses.push({
      agreement_factor: parseFloat(row.agreement_factor) || 0,
      evidence_density_factor: parseFloat(row.evidence_density_factor) || 0,
      unsupported_penalty: parseFloat(row.unsupported_penalty) || 0,
      divergence_penalty: parseFloat(row.divergence_penalty) || 0,
      lens_count_factor: parseFloat(row.lens_count_factor) || 1,
    });
  }

  const scores = analyses.map(a => computeScore(a, W_a, W_e, W_u, W_d));

  // Analyze distribution
  const currentBoundaries: [number, number, number] = [
    ENGINE_CONFIG.BAND_LOW_MAX,
    ENGINE_CONFIG.BAND_MODERATE_MAX,
    ENGINE_CONFIG.BAND_HIGH_MAX,
  ];

  const analysis = analyzeDistribution({
    scores,
    band_boundaries: currentBoundaries,
  });

  console.log('');
  console.log('Current boundaries:');
  console.log(`  BAND_LOW_MAX: ${currentBoundaries[0]}`);
  console.log(`  BAND_MODERATE_MAX: ${currentBoundaries[1]}`);
  console.log(`  BAND_HIGH_MAX: ${currentBoundaries[2]}`);
  console.log('');
  console.log('Distribution analysis:');
  console.log(`  Range: [${analysis.min.toFixed(4)}, ${analysis.max.toFixed(4)}]`);
  console.log(`  Mean: ${analysis.mean.toFixed(4)}, Std: ${analysis.std.toFixed(4)}`);
  console.log(`  Band counts: Low=${analysis.band_counts.low} Moderate=${analysis.band_counts.moderate} High=${analysis.band_counts.high} VeryHigh=${analysis.band_counts.very_high}`);
  console.log(`  Recommendation: ${analysis.recommendation}`);
  console.log(`  Details: ${analysis.details}`);
  console.log('');

  // Propose percentile-based boundaries
  const sortedScores = [...scores].sort((a, b) => a - b);
  const p20 = sortedScores[Math.floor(sortedScores.length * 0.2)];
  const p50 = sortedScores[Math.floor(sortedScores.length * 0.5)];
  const p80 = sortedScores[Math.floor(sortedScores.length * 0.8)];

  const proposed = {
    BAND_LOW_MAX: Math.round(p20 * 100) / 100,
    BAND_MODERATE_MAX: Math.round(p50 * 100) / 100,
    BAND_HIGH_MAX: Math.round(p80 * 100) / 100,
  };

  console.log('=== PROPOSED BOUNDARIES (percentile-based) ===');
  console.log(`  BAND_LOW_MAX: ${proposed.BAND_LOW_MAX} (20th percentile)`);
  console.log(`  BAND_MODERATE_MAX: ${proposed.BAND_MODERATE_MAX} (50th percentile)`);
  console.log(`  BAND_HIGH_MAX: ${proposed.BAND_HIGH_MAX} (80th percentile)`);
  console.log('');

  // Test proposed boundaries
  const proposedBoundaries: [number, number, number] = [
    proposed.BAND_LOW_MAX,
    proposed.BAND_MODERATE_MAX,
    proposed.BAND_HIGH_MAX,
  ];
  const proposedAnalysis = analyzeDistribution({
    scores,
    band_boundaries: proposedBoundaries,
  });

  console.log('Proposed boundaries analysis:');
  console.log(`  Band counts: Low=${proposedAnalysis.band_counts.low} Moderate=${proposedAnalysis.band_counts.moderate} High=${proposedAnalysis.band_counts.high} VeryHigh=${proposedAnalysis.band_counts.very_high}`);
  console.log(`  Band entropy: ${proposedAnalysis.band_entropy.toFixed(4)} (higher = better discrimination)`);
  console.log('');

  // Save recommendation
  const recommendation = {
    created_at: new Date().toISOString(),
    current_boundaries: {
      BAND_LOW_MAX: currentBoundaries[0],
      BAND_MODERATE_MAX: currentBoundaries[1],
      BAND_HIGH_MAX: currentBoundaries[2],
    },
    proposed_boundaries: proposed,
    current_analysis: analysis,
    proposed_analysis: proposedAnalysis,
    improvement: {
      band_entropy_delta: proposedAnalysis.band_entropy - analysis.band_entropy,
      band_count_delta: (proposedAnalysis.band_counts.low + proposedAnalysis.band_counts.moderate + proposedAnalysis.band_counts.high + proposedAnalysis.band_counts.very_high) - 
                       (analysis.band_counts.low + analysis.band_counts.moderate + analysis.band_counts.high + analysis.band_counts.very_high),
    },
    apply_recommendation: proposedAnalysis.band_entropy > analysis.band_entropy && 
                         (proposedAnalysis.band_counts.low + proposedAnalysis.band_counts.moderate + proposedAnalysis.band_counts.high + proposedAnalysis.band_counts.very_high) >= 2,
  };

  const outputPath = resolve(__dirname, 'band-calibration-output.json');
  writeFileSync(outputPath, JSON.stringify(recommendation, null, 2));
  console.log(`Output saved: ${outputPath}`);

  console.log('');
  console.log('=== VERDICT ===');
  if (recommendation.apply_recommendation) {
    console.log('RECOMMENDED: Apply proposed boundaries to improve band discrimination.');
    console.log(`Update src/config.ts:`);
    console.log(`  BAND_LOW_MAX: ${proposed.BAND_LOW_MAX}`);
    console.log(`  BAND_MODERATE_MAX: ${proposed.BAND_MODERATE_MAX}`);
    console.log(`  BAND_HIGH_MAX: ${proposed.BAND_HIGH_MAX}`);
  } else {
    console.log('NOT RECOMMENDED: Current boundaries are acceptable or proposed boundaries do not improve discrimination.');
  }
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
