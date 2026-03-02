/**
 * Tests for Report Writers.
 * Ensures: deterministic output, bounds enforced, ordering stable, no internal markers.
 */

import { writeGoldenJsonReport, writeGoldenMarkdownSummary } from '../ReportWriters';
import { GoldenSuiteResult, ReplayResultSummary, DiffFinding } from '../RegressionTypes';
import { readFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const TEST_OUT_DIR = join(__dirname, '..', '..', '..', '.test-regression-out');

describe('Report Writers', () => {
  beforeEach(async () => {
    // Clean up test directory
    if (existsSync(TEST_OUT_DIR)) {
      try {
        await unlink(join(TEST_OUT_DIR, 'golden_report.json'));
        await unlink(join(TEST_OUT_DIR, 'golden_summary.md'));
      } catch {
        // Ignore
      }
    } else {
      await mkdir(TEST_OUT_DIR, { recursive: true });
    }
  });

  afterEach(async () => {
    // Clean up test files
    try {
      if (existsSync(join(TEST_OUT_DIR, 'golden_report.json'))) {
        await unlink(join(TEST_OUT_DIR, 'golden_report.json'));
      }
      if (existsSync(join(TEST_OUT_DIR, 'golden_summary.md'))) {
        await unlink(join(TEST_OUT_DIR, 'golden_summary.md'));
      }
    } catch {
      // Ignore
    }
  });

  test('writeGoldenJsonReport produces deterministic output', async () => {
    const result: GoldenSuiteResult = {
      ok: true,
      totalCases: 2,
      passedCases: 2,
      failedCases: 0,
      criticalCount: 0,
      warnCount: 0,
      infoCount: 0,
      results: [
        {
          artifactId: 'artifact-1',
          label: 'Case A',
          ok: true,
          findings: []
        },
        {
          artifactId: 'artifact-2',
          label: 'Case B',
          ok: true,
          findings: []
        }
      ]
    };

    const fixedTimestamp = '2024-01-01T00:00:00.000Z';

    const path1 = await writeGoldenJsonReport(result, TEST_OUT_DIR, { generatedAtIso: fixedTimestamp });
    const content1 = await readFile(path1, 'utf-8');

    // Write again with same timestamp
    const path2 = await writeGoldenJsonReport(result, TEST_OUT_DIR, { generatedAtIso: fixedTimestamp });
    const content2 = await readFile(path2, 'utf-8');

    expect(content1).toBe(content2);
  });

  test('writeGoldenMarkdownSummary enforces line cap', async () => {
    // Create result with many cases to exceed line cap
    const results: ReplayResultSummary[] = Array.from({ length: 50 }, (_, i) => ({
      artifactId: `artifact-${i}`,
      label: `Case ${i}`,
      ok: false,
      findings: Array.from({ length: 20 }, (_, j) => ({
        severity: 'warn' as const,
        path: `path.${j}`,
        before: `before-${j}`,
        after: `after-${j}`,
        hint: `hint-${j}`
      }))
    }));

    const result: GoldenSuiteResult = {
      ok: false,
      totalCases: 50,
      passedCases: 0,
      failedCases: 50,
      criticalCount: 0,
      warnCount: 1000,
      infoCount: 0,
      results
    };

    const path = await writeGoldenMarkdownSummary(result, TEST_OUT_DIR);
    const content = await readFile(path, 'utf-8');
    const lines = content.split('\n');

    // Should be capped at 200 lines
    expect(lines.length).toBeLessThanOrEqual(200);
    expect(content).toContain('truncated');
  });

  test('writeGoldenMarkdownSummary orders cases by label', async () => {
    const result: GoldenSuiteResult = {
      ok: true,
      totalCases: 3,
      passedCases: 3,
      failedCases: 0,
      criticalCount: 0,
      warnCount: 0,
      infoCount: 0,
      results: [
        {
          artifactId: 'artifact-c',
          label: 'Case C',
          ok: true,
          findings: []
        },
        {
          artifactId: 'artifact-a',
          label: 'Case A',
          ok: true,
          findings: []
        },
        {
          artifactId: 'artifact-b',
          label: 'Case B',
          ok: true,
          findings: []
        }
      ]
    };

    const path = await writeGoldenMarkdownSummary(result, TEST_OUT_DIR);
    const content = await readFile(path, 'utf-8');

    // Should be ordered: A, B, C
    const indexA = content.indexOf('Case A');
    const indexB = content.indexOf('Case B');
    const indexC = content.indexOf('Case C');

    expect(indexA).toBeLessThan(indexB);
    expect(indexB).toBeLessThan(indexC);
  });

  test('writeGoldenMarkdownSummary orders findings by severity then path', async () => {
    const result: GoldenSuiteResult = {
      ok: false,
      totalCases: 1,
      passedCases: 0,
      failedCases: 1,
      criticalCount: 1,
      warnCount: 1,
      infoCount: 1,
      results: [
        {
          artifactId: 'artifact-1',
          label: 'Case 1',
          ok: false,
          findings: [
            {
              severity: 'info',
              path: 'path.z',
              before: 'before',
              after: 'after',
              hint: 'hint'
            },
            {
              severity: 'critical',
              path: 'path.a',
              before: 'before',
              after: 'after',
              hint: 'hint'
            },
            {
              severity: 'warn',
              path: 'path.m',
              before: 'before',
              after: 'after',
              hint: 'hint'
            }
          ]
        }
      ]
    };

    const path = await writeGoldenMarkdownSummary(result, TEST_OUT_DIR);
    const content = await readFile(path, 'utf-8');

    // Should be ordered: critical, warn, info
    const indexCritical = content.indexOf('CRITICAL');
    const indexWarn = content.indexOf('WARN');
    const indexInfo = content.indexOf('INFO');

    expect(indexCritical).toBeLessThan(indexWarn);
    expect(indexWarn).toBeLessThan(indexInfo);
  });

  test('writeGoldenMarkdownSummary strips internal markers', async () => {
    const result: GoldenSuiteResult = {
      ok: false,
      totalCases: 1,
      passedCases: 0,
      failedCases: 1,
      criticalCount: 0,
      warnCount: 1,
      infoCount: 0,
      results: [
        {
          artifactId: 'artifact-1',
          label: 'Case 1 [INTERNAL]',
          ok: false,
          findings: [
            {
              severity: 'warn',
              path: 'path[SYSTEM]',
              before: 'before[DEBUG]',
              after: 'after',
              hint: 'hint'
            }
          ]
        }
      ]
    };

    const path = await writeGoldenMarkdownSummary(result, TEST_OUT_DIR);
    const content = await readFile(path, 'utf-8');

    // Should not contain internal markers
    expect(content).not.toContain('[INTERNAL]');
    expect(content).not.toContain('[SYSTEM]');
    expect(content).not.toContain('[DEBUG]');
  });

  test('writeGoldenJsonReport bounds results to max 50', async () => {
    const results: ReplayResultSummary[] = Array.from({ length: 60 }, (_, i) => ({
      artifactId: `artifact-${i}`,
      label: `Case ${i}`,
      ok: true,
      findings: []
    }));

    const result: GoldenSuiteResult = {
      ok: true,
      totalCases: 60,
      passedCases: 60,
      failedCases: 0,
      criticalCount: 0,
      warnCount: 0,
      infoCount: 0,
      results
    };

    const path = await writeGoldenJsonReport(result, TEST_OUT_DIR);
    const content = await readFile(path, 'utf-8');
    const parsed = JSON.parse(content);

    // Should be bounded to 50
    expect(parsed.results.length).toBeLessThanOrEqual(50);
  });
});




