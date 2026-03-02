import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ENGINE_CONFIG } from '../../src/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Spearman rank correlation ---
function ranks(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);
  const r = new Array(values.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j < indexed.length && indexed[j].v === indexed[i].v) j++;
    const avgRank = (i + j - 1) / 2 + 1; // 1-based average rank for ties
    for (let k = i; k < j; k++) r[indexed[k].i] = avgRank;
    i = j;
  }
  return r;
}

function pearson(a: number[], b: number[]): number {
  const n = a.length;
  if (n < 3) return 0;
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;
  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  return den === 0 ? 0 : num / den;
}

function spearman(a: number[], b: number[]): number {
  return pearson(ranks(a), ranks(b));
}

// --- CSV parser ---
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

// --- Band assignment ---
function getBand(score: number): string {
  if (score < ENGINE_CONFIG.BAND_LOW_MAX) return 'Low';
  if (score < ENGINE_CONFIG.BAND_MODERATE_MAX) return 'Moderate';
  if (score < ENGINE_CONFIG.BAND_HIGH_MAX) return 'High';
  return 'Very High';
}

interface Analysis {
  analysis_id: string;
  agreement_factor: number;
  evidence_density_factor: number;
  unsupported_penalty: number;
  divergence_penalty: number;
  lens_count_factor: number;
  human_quality_rating: number;
}

function computeScore(a: Analysis, W_a: number, W_e: number, W_u: number, W_d: number): number {
  const raw = (W_a * a.agreement_factor + W_e * a.evidence_density_factor
    - W_u * a.unsupported_penalty - W_d * a.divergence_penalty) * a.lens_count_factor;
  return Math.max(0, Math.min(1, raw));
}

async function main() {
  // Determine rating source: prefer human, fallback to bootstrapped
  const humanPath = resolve(__dirname, 'weight-rating.csv');
  const bootstrappedPath = resolve(__dirname, 'weight-rating.bootstrapped.csv');
  
  let csvPath: string;
  let ratingsSource: 'HUMAN' | 'BOOTSTRAPPED';
  
  // Check if human ratings are filled
  const humanContent = readFileSync(humanPath, 'utf-8');
  const humanRows = parseCSV(humanContent);
  const hasHumanRatings = humanRows.length > 1 && humanRows.slice(1).some(row => {
    const rating = parseInt(row.human_quality_rating || '');
    return !isNaN(rating) && rating >= 1 && rating <= 5;
  });
  
  if (hasHumanRatings) {
    csvPath = humanPath;
    ratingsSource = 'HUMAN';
  } else {
    // Check if bootstrapped exists
    try {
      readFileSync(bootstrappedPath, 'utf-8');
      csvPath = bootstrappedPath;
      ratingsSource = 'BOOTSTRAPPED';
    } catch {
      console.error('ERROR: No ratings found. Run npm run eval:bootstrap-ratings first.');
      process.exit(1);
    }
  }
  
  const csvContent = readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(csvContent);

  console.log('=== REFLEXIVE Weight Calibration ===');
  console.log(`RATINGS_SOURCE=${ratingsSource}`);
  console.log(`Loaded ${rows.length} analyses`);

  // Validate
  if (rows.length < 10) {
    console.error(`ERROR: Need at least 10 analyses, got ${rows.length}`);
    process.exit(1);
  }

  const analyses: Analysis[] = [];
  for (const row of rows) {
    const rating = parseInt(row.human_quality_rating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      console.error(`ERROR: Invalid human_quality_rating for ${row.analysis_id}: "${row.human_quality_rating}"`);
      console.error('All rows must have integer ratings 1-5.');
      process.exit(1);
    }
    analyses.push({
      analysis_id: row.analysis_id,
      agreement_factor: parseFloat(row.agreement_factor) || 0,
      evidence_density_factor: parseFloat(row.evidence_density_factor) || 0,
      unsupported_penalty: parseFloat(row.unsupported_penalty) || 0,
      divergence_penalty: parseFloat(row.divergence_penalty) || 0,
      lens_count_factor: parseFloat(row.lens_count_factor) || 1,
      human_quality_rating: rating,
    });
  }

  console.log(`Validated: ${analyses.length} analyses with ratings`);
  console.log(`Rating distribution: ${[1,2,3,4,5].map(r => `${r}:${analyses.filter(a => a.human_quality_rating === r).length}`).join(' ')}`);
  console.log('');

  // Current weights
  const curW = { W_a: ENGINE_CONFIG.W_a, W_e: ENGINE_CONFIG.W_e, W_u: ENGINE_CONFIG.W_u, W_d: ENGINE_CONFIG.W_d };
  console.log(`Current weights: W_a=${curW.W_a} W_e=${curW.W_e} W_u=${curW.W_u} W_d=${curW.W_d}`);

  // Current scores and correlation
  const curScores = analyses.map(a => computeScore(a, curW.W_a, curW.W_e, curW.W_u, curW.W_d));
  const humanRatings = analyses.map(a => a.human_quality_rating);
  const curCorrelation = spearman(curScores, humanRatings);
  console.log(`Current Spearman correlation: ${curCorrelation.toFixed(4)}`);
  console.log('');

  // Train/test split: sort by analysis_id, first 70% = train
  const sorted = [...analyses].sort((a, b) => a.analysis_id.localeCompare(b.analysis_id));
  const splitIdx = Math.ceil(sorted.length * 0.7);
  const train = sorted.slice(0, splitIdx);
  const test = sorted.slice(splitIdx);
  console.log(`Train set: ${train.length} analyses`);
  console.log(`Test set: ${test.length} analyses`);
  console.log('');

  // Grid search
  const gridW_a = [0.35, 0.40, 0.45, 0.50, 0.55];
  const gridW_e = [0.20, 0.25, 0.30, 0.35];
  const gridW_u = [0.10, 0.15, 0.20];
  const gridW_d = [0.10, 0.15, 0.20];
  const PENALTY_FLOOR = 0.25;

  interface Combo {
    W_a: number; W_e: number; W_u: number; W_d: number;
    trainCorr: number; testCorr: number;
  }

  const combos: Combo[] = [];

  for (const W_a of gridW_a) {
    for (const W_e of gridW_e) {
      for (const W_u of gridW_u) {
        for (const W_d of gridW_d) {
          const sum = W_a + W_e + W_u + W_d;
          if (Math.abs(sum - 1.0) > 0.001) continue;
          if (W_u + W_d < PENALTY_FLOOR) continue;

          const trainScores = train.map(a => computeScore(a, W_a, W_e, W_u, W_d));
          const trainRatings = train.map(a => a.human_quality_rating);
          const trainCorr = spearman(trainScores, trainRatings);

          const testScores = test.map(a => computeScore(a, W_a, W_e, W_u, W_d));
          const testRatings = test.map(a => a.human_quality_rating);
          const testCorr = spearman(testScores, testRatings);

          combos.push({ W_a, W_e, W_u, W_d, trainCorr, testCorr });
        }
      }
    }
  }

  console.log(`Valid weight combinations tested: ${combos.length}`);

  // Sort by train correlation descending
  combos.sort((a, b) => b.trainCorr - a.trainCorr);

  // Best
  const best = combos[0];
  const overfit = best.testCorr < best.trainCorr - 0.15;

  console.log('');
  console.log('=== RECOMMENDED WEIGHTS ===');
  console.log(`W_a=${best.W_a} W_e=${best.W_e} W_u=${best.W_u} W_d=${best.W_d}`);
  console.log(`Train Spearman: ${best.trainCorr.toFixed(4)}`);
  console.log(`Test Spearman:  ${best.testCorr.toFixed(4)}`);
  console.log(`OVERFIT: ${overfit ? 'YES ⚠️' : 'NO ✓'}`);
  console.log('');

  // Score distributions
  const recScores = analyses.map(a => computeScore(a, best.W_a, best.W_e, best.W_u, best.W_d));
  
  function stats(arr: number[]) {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const std = Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length);
    return { min: Math.min(...arr), max: Math.max(...arr), mean, std };
  }

  const curStats = stats(curScores);
  const recStats = stats(recScores);

  console.log('Score distributions:');
  console.log(`  Current:     min=${curStats.min.toFixed(4)} max=${curStats.max.toFixed(4)} mean=${curStats.mean.toFixed(4)} std=${curStats.std.toFixed(4)}`);
  console.log(`  Recommended: min=${recStats.min.toFixed(4)} max=${recStats.max.toFixed(4)} mean=${recStats.mean.toFixed(4)} std=${recStats.std.toFixed(4)}`);
  console.log('');

  // Band coverage
  const curBands = new Set(curScores.map(s => getBand(s)));
  const recBands = new Set(recScores.map(s => getBand(s)));
  console.log(`Band coverage: current=${curBands.size} recommended=${recBands.size}`);
  console.log(`  Current bands:     ${[...curBands].join(', ')}`);
  console.log(`  Recommended bands: ${[...recBands].join(', ')}`);
  console.log('');

  // Top 5 combinations
  console.log('Top 5 weight combinations by train correlation:');
  for (const c of combos.slice(0, 5)) {
    console.log(`  W_a=${c.W_a} W_e=${c.W_e} W_u=${c.W_u} W_d=${c.W_d} | train=${c.trainCorr.toFixed(4)} test=${c.testCorr.toFixed(4)}${c.testCorr < c.trainCorr - 0.15 ? ' OVERFIT' : ''}`);
  }
  console.log('');

  // Current vs recommended correlation on full set
  const fullCurCorr = spearman(curScores, humanRatings);
  const fullRecCorr = spearman(recScores, humanRatings);
  console.log(`Full-set Spearman: current=${fullCurCorr.toFixed(4)} recommended=${fullRecCorr.toFixed(4)}`);

  // Per-analysis comparison
  console.log('');
  console.log('Per-analysis scores:');
  console.log('analysis_id | human | cur_score | rec_score | cur_band | rec_band');
  for (let i = 0; i < analyses.length; i++) {
    const a = analyses[i];
    console.log(`  ${a.analysis_id.substring(0, 8)} | ${a.human_quality_rating} | ${curScores[i].toFixed(4)} | ${recScores[i].toFixed(4)} | ${getBand(curScores[i])} | ${getBand(recScores[i])}`);
  }

  // Save output
  const output = {
    created_at: new Date().toISOString(),
    analyses_count: analyses.length,
    train_count: train.length,
    test_count: test.length,
    current_weights: curW,
    recommended_weights: { W_a: best.W_a, W_e: best.W_e, W_u: best.W_u, W_d: best.W_d },
    current_correlation: { full: fullCurCorr, train: spearman(train.map(a => computeScore(a, curW.W_a, curW.W_e, curW.W_u, curW.W_d)), train.map(a => a.human_quality_rating)), test: spearman(test.map(a => computeScore(a, curW.W_a, curW.W_e, curW.W_u, curW.W_d)), test.map(a => a.human_quality_rating)) },
    recommended_correlation: { full: fullRecCorr, train: best.trainCorr, test: best.testCorr },
    overfit: overfit,
    score_distribution: { current: curStats, recommended: recStats },
    band_coverage: { current: [...curBands], recommended: [...recBands] },
    top_5_combos: combos.slice(0, 5),
    safe_to_apply: !overfit && best.testCorr >= fullCurCorr - 0.05,
    per_analysis: analyses.map((a, i) => ({
      analysis_id: a.analysis_id,
      human_rating: a.human_quality_rating,
      current_score: curScores[i],
      recommended_score: recScores[i],
    })),
  };

  // Write to both locations
  const localOutputPath = resolve(__dirname, 'weight-calibration-output.json');
  writeFileSync(localOutputPath, JSON.stringify(output, null, 2));
  
  // Ensure reports directory exists
  const reportsDir = resolve(__dirname, '../reports');
  const { mkdirSync } = await import('fs');
  try {
    mkdirSync(reportsDir, { recursive: true });
  } catch {}
  
  const reportsOutputPath = resolve(reportsDir, 'weight-calibration-latest.json');
  const reportsOutput = {
    created_at: output.created_at,
    ratings_source: ratingsSource,
    n: output.analyses_count,
    current_weights: output.current_weights,
    recommended_weights: output.recommended_weights,
    train_spearman: output.recommended_correlation.train,
    test_spearman: output.recommended_correlation.test,
    overfit_flag: output.overfit,
    distribution_current: output.score_distribution.current,
    distribution_recommended: output.score_distribution.recommended,
    band_coverage_current: output.band_coverage.current.length,
    band_coverage_recommended: output.band_coverage.recommended.length,
    ...output,
  };
  writeFileSync(reportsOutputPath, JSON.stringify(reportsOutput, null, 2));
  
  console.log(`Output saved: ${localOutputPath}`);
  console.log(`Report saved: ${reportsOutputPath}`);

  // Band recommendation
  console.log('');
  if (recStats.std < 0.08 || (recStats.max - recStats.min) < 0.35) {
    console.log('⚠️  Score distribution is narrow/clustered. Band boundary adjustment recommended.');
    console.log(`   Range: ${(recStats.max - recStats.min).toFixed(4)}, Std: ${recStats.std.toFixed(4)}`);

    // Suggest percentile-based boundaries
    const sortedScores = [...recScores].sort((a, b) => a - b);
    const p20 = sortedScores[Math.floor(sortedScores.length * 0.2)];
    const p50 = sortedScores[Math.floor(sortedScores.length * 0.5)];
    const p80 = sortedScores[Math.floor(sortedScores.length * 0.8)];

    const bandRec = {
      current: { low_max: ENGINE_CONFIG.BAND_LOW_MAX, moderate_max: ENGINE_CONFIG.BAND_MODERATE_MAX, high_max: ENGINE_CONFIG.BAND_HIGH_MAX },
      recommended: { low_max: Math.round(p20 * 100) / 100, moderate_max: Math.round(p50 * 100) / 100, high_max: Math.round(p80 * 100) / 100 },
      reason: `Score range [${recStats.min.toFixed(3)}, ${recStats.max.toFixed(3)}] with std=${recStats.std.toFixed(3)} is ${recStats.std < 0.08 ? 'clustered' : 'narrow'}`,
    };

    const bandPath = resolve(__dirname, 'band-recommendation.json');
    writeFileSync(bandPath, JSON.stringify(bandRec, null, 2));
    console.log(`Band recommendation saved: ${bandPath}`);
  } else {
    console.log('✓ Score distribution is acceptable. No band boundary change needed.');
  }

  // Final verdict
  console.log('');
  console.log('=== VERDICT ===');
  if (output.safe_to_apply) {
    console.log('SAFE TO APPLY. Recommended weights can be applied to ENGINE_CONFIG.');
    console.log(`Update src/config.ts: W_a=${best.W_a}, W_e=${best.W_e}, W_u=${best.W_u}, W_d=${best.W_d}`);
  } else if (overfit) {
    console.log('OVERFIT DETECTED. DO NOT apply weights automatically.');
    console.log('Review the top 5 combinations and consider a more conservative choice.');
  } else {
    console.log('Test correlation too low relative to current. DO NOT apply automatically.');
  }
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
