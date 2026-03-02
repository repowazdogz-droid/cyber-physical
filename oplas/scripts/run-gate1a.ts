#!/usr/bin/env node
/**
 * Run Gate 1a
 * 
 * Runs the Gate 1a pipeline on a hardcoded example task.
 * 
 * Version: 1.0.0
 */

import { RawInput } from '../src/core/ReprTypes';
import { FileReprStorage } from '../src/core/Storage';
import { runPipeline } from '../src/core/Pipeline';

/**
 * Hardcoded example task: Simple graph with 3 nodes and 2 edges.
 */
const exampleInput: RawInput = {
  type: 'graph',
  data: {
    nodes: [
      {
        id: 'a',
        type: 'circle',
        bbox: { x_min: 0, y_min: 0, x_max: 10, y_max: 10 },
        attrs: { color: 'red', size: 5 }
      },
      {
        id: 'b',
        type: 'square',
        bbox: { x_min: 20, y_min: 0, x_max: 30, y_max: 10 },
        attrs: { color: 'blue', size: 8 }
      },
      {
        id: 'c',
        type: 'circle',
        bbox: { x_min: 10, y_min: 10, x_max: 20, y_max: 20 },
        attrs: { color: 'green' }
      }
    ],
    edges: [
      {
        src: 'a',
        type: 'connects',
        dst: 'b',
        attrs: { weight: 1 }
      },
      {
        src: 'b',
        type: 'connects',
        dst: 'c',
        attrs: { weight: 2 }
      }
    ]
  }
};

async function runGate1a(vaultRoot?: string) {
  console.log('Running Gate 1a: Determinism Foundation');
  console.log('---');
  console.log('Input:');
  console.log(JSON.stringify(exampleInput, null, 2));
  console.log('---');

  const storage = new FileReprStorage(vaultRoot);
  const result = await runPipeline(exampleInput, storage);

  if (!result.ok) {
    console.error('Pipeline failed:');
    if (result.parseError) {
      console.error(`  Parse error: ${result.parseError}`);
    }
    if (result.validation && !result.validation.ok) {
      console.error(`  Validation errors:`);
      result.validation.errors.forEach(err => console.error(`    - ${err}`));
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
  console.log('Canonical representation:');
  console.log(JSON.stringify(result.repr, null, 2));
  console.log('---');
  console.log(`To replay: tsx scripts/replay.ts ${result.repr_id}`);
}

// CLI
const vaultRoot = process.argv[2];
runGate1a(vaultRoot).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});























