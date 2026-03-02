/**
 * Regression Suite
 * 
 * Regression suite infrastructure for catching drift.
 * 
 * Version: 1.0.0
 */

import { TestSuite, SuiteReport, SwapMode, runSuite } from './SwapHarness';
import { Request } from '../../contracts/types/Request';
import { Domain } from '../../contracts/enums/Domains';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { hashCanonical } from '../../contracts/invariants/CanonicalHashing';

/**
 * Regression suite configuration.
 */
export interface RegressionConfig {
  /** Suite name */
  name: string;
  /** Suite description */
  description?: string;
  /** Tasks directory */
  tasks_dir: string;
  /** Fixed seed */
  seed?: number;
  /** Vault snapshot hash */
  vault_hash?: string;
  /** Thresholds */
  thresholds: {
    /** Max solve rate drop */
    max_solve_rate_drop?: number;
    /** Max cost increase */
    max_cost_increase?: number;
  };
}

/**
 * Loads a regression suite from directory.
 */
export async function loadRegressionSuite(
  suiteDir: string,
  config: RegressionConfig
): Promise<TestSuite> {
  const tasks: TestSuite['tasks'] = [];
  const tasksDir = join(suiteDir, config.tasks_dir);

  // Load tasks (assuming tasks are stored as JSON files)
  // Format: task_<id>.json with { request, input_grid, expected_output_grid? }
  try {
    const { readdir } = await import('fs/promises');
    const files = await readdir(tasksDir);
    
    for (const file of files) {
      if (file.startsWith('task_') && file.endsWith('.json')) {
        const taskId = file.slice(5, -5); // Extract task ID
        const taskContent = JSON.parse(await readFile(join(tasksDir, file), 'utf8'));
        
        tasks.push({
          task_id: taskId,
          request: taskContent.request as Request,
          input_grid: taskContent.input_grid,
          expected_output_grid: taskContent.expected_output_grid
        });
      }
    }
  } catch (error) {
    throw new Error(`Failed to load regression suite: ${error}`);
  }

  return {
    name: config.name,
    description: config.description,
    tasks,
    seed: config.seed,
    vault_hash: config.vault_hash
  };
}

/**
 * Runs a regression suite and checks for drift.
 */
export async function runRegressionSuite(
  suite: TestSuite,
  mode: SwapMode,
  baselineReport: SuiteReport | null,
  config: RegressionConfig,
  options: {
    taskRoot: string;
    modelA?: any; // IModelAdapter
    modelB?: any; // IModelAdapter
    vaultRoot?: string;
  }
): Promise<{
  ok: boolean;
  report: SuiteReport;
  drift_detected: boolean;
  drift_details?: {
    solve_rate_drop?: number;
    cost_increase?: number;
    hash_changes?: Array<{ task_id: string; artifact: string; expected: string; actual: string }>;
  };
}> {
  // Run suite
  const report = await runSuite(suite, mode, options);

  // Check for drift
  let driftDetected = false;
  const driftDetails: any = {};

  if (baselineReport) {
    // Check solve rate drop
    const solveRateDrop = baselineReport.metrics.solve_rate - report.metrics.solve_rate;
    if (solveRateDrop > (config.thresholds.max_solve_rate_drop || 0.1)) {
      driftDetected = true;
      driftDetails.solve_rate_drop = solveRateDrop;
    }

    // Check cost increase
    const costIncrease = report.metrics.avg_cost_usd - baselineReport.metrics.avg_cost_usd;
    if (costIncrease > (config.thresholds.max_cost_increase || 0.5)) {
      driftDetected = true;
      driftDetails.cost_increase = costIncrease;
    }

    // Check hash changes (compare task results)
    const hashChanges: Array<{ task_id: string; artifact: string; expected: string; actual: string }> = [];
    for (let i = 0; i < baselineReport.task_results.length && i < report.task_results.length; i++) {
      const baseline = baselineReport.task_results[i];
      const current = report.task_results[i];

      if (baseline.winner_program_id !== current.winner_program_id) {
        hashChanges.push({
          task_id: baseline.task_id,
          artifact: 'winner_program_id',
          expected: baseline.winner_program_id || '',
          actual: current.winner_program_id || ''
        });
      }
    }

    if (hashChanges.length > 0) {
      driftDetected = true;
      driftDetails.hash_changes = hashChanges;
    }
  }

  return {
    ok: !driftDetected,
    report,
    drift_detected: driftDetected,
    drift_details: driftDetected ? driftDetails : undefined
  };
}

