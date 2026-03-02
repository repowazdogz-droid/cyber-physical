#!/usr/bin/env node
/**
 * Run Gate 1a (Grid 2D)
 * 
 * Runs the Gate 1a pipeline on a grid fixture.
 * 
 * Version: 1.0.0
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { RawGridInput } from '../src/domains/grid_2d/types';
import { FileReprStorage } from '../src/core/Storage';
import { TaskStorage } from '../src/storage/TaskStorage';
import { runGridPipeline } from '../src/domains/grid_2d/Pipeline';

async function runGate1aGrid(fixtureName: string, taskRoot?: string) {
  console.log(`Running Gate 1a (Grid 2D) on fixture: ${fixtureName}`);
  console.log('---');

  // Load fixture
  const fixturePath = join(process.cwd(), 'fixtures', 'grids', `${fixtureName}.json`);
  const gridInput: RawGridInput = JSON.parse(readFileSync(fixturePath, 'utf8'));

  console.log('Input grid:');
  console.log(JSON.stringify(gridInput, null, 2));
  console.log('---');

  // Create storage
  const vaultRoot = taskRoot || join(process.cwd(), 'tmp', 'artifacts');
  const storage = new FileReprStorage(vaultRoot);
  const taskStorage = new TaskStorage(taskRoot || join(process.cwd(), 'tmp', 'tasks'));

  // Run pipeline
  const taskId = `gate1a_${fixtureName}_${Date.now()}`;
  const result = await runGridPipeline(gridInput, storage, taskId);

  if (!result.ok) {
    console.error('Pipeline failed:');
    if (result.parseError) {
      console.error(`  Parse error: ${result.parseError}`);
    }
    if (result.validation && !result.validation.ok) {
      console.error(`  Validation errors:`);
      result.validation.errors.forEach((err: string) => console.error(`    - ${err}`));
    }
    if (result.storageError) {
      console.error(`  Storage error: ${result.storageError}`);
    }
    process.exit(1);
  }

  console.log('Pipeline succeeded!');
  console.log(`  repr_id: ${result.repr_id}`);
  console.log(`  nodes: ${result.repr?.nodes.length}`);
  console.log(`  edges: ${result.repr?.edges.length}`);
  console.log('---');

  // Store task structure
  await taskStorage.storeTask(taskId, gridInput, result.repr!);

  console.log(`Task stored: task_${taskId}`);
  console.log(`To replay: tsx scripts/replay-task.ts ${taskId}`);
}

// CLI
const fixtureName = process.argv[2] || 'single_color';
const taskRoot = process.argv[3];

runGate1aGrid(fixtureName, taskRoot).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});























