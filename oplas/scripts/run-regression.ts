#!/usr/bin/env node
/**
 * Run Regression Suite
 * 
 * CI-gated regression runner.
 * 
 * Version: 1.0.0
 */

import { join } from 'path';
import { readFile } from 'fs/promises';
import {
  loadRegressionSuite,
  runRegressionSuite,
  RegressionConfig
} from '../src/harness/v0/RegressionSuite';
import { SwapMode } from '../src/harness/v0/SwapHarness';
import { writeDashboardReport } from '../src/harness/v0/Dashboard';
import { ReplayModelAdapter } from '../src/model/v0/ReplayAdapter';
import { StubModelAdapter } from '../src/model/v0/StubAdapter';

async function main() {
  const args = process.argv.slice(2);
  const suiteName = args[0] || 'smoke_10';
  const modeStr = args[1] || 'NO_MODEL';
  const taskRoot = args[2] || join(process.cwd(), 'tmp', 'tasks');
  const reportsDir = args[3] || join(process.cwd(), 'reports');
  const suitesDir = args[4] || join(process.cwd(), 'suites');

  const mode = modeStr as SwapMode;
  if (!Object.values(SwapMode).includes(mode)) {
    console.error(`ERROR: Invalid mode: ${modeStr}`);
    console.error(`Valid modes: ${Object.values(SwapMode).join(', ')}`);
    process.exit(1);
  }

  console.log(`Running regression suite: ${suiteName}`);
  console.log(`Mode: ${mode}`);
  console.log(`Task root: ${taskRoot}`);
  console.log(`Reports dir: ${reportsDir}`);
  console.log('---');

  // Load suite config
  const configPath = join(suitesDir, suiteName, 'config.json');
  const config: RegressionConfig = JSON.parse(await readFile(configPath, 'utf8'));

  // Load suite
  const suiteDir = join(suitesDir, suiteName);
  const suite = await loadRegressionSuite(suiteDir, config);

  console.log(`Loaded suite: ${suite.name}`);
  console.log(`Tasks: ${suite.tasks.length}`);
  console.log('---');

  // Load baseline report (if exists)
  let baselineReport = null;
  try {
    const baselinePath = join(reportsDir, `${suiteName}_baseline.json`);
    const baselineContent = await readFile(baselinePath, 'utf8');
    baselineReport = JSON.parse(baselineContent);
    console.log('Loaded baseline report');
  } catch {
    console.log('No baseline report found (first run)');
  }

  // Setup model adapters
  let modelA: any = undefined;
  let modelB: any = undefined;

  if (mode === SwapMode.MODEL_A || mode === SwapMode.A_THEN_B) {
    // For replay, use ReplayModelAdapter
    // For live, would use actual model adapter
    modelA = new StubModelAdapter(); // TODO: Replace with actual adapter
  }

  if (mode === SwapMode.MODEL_B || mode === SwapMode.A_THEN_B) {
    modelB = new StubModelAdapter(); // TODO: Replace with actual adapter
  }

  // Run regression
  const result = await runRegressionSuite(
    suite,
    mode,
    baselineReport,
    config,
    {
      taskRoot,
      modelA,
      modelB
    }
  );

  // Write dashboard report
  await writeDashboardReport(result.report, reportsDir);

  console.log('---');
  console.log('Regression Results:');
  console.log(`  Solved: ${result.report.metrics.solve_rate * 100}%`);
  console.log(`  Writeback: ${result.report.metrics.writeback_rate * 100}%`);
  console.log(`  Avg Cost: $${result.report.metrics.avg_cost_usd.toFixed(4)}`);
  console.log(`  Avg Latency: ${result.report.metrics.avg_latency_ms.toFixed(2)}ms`);

  if (result.drift_detected) {
    console.log('---');
    console.error('❌ DRIFT DETECTED');
    if (result.drift_details?.solve_rate_drop) {
      console.error(`  Solve rate drop: ${result.drift_details.solve_rate_drop * 100}%`);
    }
    if (result.drift_details?.cost_increase) {
      console.error(`  Cost increase: $${result.drift_details.cost_increase.toFixed(4)}`);
    }
    if (result.drift_details?.hash_changes) {
      console.error(`  Hash changes: ${result.drift_details.hash_changes.length}`);
    }
    process.exit(1);
  } else {
    console.log('---');
    console.log('✅ No drift detected');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('FATAL ERROR:', error);
  process.exit(1);
});























