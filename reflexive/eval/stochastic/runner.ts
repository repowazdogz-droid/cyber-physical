import { readdir, readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { EVAL_CONFIG } from '../config.js';
import { runAnalysis } from '../../src/analysis/orchestrator.js';
import { computeLensMetrics, type RunData } from './metrics/lens-quality.js';
import { computeClaimMetrics } from './metrics/claim-quality.js';
import type { EvalReport } from '../types.js';

interface Stimulus {
  id: string;
  text: string;
  type: 'question' | 'decision' | 'scenario' | 'assessment_request';
  context?: string[];
}

export interface StochasticResult {
  verdict: 'pass' | 'warn' | 'fail';
  warnings: string[];
  failures: string[];
  stimuli_run: number;
  runs_per_stimulus: number;
  extraction_metrics: {
    per_lens: Record<string, Record<string, number>>;
    aggregate: Record<string, number>;
  };
  semantic_metrics?: Record<string, number>;
  system_metrics: Record<string, number>;
}

/**
 * Run stochastic evaluation (full pipeline).
 * NOTE: This requires LLM API access and will make real API calls.
 */
export async function runStochasticEval(): Promise<StochasticResult> {
  const stimulusFiles = await readdir(EVAL_CONFIG.stochastic_stimuli_dir);
  const stimuli: Stimulus[] = [];
  
  for (const file of stimulusFiles.filter(f => f.endsWith('.json'))) {
    const content = await readFile(resolve(EVAL_CONFIG.stochastic_stimuli_dir, file), 'utf-8');
    stimuli.push(JSON.parse(content));
  }

  const runs: RunData[] = [];
  const warnings: string[] = [];
  const failures: string[] = [];

  // For each stimulus, run N times
  for (const stimulus of stimuli) {
    for (let runNum = 0; runNum < EVAL_CONFIG.stochastic_runs_per_stimulus; runNum++) {
      const startTime = Date.now();
      try {
        // Create temporary case_id and analysis_id for this run
        const caseId = `stochastic-${stimulus.id}-run-${runNum}`;
        const analysisId = `analysis-${caseId}`;
        
        // Run full pipeline
        await runAnalysis(caseId, analysisId);
        
        // TODO: Extract lens results and engine output from DB
        // For now, placeholder structure
        runs.push({
          stimulus_id: stimulus.id,
          run_number: runNum,
          lens_results: [], // Would extract from DB
          duration_ms: Date.now() - startTime,
        });
      } catch (err: any) {
        failures.push(`Stimulus ${stimulus.id} run ${runNum}: ${err.message}`);
      }
    }
  }

  // Compute metrics
  const lensMetrics = computeLensMetrics(runs);
  const claimMetrics = computeClaimMetrics(runs);

  // Aggregate per-lens metrics
  const perLens: Record<string, Record<string, number>> = {};
  for (const [lensId, metrics] of Object.entries(lensMetrics)) {
    perLens[lensId] = {
      parse_rate: metrics.parse_rate,
      mean_claim_count: metrics.mean_claim_count,
      claim_validity_rate: metrics.claim_validity_rate,
      repair_rate: metrics.repair_rate,
      invalidity_rate: metrics.invalidity_rate,
    };
  }

  // Aggregate metrics
  const aggregate: Record<string, number> = {
    evidence_linkage_rate: claimMetrics.evidence_linkage_rate,
    category_distribution_entropy: claimMetrics.category_distribution_entropy,
    assumption_promotion_rate: claimMetrics.assumption_promotion_rate,
    mean_confidence_weight: claimMetrics.mean_confidence_weight,
  };

  // System metrics
  const durations = runs.map(r => r.duration_ms);
  const systemMetrics: Record<string, number> = {
    e2e_success_rate: runs.length > 0 ? runs.filter(r => r.engine_output).length / runs.length : 0,
    e2e_latency_p50: durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.5)] || 0,
    e2e_latency_p95: durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)] || 0,
    e2e_claim_throughput: runs.length > 0 ? runs.reduce((sum, r) => sum + (r.lens_results.reduce((s, lr) => s + lr.claims.length, 0)), 0) / runs.length : 0,
  };

  // Check regression thresholds
  const regression = EVAL_CONFIG.stochastic_regression;
  for (const [lensId, metrics] of Object.entries(lensMetrics)) {
    if (metrics.parse_rate < regression.lens_parse_rate_floor) {
      failures.push(`Lens ${lensId} parse rate ${metrics.parse_rate} below floor ${regression.lens_parse_rate_floor}`);
    }
    if (metrics.claim_validity_rate < regression.claim_validity_rate_floor) {
      failures.push(`Lens ${lensId} validity rate ${metrics.claim_validity_rate} below floor ${regression.claim_validity_rate_floor}`);
    }
  }

  const verdict: 'pass' | 'warn' | 'fail' = failures.length > 0 ? 'fail' : warnings.length > 0 ? 'warn' : 'pass';

  return {
    verdict,
    warnings,
    failures,
    stimuli_run: stimuli.length,
    runs_per_stimulus: EVAL_CONFIG.stochastic_runs_per_stimulus,
    extraction_metrics: { per_lens, aggregate },
    system_metrics,
  };
}

/**
 * Save current metrics as baseline.
 */
export async function saveBaseline(): Promise<void> {
  const result = await runStochasticEval();
  const baseline = {
    created_at: new Date().toISOString(),
    stimulus_count: result.stimuli_run,
    runs_per_stimulus: result.runs_per_stimulus,
    metrics: {
      per_lens: result.extraction_metrics.per_lens,
      aggregate: result.extraction_metrics.aggregate,
      system: result.system_metrics,
    },
  };

  const baselinePath = resolve(EVAL_CONFIG.stochastic_baseline_dir, 'baseline.json');
  await writeFile(baselinePath, JSON.stringify(baseline, null, 2));
  console.log(`Baseline saved to ${baselinePath}`);
}

/**
 * Main entry point.
 */
async function main() {
  const saveBaselineFlag = process.argv.includes('--save-baseline');
  
  if (saveBaselineFlag) {
    await saveBaseline();
  } else {
    const result = await runStochasticEval();
    console.log('=== REFLEXIVE Stochastic Evaluation ===');
    console.log(`Stimuli run: ${result.stimuli_run}`);
    console.log(`Runs per stimulus: ${result.runs_per_stimulus}`);
    console.log(`Verdict: ${result.verdict}`);
    if (result.failures.length > 0) {
      console.log('\nFailures:');
      for (const failure of result.failures) {
        console.log(`  ❌ ${failure}`);
      }
    }
    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      for (const warning of result.warnings) {
        console.log(`  ⚠ ${warning}`);
      }
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
