#!/usr/bin/env node
/**
 * Replay Task (Orchestrator)
 * 
 * Replays a task run deterministically.
 * 
 * Version: 1.0.0
 */

import { replayTask } from '../src/orchestrator/v0/Replay';

async function replayTaskScript(taskId: string, taskRoot?: string) {
  console.log(`Replaying task: ${taskId}`);
  console.log('---');

  const taskRootPath = taskRoot || join(process.cwd(), 'tmp', 'tasks');
  const result = await replayTask(taskId, taskRootPath);

  if (!result.ok) {
    console.error(`ERROR: ${result.error}`);
    process.exit(1);
  }

  console.log('Replay successful!');
  console.log(`  ok: ${result.summary?.ok}`);
  if (result.summary?.winner_program_id) {
    console.log(`  winner: ${result.summary.winner_program_id}`);
  }
}

// CLI
import { join } from 'path';

const taskId = process.argv[2];
if (!taskId) {
  console.error('Usage: tsx scripts/replay-task-orchestrator.ts <task_id> [task_root]');
  process.exit(1);
}

const taskRoot = process.argv[3];
replayTaskScript(taskId, taskRoot).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});























