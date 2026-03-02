#!/usr/bin/env node

/**
 * Golden Suite CLI Runner
 * 
 * Runs golden suite and prints ND-calm report.
 * Exits non-zero if any critical findings.
 * 
 * Version: 1.0.0
 */

import { runGoldenSuite } from '../GoldenHarness';
import { getGoldenSuite } from '../golden/GoldenSuiteWriter';
import { writeGoldenJsonReport, writeGoldenMarkdownSummary } from '../ReportWriters';
import { join } from 'path';

interface CliOptions {
  outDir: string;
  format: 'json' | 'md' | 'both';
  failOn: 'warn' | 'critical';
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    outDir: './.regression-out',
    format: 'both',
    failOn: 'critical'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--outDir' && i + 1 < args.length) {
      options.outDir = args[i + 1];
      i++;
    } else if (arg === '--format' && i + 1 < args.length) {
      const format = args[i + 1];
      if (format === 'json' || format === 'md' || format === 'both') {
        options.format = format;
      }
      i++;
    } else if (arg === '--failOn' && i + 1 < args.length) {
      const failOn = args[i + 1];
      if (failOn === 'warn' || failOn === 'critical') {
        options.failOn = failOn;
      }
      i++;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();

  console.log('Running golden suite...\n');

  try {
    const cases = await getGoldenSuite();
    const result = await runGoldenSuite(cases);

    // Write reports
    if (options.format === 'json' || options.format === 'both') {
      const jsonPath = await writeGoldenJsonReport(result, options.outDir);
      console.log(`✅ JSON report written: ${jsonPath}`);
    }

    if (options.format === 'md' || options.format === 'both') {
      const mdPath = await writeGoldenMarkdownSummary(result, options.outDir);
      console.log(`✅ Markdown summary written: ${mdPath}`);
    }

    // Print summary
    console.log('\n=== Golden Suite Results ===');
    console.log(`Total cases: ${result.totalCases}`);
    console.log(`Passed: ${result.passedCases}`);
    console.log(`Failed: ${result.failedCases}`);
    console.log(`Critical findings: ${result.criticalCount}`);
    console.log(`Warning findings: ${result.warnCount}`);
    console.log(`Info findings: ${result.infoCount}`);
    console.log('');

    // Print per-case results (truncated for console)
    for (const caseResult of result.results.slice(0, 10)) {
      const status = caseResult.ok ? '✅' : '❌';
      console.log(`${status} ${caseResult.label} (${caseResult.artifactId})`);

      if (caseResult.error) {
        console.log(`  Error: ${caseResult.error}`);
      }

      if (caseResult.findings.length > 0) {
        console.log(`  Findings: ${caseResult.findings.length}`);
        for (const finding of caseResult.findings.slice(0, 3)) {
          const severityIcon = finding.severity === 'critical' ? '🔴' : finding.severity === 'warn' ? '🟡' : '🔵';
          console.log(`  ${severityIcon} ${finding.path}: ${finding.hint || 'Changed'}`);
        }
        if (caseResult.findings.length > 3) {
          console.log(`  ... and ${caseResult.findings.length - 3} more findings`);
        }
      }
      console.log('');
    }

    if (result.results.length > 10) {
      console.log(`... and ${result.results.length - 10} more cases (see report files)`);
      console.log('');
    }

    // Determine exit code
    let exitCode = 0;
    
    if (options.failOn === 'critical' && result.criticalCount > 0) {
      console.log('❌ Golden suite failed (critical findings detected)');
      exitCode = 2;
    } else if (options.failOn === 'warn' && (result.criticalCount > 0 || result.warnCount > 0)) {
      console.log('❌ Golden suite failed (warnings or critical findings detected)');
      exitCode = 3;
    } else {
      console.log('✅ Golden suite passed');
      exitCode = 0;
    }

    process.exit(exitCode);
  } catch (error: any) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
