#!/usr/bin/env node
/**
 * Replay Script
 * 
 * Manual replay script for Gate 1a.
 * Retrieves stored representation and validates it.
 * 
 * Version: 1.0.0
 */

import { FileReprStorage } from '../src/core/Storage';
import { validateSchema } from '../src/core/SchemaValidator';
import { hashRepr } from '../src/core/Hasher';

async function replay(reprId: string, vaultRoot?: string) {
  console.log(`Replaying representation: ${reprId}`);
  console.log('---');

  const storage = new FileReprStorage(vaultRoot);
  
  // Retrieve
  const repr = await storage.retrieve(reprId);
  if (!repr) {
    console.error(`ERROR: Representation not found: ${reprId}`);
    process.exit(1);
  }

  console.log(`Retrieved representation:`);
  console.log(`  repr_id: ${repr.repr_id}`);
  console.log(`  graph_type: ${repr.graph_type}`);
  console.log(`  nodes: ${repr.nodes.length}`);
  console.log(`  edges: ${repr.edges.length}`);
  console.log(`  meta.version: ${repr.meta.version}`);
  console.log(`  meta.parser_version: ${repr.meta.parser_version}`);
  console.log(`  meta.created_at_iso: ${repr.meta.created_at_iso}`);
  console.log('---');

  // Verify hash
  const computedHash = hashRepr(repr);
  if (computedHash !== repr.repr_id) {
    console.error(`ERROR: Hash mismatch!`);
    console.error(`  Expected: ${repr.repr_id}`);
    console.error(`  Computed: ${computedHash}`);
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
const reprId = process.argv[2];
if (!reprId) {
  console.error('Usage: tsx scripts/replay.ts <repr_id> [vault_root]');
  process.exit(1);
}

const vaultRoot = process.argv[3];
replay(reprId, vaultRoot).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});























