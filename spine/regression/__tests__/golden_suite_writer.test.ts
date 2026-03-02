/**
 * Tests for Golden Suite Writer.
 * Ensures: deterministic ordering, no duplicates, bounded writes.
 */

import { addGoldenCase, removeGoldenCase, readGoldenSuite, writeGoldenSuite, setGoldenSuitePath } from '../golden/GoldenSuiteWriter';
import { GoldenCase } from '../RegressionTypes';
import { readFile, writeFile, unlink } from 'fs/promises';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'path';

describe('Golden Suite Writer', () => {
  let tmpDir: string;
  let testSuitePath: string;

  beforeEach(async () => {
    // Create temp directory for each test
    tmpDir = mkdtempSync(join(tmpdir(), 'goldens-'));
    testSuitePath = join(tmpDir, 'GOLDEN_SUITE.json');
    setGoldenSuitePath(testSuitePath);
  });

  afterEach(async () => {
    // Clean up temp directory after each test
    try {
      await unlink(testSuitePath);
    } catch {
      // Ignore
    }
  });

  test('writes golden suite with deterministic ordering', async () => {
    const cases: GoldenCase[] = [
      {
        artifactId: 'artifact-c',
        label: 'Case C',
        expected: {
          outcome: 'C',
          claimIds: [],
          policyNotes: [],
          highlights: []
        }
      },
      {
        artifactId: 'artifact-a',
        label: 'Case A',
        expected: {
          outcome: 'A',
          claimIds: [],
          policyNotes: [],
          highlights: []
        }
      },
      {
        artifactId: 'artifact-b',
        label: 'Case B',
        expected: {
          outcome: 'B',
          claimIds: [],
          policyNotes: [],
          highlights: []
        }
      }
    ];

    // Temporarily override path for test
    const originalRead = readGoldenSuite;
    const originalWrite = writeGoldenSuite;

    // Write cases
    await writeGoldenSuite(cases);

    // Read back
    const readCases = await readGoldenSuite();

    // Should be sorted by label
    expect(readCases[0].label).toBe('Case A');
    expect(readCases[1].label).toBe('Case B');
    expect(readCases[2].label).toBe('Case C');
  });

  test('removes duplicates by artifactId', async () => {
    const cases: GoldenCase[] = [
      {
        artifactId: 'artifact-1',
        label: 'Case 1',
        expected: {
          outcome: '1',
          claimIds: [],
          policyNotes: [],
          highlights: []
        }
      },
      {
        artifactId: 'artifact-1', // Duplicate
        label: 'Case 1 Duplicate',
        expected: {
          outcome: '1',
          claimIds: [],
          policyNotes: [],
          highlights: []
        }
      },
      {
        artifactId: 'artifact-2',
        label: 'Case 2',
        expected: {
          outcome: '2',
          claimIds: [],
          policyNotes: [],
          highlights: []
        }
      }
    ];

    await writeGoldenSuite(cases);
    const readCases = await readGoldenSuite();

    // Should have only 2 cases (duplicate removed)
    expect(readCases.length).toBe(2);
    expect(readCases.find(c => c.artifactId === 'artifact-1')?.label).toBe('Case 1');
  });

  test('bounds to max 50 cases', async () => {
    const cases: GoldenCase[] = Array.from({ length: 60 }, (_, i) => ({
      artifactId: `artifact-${i}`,
      label: `Case ${i}`,
      expected: {
        outcome: `${i}`,
        claimIds: [],
        policyNotes: [],
        highlights: []
      }
    }));

    await writeGoldenSuite(cases);
    const readCases = await readGoldenSuite();

    // Should be bounded to 50
    expect(readCases.length).toBeLessThanOrEqual(50);
  });

  test('addGoldenCase adds new case', async () => {
    const newCase: GoldenCase = {
      artifactId: 'new-artifact',
      label: 'New Case',
      expected: {
        outcome: 'NEW',
        claimIds: [],
        policyNotes: [],
        highlights: []
      }
    };

    const result = await addGoldenCase(newCase);

    expect(result.ok).toBe(true);
    expect(result.message).toContain('Added golden case');

    const cases = await readGoldenSuite();
    expect(cases.some(c => c.artifactId === 'new-artifact')).toBe(true);
  });

  test('addGoldenCase rejects duplicate artifactId', async () => {
    const case1: GoldenCase = {
      artifactId: 'duplicate',
      label: 'Case 1',
      expected: {
        outcome: '1',
        claimIds: [],
        policyNotes: [],
        highlights: []
      }
    };

    const case2: GoldenCase = {
      artifactId: 'duplicate',
      label: 'Case 2',
      expected: {
        outcome: '2',
        claimIds: [],
        policyNotes: [],
        highlights: []
      }
    };

    await addGoldenCase(case1);
    const result = await addGoldenCase(case2);

    expect(result.ok).toBe(false);
    expect(result.message).toContain('already exists');
  });

  test('removeGoldenCase removes case', async () => {
    const case_: GoldenCase = {
      artifactId: 'to-remove',
      label: 'To Remove',
      expected: {
        outcome: 'REMOVE',
        claimIds: [],
        policyNotes: [],
        highlights: []
      }
    };

    await addGoldenCase(case_);
    const result = await removeGoldenCase('to-remove');

    expect(result.ok).toBe(true);
    expect(result.message).toContain('Removed golden case');

    const cases = await readGoldenSuite();
    expect(cases.some(c => c.artifactId === 'to-remove')).toBe(false);
  });

  test('removeGoldenCase fails if case not found', async () => {
    const result = await removeGoldenCase('nonexistent');

    expect(result.ok).toBe(false);
    expect(result.message).toContain('not found');
  });
});




