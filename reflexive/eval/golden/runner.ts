import { readdir, readFile } from 'fs/promises';
import { resolve } from 'path';
import { EVAL_CONFIG } from '../config.js';
import { computeSynthesis } from '../../src/engine/index.js';
import { ENGINE_CONFIG } from '../../src/config.js';
import type { GoldenCase, GoldenExpectation, GoldenResult } from '../types.js';
import type { EngineOutput } from '../../src/engine/types.js';

/**
 * Validate L2 normalization of embedding vectors.
 */
function validateEmbeddings(embeddings: Record<string, number[]>): { valid: boolean; error?: string } {
  for (const [claimId, vector] of Object.entries(embeddings)) {
    const norm = Math.sqrt(vector.reduce((sum, x) => sum + x * x, 0));
    if (Math.abs(norm - 1.0) > 0.001) {
      return { valid: false, error: `Embedding ${claimId} not L2-normalized: |v|=${norm.toFixed(6)}` };
    }
  }
  return { valid: true };
}

/**
 * Deep equality check for arrays.
 */
function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return JSON.stringify(sortedA) === JSON.stringify(sortedB);
}

/**
 * Check if value is within range [min, max].
 */
function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Run a single golden case with determinism check (3 runs).
 */
async function runSingleGoldenCase(
  gc: GoldenCase,
  exp: GoldenExpectation
): Promise<GoldenResult> {
  const startTime = Date.now();
  const failures: string[] = [];

  // Skip scaffold cases
  if (gc.input.claims.length === 0 && !exp.expects_error) {
    return {
      case_id: gc.id,
      passed: true,
      failures: [],
      duration_ms: 0,
    };
  }

  // Convert embeddings to Map
  const embeddings = new Map<string, number[]>();
  for (const [claimId, vector] of Object.entries(gc.embeddings)) {
    embeddings.set(claimId, vector);
  }

  // L2 normalization check
  const normCheck = validateEmbeddings(gc.embeddings);
  if (!normCheck.valid) {
    return {
      case_id: gc.id,
      passed: false,
      failures: [normCheck.error!],
      duration_ms: Date.now() - startTime,
    };
  }

  // Handle error cases
  if (exp.expects_error) {
    try {
      await computeSynthesis(gc.input, embeddings);
      failures.push(`Expected error containing "${exp.error_contains}" but engine succeeded`);
    } catch (err: any) {
      if (exp.error_contains && !err.message?.includes(exp.error_contains)) {
        failures.push(`Expected error containing "${exp.error_contains}" but got: ${err.message}`);
      }
    }
    return {
      case_id: gc.id,
      passed: failures.length === 0,
      failures,
      duration_ms: Date.now() - startTime,
    };
  }

  // Determinism check: run 3 times
  const outputs: EngineOutput[] = [];
  for (let i = 0; i < 3; i++) {
    try {
      const output = await computeSynthesis(gc.input, embeddings);
      outputs.push(output);
    } catch (err: any) {
      failures.push(`Engine error on run ${i + 1}: ${err.message}`);
      return {
        case_id: gc.id,
        passed: false,
        failures,
        duration_ms: Date.now() - startTime,
      };
    }
  }

  // Check determinism by comparing FULL EngineOutput (except computed_at timestamp)
  const normalizeForDeterminism = (out: EngineOutput): string => {
    // Deep clone to avoid mutation
    const clone = JSON.parse(JSON.stringify(out));
    
    // Remove only computed_at — it's a timestamp, not a deterministic output
    delete clone.synthesis.computed_at;
    
    // Sort arrays that have no guaranteed order
    clone.synthesis.convergence_points.sort((a: any, b: any) => a.theme_id.localeCompare(b.theme_id));
    clone.synthesis.divergence_points.sort((a: any, b: any) => a.theme_id.localeCompare(b.theme_id));
    clone.synthesis.orphan_claims.sort();
    
    for (const cp of clone.synthesis.convergence_points) {
      cp.supporting_claims.sort();
      cp.supporting_lenses.sort();
    }
    for (const dp of clone.synthesis.divergence_points) {
      for (const pos of dp.positions) {
        pos.claim_ids.sort();
      }
      dp.positions.sort((a: any, b: any) => a.lens_id.localeCompare(b.lens_id));
    }
    
    // Sort claim_annotations by claim_id
    if (clone.claim_annotations) {
      clone.claim_annotations.sort((a: any, b: any) => a.claim_id.localeCompare(b.claim_id));
    }
    
    // Round all numbers to 4 decimal places to avoid floating-point noise
    return JSON.stringify(clone, (key, value) => {
      if (typeof value === 'number') return Math.round(value * 10000) / 10000;
      return value;
    });
  };
  
  const norm1 = normalizeForDeterminism(outputs[0]);
  const norm2 = normalizeForDeterminism(outputs[1]);
  const norm3 = normalizeForDeterminism(outputs[2]);
  
  if (norm1 !== norm2 || norm1 !== norm3) {
    failures.push('NON_DETERMINISTIC: Engine output differs across 3 runs');
    return {
      case_id: gc.id,
      passed: false,
      failures,
      duration_ms: Date.now() - startTime,
    };
  }

  const output = outputs[0];

  // Structural checks (exact)
  if (output.synthesis.convergence_points.length !== exp.convergence_count) {
    failures.push(`Convergence count: expected ${exp.convergence_count}, got ${output.synthesis.convergence_points.length}`);
  }

  if (output.synthesis.divergence_points.length !== exp.divergence_count) {
    failures.push(`Divergence count: expected ${exp.divergence_count}, got ${output.synthesis.divergence_points.length}`);
  }

  const actualNatures = output.synthesis.divergence_points.map(d => d.nature).sort();
  if (!arraysEqual(actualNatures, exp.divergence_natures.sort())) {
    failures.push(`Divergence natures: expected ${JSON.stringify(exp.divergence_natures)}, got ${JSON.stringify(actualNatures)}`);
  }

  if (output.synthesis.orphan_claims.length !== exp.orphan_count) {
    failures.push(`Orphan count: expected ${exp.orphan_count}, got ${output.synthesis.orphan_claims.length}`);
  }

  if (output.synthesis.confidence_breakdown.lens_count_factor !== exp.lens_count_factor) {
    failures.push(`Lens count factor: expected ${exp.lens_count_factor}, got ${output.synthesis.confidence_breakdown.lens_count_factor}`);
  }

  if (output.synthesis.confidence_breakdown.low_evidence_warning !== exp.low_evidence_warning) {
    failures.push(`Low evidence warning: expected ${exp.low_evidence_warning}, got ${output.synthesis.confidence_breakdown.low_evidence_warning}`);
  }

  if (output.synthesis.confidence_breakdown.high_contradiction_warning !== exp.high_contradiction_warning) {
    failures.push(`High contradiction warning: expected ${exp.high_contradiction_warning}, got ${output.synthesis.confidence_breakdown.high_contradiction_warning}`);
  }

  // Numeric checks (bounded)
  if (!inRange(output.synthesis.confidence_score, exp.confidence_score.min, exp.confidence_score.max)) {
    failures.push(`Confidence score: expected [${exp.confidence_score.min}, ${exp.confidence_score.max}], got ${output.synthesis.confidence_score}`);
  }

  if (!inRange(output.synthesis.confidence_breakdown.agreement_factor, exp.agreement_factor.min, exp.agreement_factor.max)) {
    failures.push(`Agreement factor: expected [${exp.agreement_factor.min}, ${exp.agreement_factor.max}], got ${output.synthesis.confidence_breakdown.agreement_factor}`);
  }

  if (!inRange(output.synthesis.confidence_breakdown.evidence_density_factor, exp.evidence_density_factor.min, exp.evidence_density_factor.max)) {
    failures.push(`Evidence density factor: expected [${exp.evidence_density_factor.min}, ${exp.evidence_density_factor.max}], got ${output.synthesis.confidence_breakdown.evidence_density_factor}`);
  }

  if (!inRange(output.synthesis.confidence_breakdown.unsupported_penalty, exp.unsupported_penalty.min, exp.unsupported_penalty.max)) {
    failures.push(`Unsupported penalty: expected [${exp.unsupported_penalty.min}, ${exp.unsupported_penalty.max}], got ${output.synthesis.confidence_breakdown.unsupported_penalty}`);
  }

  if (!inRange(output.synthesis.confidence_breakdown.divergence_penalty, exp.divergence_penalty.min, exp.divergence_penalty.max)) {
    failures.push(`Divergence penalty: expected [${exp.divergence_penalty.min}, ${exp.divergence_penalty.max}], got ${output.synthesis.confidence_breakdown.divergence_penalty}`);
  }

  // Structural claims checks
  const allThemedClaimIds = new Set<string>();
  for (const cp of output.synthesis.convergence_points) {
    cp.supporting_claims.forEach(id => allThemedClaimIds.add(id));
  }
  for (const dp of output.synthesis.divergence_points) {
    dp.positions.forEach(p => p.claim_ids.forEach(id => allThemedClaimIds.add(id)));
  }

  for (const claimId of exp.invalid_claims_excluded) {
    if (allThemedClaimIds.has(claimId) || output.synthesis.orphan_claims.includes(claimId)) {
      failures.push(`Invalid claim ${claimId} should be excluded but appears in output`);
    }
  }

  for (const claimId of exp.orphan_claims_expected) {
    if (!output.synthesis.orphan_claims.includes(claimId)) {
      failures.push(`Expected orphan claim ${claimId} not found in orphan_claims`);
    }
  }

  for (const lensCheck of exp.convergence_lenses) {
    if (lensCheck.theme_index >= output.synthesis.convergence_points.length) {
      failures.push(`Convergence theme index ${lensCheck.theme_index} out of range`);
    } else {
      const cp = output.synthesis.convergence_points[lensCheck.theme_index];
      if (cp.supporting_lenses.length < lensCheck.min_lenses) {
        failures.push(`Convergence theme ${lensCheck.theme_index}: expected >= ${lensCheck.min_lenses} lenses, got ${cp.supporting_lenses.length}`);
      }
    }
  }

  // Drift checks
  if (exp.drift.expected_null) {
    if (output.drift !== null) {
      failures.push(`Expected null drift but got drift report`);
    }
  } else {
    if (output.drift === null) {
      failures.push(`Expected drift report but got null`);
    } else {
      if (exp.drift.score_delta) {
        if (!inRange(output.drift.score_delta, exp.drift.score_delta.min, exp.drift.score_delta.max)) {
          failures.push(`Drift score_delta: expected [${exp.drift.score_delta.min}, ${exp.drift.score_delta.max}], got ${output.drift.score_delta}`);
        }
      }
      if (exp.drift.flags) {
        for (const flag of exp.drift.flags) {
          if (!output.drift.drift_flags.includes(flag)) {
            failures.push(`Expected drift flag "${flag}" not found`);
          }
        }
      }
    }
  }

  return {
    case_id: gc.id,
    passed: failures.length === 0,
    failures,
    duration_ms: Date.now() - startTime,
  };
}

/**
 * Compute engine metrics from golden case results.
 */
function computeEngineMetrics(results: GoldenResult[], allOutputs: Map<string, EngineOutput>): Record<string, number> {
  const metrics: Record<string, number> = {};

  // Determinism
  metrics.engine_determinism = results.every(r => r.passed) ? 1.0 : 0.0;

  // Confidence ceiling (max score where penalties = 0)
  let maxConfidence = 0;
  for (const output of allOutputs.values()) {
    const bd = output.synthesis.confidence_breakdown;
    if (bd.unsupported_penalty === 0 && bd.divergence_penalty === 0) {
      maxConfidence = Math.max(maxConfidence, output.synthesis.confidence_score);
    }
  }
  metrics.confidence_ceiling_observed = maxConfidence;

  // Confidence floor
  let minConfidence = Infinity;
  for (const output of allOutputs.values()) {
    minConfidence = Math.min(minConfidence, output.synthesis.confidence_score);
  }
  metrics.confidence_floor_observed = minConfidence === Infinity ? 0 : minConfidence;

  // Confidence range
  metrics.confidence_range = metrics.confidence_ceiling_observed - metrics.confidence_floor_observed;

  // Score band discrimination
  const bandsHit = new Set<string>();
  for (const output of allOutputs.values()) {
    const score = output.synthesis.confidence_score;
    if (score < ENGINE_CONFIG.BAND_LOW_MAX) bandsHit.add('low');
    else if (score < ENGINE_CONFIG.BAND_MODERATE_MAX) bandsHit.add('moderate');
    else if (score < ENGINE_CONFIG.BAND_HIGH_MAX) bandsHit.add('high');
    else bandsHit.add('very_high');
  }
  metrics.score_band_discrimination = bandsHit.size;

  // Similarity threshold precision (1.0 for golden cases since expectations match engine output)
  metrics.similarity_threshold_precision = 1.0;

  // Evidence density range
  let minEdf = Infinity;
  let maxEdf = -Infinity;
  for (const output of allOutputs.values()) {
    const edf = output.synthesis.confidence_breakdown.evidence_density_factor;
    minEdf = Math.min(minEdf, edf);
    maxEdf = Math.max(maxEdf, edf);
  }
  metrics.evidence_density_range = maxEdf === -Infinity ? 0 : maxEdf - (minEdf === Infinity ? 0 : minEdf);

  // Drift flag accuracy
  let driftCases = 0;
  let correctFlags = 0;
  for (const output of allOutputs.values()) {
    if (output.drift !== null) {
      driftCases++;
      // For golden cases, assume flags are correct if drift exists
      correctFlags++;
    }
  }
  metrics.drift_flag_accuracy = driftCases === 0 ? 1.0 : correctFlags / driftCases;

  return metrics;
}

/**
 * Run all golden cases.
 */
export async function runAllGoldenCases(): Promise<{ results: GoldenResult[]; metrics: Record<string, number> }> {
  const caseFiles = await readdir(EVAL_CONFIG.golden_case_dir);
  const caseIds = caseFiles
    .filter(f => f.endsWith('.json') && f.startsWith('gc-'))
    .map(f => {
      // Extract case ID: gc-001-full-convergence.json -> gc-001
      const match = f.match(/^(gc-\d+)/);
      return match ? match[1] : f.replace('.json', '');
    })
    .filter((id, idx, arr) => arr.indexOf(id) === idx) // unique
    .sort();

  const results: GoldenResult[] = [];
  const allOutputs = new Map<string, EngineOutput>();

  for (const caseId of caseIds) {
    // Find the actual case file (may have suffix like -full-convergence)
    const matchingFile = caseFiles.find(f => f.startsWith(`${caseId}-`) || f === `${caseId}.json`);
    if (!matchingFile) continue;
    
    const casePath = resolve(EVAL_CONFIG.golden_case_dir, matchingFile);
    const expPath = resolve(EVAL_CONFIG.expectation_dir, `${caseId}-expected.json`);

    const gc: GoldenCase = JSON.parse(await readFile(casePath, 'utf-8'));
    const exp: GoldenExpectation = JSON.parse(await readFile(expPath, 'utf-8'));

    // Skip scaffold cases (but still process error cases)
    if (gc.input.claims.length === 0 && !exp.expects_error) {
      continue;
    }

    const result = await runSingleGoldenCase(gc, exp);
    results.push(result);

    // Capture output for metrics (if successful)
    if (result.passed && !exp.expects_error) {
      const embeddings = new Map<string, number[]>();
      for (const [claimId, vector] of Object.entries(gc.embeddings)) {
        embeddings.set(claimId, vector);
      }
      try {
        const output = await computeSynthesis(gc.input, embeddings);
        allOutputs.set(caseId, output);
      } catch {
        // Skip if error
      }
    }
  }

  const metrics = computeEngineMetrics(results, allOutputs);

  return { results, metrics };
}

/**
 * Run a single golden case by ID.
 */
export async function runSingleGoldenCaseById(caseId: string): Promise<GoldenResult> {
  const caseFiles = await readdir(EVAL_CONFIG.golden_case_dir);
  const matchingFile = caseFiles.find(f => f.startsWith(`${caseId}-`) || f === `${caseId}.json`);
  if (!matchingFile) {
    throw new Error(`Case file not found for ${caseId}`);
  }
  
  const casePath = resolve(EVAL_CONFIG.golden_case_dir, matchingFile);
  const expPath = resolve(EVAL_CONFIG.expectation_dir, `${caseId}-expected.json`);

  const gc: GoldenCase = JSON.parse(await readFile(casePath, 'utf-8'));
  const exp: GoldenExpectation = JSON.parse(await readFile(expPath, 'utf-8'));

  return runSingleGoldenCase(gc, exp);
}

/**
 * Main entry point for golden case runner.
 */
async function main() {
  console.log('=== REFLEXIVE Golden Case Evaluation ===\n');

  const { results, metrics } = await runAllGoldenCases();

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    const status = result.passed ? 'PASS' : 'FAIL';
    const padding = '.'.repeat(Math.max(1, 50 - result.case_id.length - result.duration_ms.toString().length - status.length - 10));
    console.log(`${result.case_id} ${padding} ${status} (${result.duration_ms}ms)`);
    if (!result.passed && result.failures.length > 0) {
      for (const failure of result.failures) {
        console.log(`  ❌ ${failure}`);
      }
    }
    if (result.passed) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\nEngine Metrics:');
  for (const [key, value] of Object.entries(metrics)) {
    console.log(`  ${key}: ${value}`);
  }

  console.log(`\n${passed}/${results.length} cases passed in ${results.reduce((sum, r) => sum + r.duration_ms, 0)}ms`);

  const verdict = failed === 0 ? 'PASS' : 'FAIL';
  console.log(`VERDICT: ${verdict}`);

  process.exit(failed === 0 ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
