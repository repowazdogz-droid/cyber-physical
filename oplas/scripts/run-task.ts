#!/usr/bin/env node
/**
 * Run Task
 * 
 * Runs a task using orchestrator.
 * 
 * Version: 1.0.0
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { runTask } from '../src/orchestrator/v0/Orchestrator';
import { loadProgramsFromFixtures } from '../src/orchestrator/v0/FixturesRunner';
import { Request } from '../src/contracts/types/Request';
import { Domain } from '../src/contracts/enums/Domains';
import { DEFAULT_BUDGETS } from '../src/contracts/types/BudgetSpec';

async function runTaskScript(taskId: string, fixturesDir?: string, taskRoot?: string) {
  console.log(`Running task: ${taskId}`);
  console.log('---');

  // Load candidate programs from fixtures
  const fixturesPath = fixturesDir || join(process.cwd(), 'fixtures', 'programs');
  const candidatePrograms = await loadProgramsFromFixtures(fixturesPath);

  if (candidatePrograms.length === 0) {
    console.error('ERROR: No candidate programs found');
    process.exit(1);
  }

  console.log(`Loaded ${candidatePrograms.length} candidate programs`);
  console.log('---');

  // Load input grid
  const gridPath = join(process.cwd(), 'fixtures', 'grids', 'single_color.json');
  const gridData = JSON.parse(readFileSync(gridPath, 'utf8'));

  // Create request
  const request: Request = {
    task_id: taskId,
    domain: Domain.GRID_2D,
    inputs: [],
    outputs: [],
    budgets: DEFAULT_BUDGETS,
    run_config: {}
  };

  // Run task
  const taskRootPath = taskRoot || join(process.cwd(), 'tmp', 'tasks');
  const summary = await runTask(
    request,
    candidatePrograms,
    { grid: gridData.cells },
    taskRootPath
  );

  console.log('Task run complete:');
  console.log(`  ok: ${summary.ok}`);
  console.log(`  candidates_evaluated: ${summary.candidates_evaluated}`);
  console.log(`  candidates_eligible: ${summary.candidates_eligible}`);
  if (summary.ok && summary.winner_program_id) {
    console.log(`  winner: ${summary.winner_program_id}`);
    console.log(`  cost: ${summary.winner_result?.cost_breakdown.total_cost}`);
  } else {
    console.log(`  failure_reason: ${summary.failure_reason}`);
  }
  console.log('---');
  console.log(`Artifacts written to: task_${taskId}/`);
}

// CLI
const taskId = process.argv[2] || `task_${Date.now()}`;
const fixturesDir = process.argv[3];
const taskRoot = process.argv[4];

runTaskScript(taskId, fixturesDir, taskRoot).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});























