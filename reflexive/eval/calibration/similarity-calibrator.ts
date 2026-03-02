import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface LabeledPair {
  claim_a_id: string;
  claim_a_text: string;
  claim_b_id: string;
  claim_b_text: string;
  cosine_similarity: number;
  label: 'same' | 'different';
}

interface ThresholdResult {
  sim_match: number;
  sim_reject: number;
  tp: number;  // same predicted as same
  fp: number;  // different predicted as same
  tn: number;  // different predicted as different
  fn: number;  // same predicted as different
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
  borderline_count: number;  // pairs in [sim_reject, sim_match] zone
}

function evaluate(
  pairs: LabeledPair[],
  simMatch: number,
  simReject: number
): ThresholdResult {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  let borderline = 0;

  for (const pair of pairs) {
    const sim = pair.cosine_similarity;
    const actualSame = pair.label === 'same';

    if (sim >= simMatch) {
      // Predicted: same
      if (actualSame) tp++;
      else fp++;
    } else if (sim < simReject) {
      // Predicted: different
      if (!actualSame) tn++;
      else fn++;
    } else {
      // Borderline zone [simReject, simMatch)
      borderline++;
      // Conservative: treat borderline as "different" for metrics
      if (!actualSame) tn++;
      else fn++;
    }
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;
  const accuracy = (tp + tn) / pairs.length;

  return {
    sim_match: simMatch,
    sim_reject: simReject,
    tp, fp, tn, fn,
    precision, recall, f1, accuracy,
    borderline_count: borderline,
  };
}

async function main() {
  // Load labeled pairs
  const csvPath = resolve(__dirname, 'similarity-labeling.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');

  // Parse CSV manually since csv-parse might not be available
  const lines = csvContent.trim().split('\n');
  const header = lines[0];
  const pairs: LabeledPair[] = [];

  // Use a proper CSV parser approach
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Parse CSV with quoted fields - handle commas inside quotes
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        if (inQuotes && j + 1 < line.length && line[j + 1] === '"') {
          // Escaped quote
          current += '"';
          j++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    // Push last field
    fields.push(current.trim());

    if (fields.length >= 6) {
      const label = fields[5].trim();
      if (label === 'same' || label === 'different') {
        pairs.push({
          claim_a_id: fields[0].trim(),
          claim_a_text: fields[1].trim(),
          claim_b_id: fields[2].trim(),
          claim_b_text: fields[3].trim(),
          cosine_similarity: parseFloat(fields[4].trim()),
          label: label as 'same' | 'different',
        });
      }
    }
  }

  const sameCount = pairs.filter(p => p.label === 'same').length;
  const diffCount = pairs.filter(p => p.label === 'different').length;

  console.log('=== REFLEXIVE Similarity Threshold Calibration ===');
  console.log(`Loaded ${pairs.length} labeled pairs`);
  console.log(`  same: ${sameCount}`);
  console.log(`  different: ${diffCount}`);
  console.log('');

  // Print the "same" pairs for reference
  console.log('Pairs labeled "same":');
  for (const p of pairs.filter(p => p.label === 'same').sort((a, b) => b.cosine_similarity - a.cosine_similarity)) {
    console.log(`  sim=${p.cosine_similarity.toFixed(4)} | "${p.claim_a_text.substring(0, 60)}..." ↔ "${p.claim_b_text.substring(0, 60)}..."`);
  }
  console.log('');

  // Print false-positive danger zone: "different" pairs with high similarity
  console.log('High-similarity "different" pairs (false positive risks):');
  for (const p of pairs.filter(p => p.label === 'different' && p.cosine_similarity > 0.85).sort((a, b) => b.cosine_similarity - a.cosine_similarity)) {
    console.log(`  sim=${p.cosine_similarity.toFixed(4)} | "${p.claim_a_text.substring(0, 60)}..." ↔ "${p.claim_b_text.substring(0, 60)}..."`);
  }
  console.log('');

  // === THRESHOLD SWEEP ===
  // Sweep SIM_MATCH from 0.50 to 0.99 in 0.01 increments
  // For each SIM_MATCH, sweep SIM_REJECT from 0.30 to SIM_MATCH-0.05

  const results: ThresholdResult[] = [];

  for (let match = 0.50; match <= 0.99; match += 0.01) {
    for (let reject = 0.30; reject <= match - 0.05; reject += 0.01) {
      const result = evaluate(pairs, match, reject);
      results.push(result);
    }
  }

  // Find optimal by F1 (primary), then by precision (secondary — we want to avoid false merges)
  // Filter: precision must be >= 0.80 (we strongly prefer avoiding false merges)
  const highPrecision = results.filter(r => r.precision >= 0.80 && r.recall > 0);

  let optimal: ThresholdResult;
  if (highPrecision.length > 0) {
    // Among high-precision results, maximize F1
    highPrecision.sort((a, b) => {
      if (Math.abs(b.f1 - a.f1) > 0.001) return b.f1 - a.f1;
      // Tie-break: higher precision
      if (Math.abs(b.precision - a.precision) > 0.001) return b.precision - a.precision;
      // Tie-break: fewer borderlines
      return a.borderline_count - b.borderline_count;
    });
    optimal = highPrecision[0];
  } else {
    // Fallback: maximize F1 overall
    results.sort((a, b) => b.f1 - a.f1);
    optimal = results[0];
  }

  console.log('=== OPTIMAL THRESHOLDS ===');
  console.log(`SIM_MATCH:  ${optimal.sim_match.toFixed(2)}`);
  console.log(`SIM_REJECT: ${optimal.sim_reject.toFixed(2)}`);
  console.log('');
  console.log('Confusion matrix:');
  console.log(`  TP (same → same):     ${optimal.tp}`);
  console.log(`  FP (diff → same):     ${optimal.fp}`);
  console.log(`  TN (diff → diff):     ${optimal.tn}`);
  console.log(`  FN (same → diff):     ${optimal.fn}`);
  console.log(`  Borderline:           ${optimal.borderline_count}`);
  console.log('');
  console.log('Metrics:');
  console.log(`  Precision: ${optimal.precision.toFixed(4)} (target >= 0.80)`);
  console.log(`  Recall:    ${optimal.recall.toFixed(4)}`);
  console.log(`  F1:        ${optimal.f1.toFixed(4)}`);
  console.log(`  Accuracy:  ${optimal.accuracy.toFixed(4)}`);
  console.log('');

  // Check for threshold sensitivity: are there "different" pairs within 0.03 of SIM_MATCH?
  const dangerZone = pairs.filter(
    p => p.label === 'different' &&
    p.cosine_similarity >= optimal.sim_match - 0.03 &&
    p.cosine_similarity < optimal.sim_match
  );
  const thresholdSensitive = dangerZone.length > 0;

  if (thresholdSensitive) {
    console.log(`⚠️  THRESHOLD-SENSITIVE: ${dangerZone.length} "different" pair(s) within 0.03 of SIM_MATCH`);
    for (const p of dangerZone) {
      console.log(`  sim=${p.cosine_similarity.toFixed(4)} | "${p.claim_a_text.substring(0, 60)}..." ↔ "${p.claim_b_text.substring(0, 60)}..."`);
    }
    console.log('');
  } else {
    console.log('✓ No threshold sensitivity detected');
    console.log('');
  }

  // Print top 10 configurations by F1 for context
  console.log('Top 10 configurations by F1 (precision >= 0.80):');
  const top10 = (highPrecision.length > 0 ? highPrecision : results).slice(0, 10);
  for (const r of top10) {
    console.log(`  match=${r.sim_match.toFixed(2)} reject=${r.sim_reject.toFixed(2)} | P=${r.precision.toFixed(3)} R=${r.recall.toFixed(3)} F1=${r.f1.toFixed(3)} | TP=${r.tp} FP=${r.fp} FN=${r.fn} border=${r.borderline_count}`);
  }
  console.log('');

  // Also show what happens at the current ENGINE_CONFIG defaults
  // Current defaults are likely SIM_MATCH=0.86, SIM_REJECT=0.50
  const current = evaluate(pairs, 0.86, 0.50);
  console.log('Current ENGINE_CONFIG thresholds (SIM_MATCH=0.86, SIM_REJECT=0.50):');
  console.log(`  P=${current.precision.toFixed(3)} R=${current.recall.toFixed(3)} F1=${current.f1.toFixed(3)} | TP=${current.tp} FP=${current.fp} FN=${current.fn} border=${current.borderline_count}`);
  console.log('');

  // Save full report
  const report = {
    created_at: new Date().toISOString(),
    labeled_pairs: pairs.length,
    same_count: sameCount,
    different_count: diffCount,
    optimal: {
      sim_match: Math.round(optimal.sim_match * 100) / 100,
      sim_reject: Math.round(optimal.sim_reject * 100) / 100,
      precision: optimal.precision,
      recall: optimal.recall,
      f1: optimal.f1,
      accuracy: optimal.accuracy,
      tp: optimal.tp,
      fp: optimal.fp,
      tn: optimal.tn,
      fn: optimal.fn,
      borderline_count: optimal.borderline_count,
    },
    threshold_sensitive: thresholdSensitive,
    danger_zone_pairs: dangerZone.map(p => ({
      similarity: p.cosine_similarity,
      claim_a: p.claim_a_text.substring(0, 100),
      claim_b: p.claim_b_text.substring(0, 100),
    })),
    current_config: {
      sim_match: 0.86,
      sim_reject: 0.50,
      precision: current.precision,
      recall: current.recall,
      f1: current.f1,
    },
    same_pairs: pairs.filter(p => p.label === 'same').map(p => ({
      similarity: p.cosine_similarity,
      claim_a: p.claim_a_text.substring(0, 100),
      claim_b: p.claim_b_text.substring(0, 100),
    })),
  };

  const reportPath = resolve(__dirname, 'similarity-calibration-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report saved: ${reportPath}`);

  // Print the recommendation
  console.log('');
  console.log('=== RECOMMENDATION ===');
  console.log(`Update ENGINE_CONFIG in src/config.ts:`);
  console.log(`  SIM_MATCH:  ${optimal.sim_match.toFixed(2)}`);
  console.log(`  SIM_REJECT: ${optimal.sim_reject.toFixed(2)}`);
  console.log('');
  console.log('Then run:');
  console.log('  npm test');
  console.log('  npm run eval:golden');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
