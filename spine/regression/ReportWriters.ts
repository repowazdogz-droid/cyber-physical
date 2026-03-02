/**
 * Report Writers
 * 
 * Writes bounded, deterministic golden suite reports.
 * JSON and Markdown formats.
 * 
 * Version: 1.0.0
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { GoldenSuiteResult, ReplayResultSummary, DiffFinding } from './RegressionTypes';
import { MAX_FINDINGS } from './RegressionTypes';

/**
 * Maximum lines in markdown summary.
 */
const MAX_MARKDOWN_LINES = 200;

/**
 * Writes golden suite JSON report.
 */
export async function writeGoldenJsonReport(
  result: GoldenSuiteResult,
  outDir: string,
  opts?: { generatedAtIso?: string }
): Promise<string> {
  // Ensure output directory exists
  await mkdir(outDir, { recursive: true });

  // Bound results to max 50 cases
  const boundedResult: GoldenSuiteResult = {
    ...result,
    results: result.results.slice(0, 50)
  };

  // Bound findings per result
  const boundedResults = boundedResult.results.map(r => ({
    ...r,
    findings: r.findings.slice(0, MAX_FINDINGS)
  }));

  const generatedAtIso = opts?.generatedAtIso ?? new Date().toISOString();

  const report = {
    ...boundedResult,
    results: boundedResults,
    generatedAt: generatedAtIso,
    version: '1.0.0'
  };

  const filePath = join(outDir, 'golden_report.json');
  await writeFile(filePath, JSON.stringify(report, null, 2), 'utf-8');

  return filePath;
}

/**
 * Writes golden suite Markdown summary.
 * Bounded to max 200 lines, ND-calm, deterministic ordering.
 */
export async function writeGoldenMarkdownSummary(
  result: GoldenSuiteResult,
  outDir: string
): Promise<string> {
  // Ensure output directory exists
  await mkdir(outDir, { recursive: true });

  const lines: string[] = [];

  // Header
  lines.push('# Golden Suite Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');

  // Summary
  const statusIcon = result.ok ? '✅' : '❌';
  lines.push(`## Status: ${statusIcon} ${result.ok ? 'All Good' : 'Drift Detected'}`);
  lines.push('');
  lines.push(`- **Total Cases**: ${result.totalCases}`);
  lines.push(`- **Passed**: ${result.passedCases}`);
  lines.push(`- **Failed**: ${result.failedCases}`);
  lines.push(`- **Critical Findings**: ${result.criticalCount}`);
  lines.push(`- **Warning Findings**: ${result.warnCount}`);
  lines.push(`- **Info Findings**: ${result.infoCount}`);
  lines.push('');

  // Per-case results (sorted by label for deterministic ordering)
  const sortedResults = [...result.results].sort((a, b) => a.label.localeCompare(b.label));

  for (const caseResult of sortedResults) {
    if (lines.length >= MAX_MARKDOWN_LINES - 10) {
      lines.push('');
      lines.push('---');
      lines.push('');
      lines.push('*Report truncated (max 200 lines)*');
      break;
    }

    const caseIcon = caseResult.ok ? '✅' : '❌';
    lines.push(`### ${caseIcon} ${stripInternalMarkers(caseResult.label)}`);
    lines.push('');
    lines.push(`**Artifact ID**: \`${stripInternalMarkers(caseResult.artifactId)}\``);
    lines.push('');

    if (caseResult.error) {
      lines.push(`**Error**: ${stripInternalMarkers(caseResult.error)}`);
      lines.push('');
    }

    if (caseResult.findings.length > 0) {
      // Sort findings by severity (critical > warn > info) then by path
      const sortedFindings = [...caseResult.findings].sort((a, b) => {
        const severityOrder = { critical: 0, warn: 1, info: 2 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return a.path.localeCompare(b.path);
      });

      lines.push(`**Findings** (${caseResult.findings.length}):`);
      lines.push('');

      for (const finding of sortedFindings.slice(0, 10)) {
        if (lines.length >= MAX_MARKDOWN_LINES - 5) {
          lines.push('');
          lines.push('*Findings truncated*');
          break;
        }

        const severityIcon = finding.severity === 'critical' ? '🔴' : finding.severity === 'warn' ? '🟡' : '🔵';
        lines.push(`- ${severityIcon} **${finding.severity.toUpperCase()}**: \`${stripInternalMarkers(finding.path)}\``);
        
        if (finding.hint) {
          lines.push(`  - *${stripInternalMarkers(finding.hint)}*`);
        }
        
        if (finding.before) {
          lines.push(`  - Before: \`${stripInternalMarkers(finding.before)}\``);
        }
        
        if (finding.after) {
          lines.push(`  - After: \`${stripInternalMarkers(finding.after)}\``);
        }
      }

      if (caseResult.findings.length > 10) {
        lines.push(`- ... and ${caseResult.findings.length - 10} more findings`);
      }

      lines.push('');
    } else if (caseResult.ok) {
      lines.push('✅ No findings - expected and actual match.');
      lines.push('');
    }
  }

  // Ensure we don't exceed max lines (hard cap at 200)
  if (lines.length > MAX_MARKDOWN_LINES) {
    lines.splice(MAX_MARKDOWN_LINES);
    lines[MAX_MARKDOWN_LINES - 1] = '*Report truncated (max 200 lines)*';
  }

  const filePath = join(outDir, 'golden_summary.md');
  await writeFile(filePath, lines.join('\n'), 'utf-8');

  return filePath;
}

/**
 * Strips internal/system markers from text (for markdown safety).
 */
function stripInternalMarkers(text: string): string {
  return text
    .replace(/\[INTERNAL\]/g, '')
    .replace(/\[SYSTEM\]/g, '')
    .replace(/\[DEBUG\]/g, '')
    .trim();
}

