#!/usr/bin/env node
/**
 * Vault Hygiene Script
 * 
 * Runs vault hygiene job.
 * 
 * Usage: npm run vault:hygiene [-- --vault-root ./vault]
 */

import { writeHygieneReport } from '../Hygiene';
import { writeCompatibilityMatrix } from '../CompatibilityMatrix';
import { writeMergeCandidatesReport } from '../DuplicateDetection';
import { applyAutoDeprecation } from '../AutoDeprecation';

const args = process.argv.slice(2);
const vaultRootArg = args.find(arg => arg.startsWith('--vault-root='));
const vaultRoot = vaultRootArg ? vaultRootArg.split('=')[1] : './vault';

async function main() {
  console.log(`Running vault hygiene job on: ${vaultRoot}`);

  try {
    // Run hygiene job
    console.log('Running hygiene scans...');
    const hygieneReport = await writeHygieneReport(vaultRoot);
    console.log('Hygiene report:', JSON.stringify(hygieneReport.summary, null, 2));

    // Generate compatibility matrix
    console.log('Generating compatibility matrix...');
    await writeCompatibilityMatrix(vaultRoot);
    console.log('Compatibility matrix generated');

    // Generate merge candidates
    console.log('Detecting merge candidates...');
    await writeMergeCandidatesReport(vaultRoot);
    console.log('Merge candidates report generated');

    // Apply auto-deprecation
    console.log('Applying auto-deprecation...');
    const deprecationResult = await applyAutoDeprecation(vaultRoot);
    console.log(`Deprecated: ${deprecationResult.deprecated.length}, Skipped: ${deprecationResult.skipped.length}`);

    console.log('Hygiene job completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Hygiene job failed:', error);
    process.exit(1);
  }
}

main();























