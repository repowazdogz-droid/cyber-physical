import { v4 as uuidv4 } from 'uuid';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { EVAL_CONFIG } from './config.js';
import type { EvalReport, GoldenResult } from './types.js';

export function generateReport(opts: {
  trigger: EvalReport['trigger'];
  track_a?: {
    results: GoldenResult[];
    metrics: Record<string, number>;
    total_duration_ms: number;
  };
  track_b?: EvalReport['track_b'];
  calibration?: EvalReport['calibration'];
}): EvalReport {
  const failures: string[] = [];

  // Track A failures
  if (opts.track_a) {
    for (const r of opts.track_a.results) {
      if (!r.passed) {
        failures.push(...r.failures.map(f => `[${r.case_id}] ${f}`));
      }
    }
  }

  // Track B failures from stochastic verdict
  if (opts.track_b) {
    // Would extract failures from track_b if it had a verdict field
    // For now, assume no failures from track_b
  }

  const verdict: 'pass' | 'fail' | 'warn' =
    failures.length > 0 ? 'fail' :
    /* check for warnings */ 'pass';

  const report: EvalReport = {
    id: uuidv4(),
    created_at: new Date().toISOString(),
    trigger: opts.trigger,
    track_a: opts.track_a ? {
      golden_cases_run: opts.track_a.results.length,
      golden_cases_passed: opts.track_a.results.filter(r => r.passed).length,
      golden_cases_failed: opts.track_a.results.filter(r => !r.passed).map(r => r.case_id),
      engine_metrics: opts.track_a.metrics,
      total_duration_ms: opts.track_a.total_duration_ms,
    } : {
      golden_cases_run: 0,
      golden_cases_passed: 0,
      golden_cases_failed: [],
      engine_metrics: {},
      total_duration_ms: 0,
    },
    track_b: opts.track_b,
    calibration: opts.calibration,
    regression_verdict: verdict,
    regression_failures: failures,
  };

  // Write to reports/
  const path = resolve(EVAL_CONFIG.reports_dir, `eval-${report.id}.json`);
  writeFileSync(path, JSON.stringify(report, null, 2));

  // Also write as latest.json
  writeFileSync(resolve(EVAL_CONFIG.reports_dir, 'latest.json'), JSON.stringify(report, null, 2));

  return report;
}
