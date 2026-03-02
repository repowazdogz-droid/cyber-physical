#!/usr/bin/env node
/**
 * Replay Task
 * 
 * Replays a stored task: regenerates repr from grid and verifies hash.
 * 
 * Version: 1.0.0
 */

import { join } from 'path';
import { TaskStorage } from '../src/storage/TaskStorage';
import { parseGrid } from '../src/domains/grid_2d/Parser';
import { canonicalizeGrid } from '../src/domains/grid_2d/Canonicalizer';
import { hashCanonical } from '../src/contracts/invariants/CanonicalHashing';
import { validateSchema } from '../src/core/SchemaValidator';

async function replayTask(taskId: string, taskRoot?: string) {
  console.log(`Replaying task: ${taskId}`);
  console.log('---');

  const taskStorage = new TaskStorage(taskRoot || join(process.cwd(), 'tmp', 'tasks'));
  
  // Retrieve stored task
  const stored = await taskStorage.getTask(taskId);
  if (!stored) {
    console.error(`ERROR: Task not found: ${taskId}`);
    process.exit(1);
  }

  console.log(`Retrieved task:`);
  console.log(`  Grid: ${stored.gridInput.cells.length}x${stored.gridInput.cells[0]?.length || 0}`);
  console.log(`  Stored hash: ${stored.hash}`);
  console.log('---');

  // Regenerate repr from grid
  const parseResult = parseGrid(stored.gridInput);
  if (!parseResult.ok || !parseResult.repr) {
    console.error(`ERROR: Parse failed: ${parseResult.error}`);
    process.exit(1);
  }

  let repr = parseResult.repr;
  repr = canonicalizeGrid(repr);
  repr.repr_id = hashCanonical(repr);

  console.log(`Regenerated repr:`);
  console.log(`  repr_id: ${repr.repr_id}`);
  console.log(`  nodes: ${repr.nodes.length}`);
  console.log(`  edges: ${repr.edges.length}`);
  console.log('---');

  // Verify hash
  if (repr.repr_id !== stored.hash) {
    console.error(`ERROR: Hash mismatch!`);
    console.error(`  Expected: ${stored.hash}`);
    console.error(`  Computed: ${repr.repr_id}`);
    process.exit(1);
  }
  console.log(`✓ Hash verification passed`);

  // Validate schema
  const validation = validateSchema(repr);
  if (!validation.ok) {
    console.error(`ERROR: Schema validation failed:`);
    validation.errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }
  console.log(`✓ Schema validation passed`);
  
  if (validation.warnings.length > 0) {
    console.log(`Warnings:`);
    validation.warnings.forEach(warn => console.log(`  - ${warn}`));
  }

  console.log('---');
  console.log('Replay successful!');
}

// CLI
const taskId = process.argv[2];
if (!taskId) {
  console.error('Usage: tsx scripts/replay-task.ts <task_id> [task_root]');
  process.exit(1);
}

const taskRoot = process.argv[3];
replayTask(taskId, taskRoot).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});























