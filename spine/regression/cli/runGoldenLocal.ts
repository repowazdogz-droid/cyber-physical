#!/usr/bin/env node

/**
 * Golden Suite Local Runner (Convenience)
 * 
 * Runs golden suite with default settings for local dev.
 * 
 * Version: 1.0.0
 */

import { runGoldenSuite } from '../GoldenHarness';
import { getGoldenSuite } from '../golden/GoldenSuiteWriter';
import { writeGoldenJsonReport, writeGoldenMarkdownSummary } from '../ReportWriters';
import { join } from 'path';

async function main() {
  const outDir = './.regression-out';

  console.log('Running golden suite (local dev mode)...\n');

  try {
    const cases = await getGoldenSuite();
    const result = await runGoldenSuite(cases);

    // Write reports
    const jsonPath = await writeGoldenJsonReport(result, outDir);
    const mdPath = await writeGoldenMarkdownSummary(result, outDir);

    console.log(`✅ Reports written:`);
    console.log(`   - ${jsonPath}`);
    console.log(`   - ${mdPath}`);
    console.log('');

    // Print summary
    console.log('=== Golden Suite Results ===');
    console.log(`Total cases: ${result.totalCases}`);
    console.log(`Passed: ${result.passedCases}`);
    console.log(`Failed: ${result.failedCases}`);
    console.log(`Critical findings: ${result.criticalCount}`);
    console.log(`Warning findings: ${result.warnCount}`);
    console.log(`Info findings: ${result.infoCount}`);
    console.log('');

    if (result.ok) {
      console.log('✅ Golden suite passed');
      process.exit(0);
    } else {
      console.log('❌ Golden suite failed (see reports for details)');
      process.exit(2);
    }
  } catch (error: any) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});








































