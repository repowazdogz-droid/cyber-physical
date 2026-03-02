/**
 * Tests for Diff Engine.
 * Ensures: outcome change → critical, claim change severity rules, stable ordering, bounding.
 */

import { diffSummaries } from '../DiffEngine';
import { Summary } from '../RegressionTypes';

describe('Diff Engine', () => {
  test('outcome change → critical', () => {
    const expected: Summary = {
      outcome: 'S1 (High)',
      claimIds: [],
      policyNotes: [],
      highlights: []
    };

    const actual: Summary = {
      outcome: 'S3 (Medium)',
      claimIds: [],
      policyNotes: [],
      highlights: []
    };

    const findings = diffSummaries(expected, actual);

    expect(findings.length).toBeGreaterThan(0);
    expect(findings.some(f => f.severity === 'critical' && f.path === 'outcome')).toBe(true);
  });

  test('claim change severity rules', () => {
    const expected: Summary = {
      outcome: 'S1 (High)',
      claimIds: ['claim-1', 'claim-2'],
      policyNotes: [],
      highlights: []
    };

    const actual: Summary = {
      outcome: 'S1 (High)',
      claimIds: ['claim-1', 'claim-3'], // claim-2 removed, claim-3 added
      policyNotes: [],
      highlights: []
    };

    const findings = diffSummaries(expected, actual);

    const removedFinding = findings.find(f => f.path === 'claimIds[-]' && f.before === 'claim-2');
    const addedFinding = findings.find(f => f.path === 'claimIds[+]' && f.after === 'claim-3');

    expect(removedFinding).toBeDefined();
    expect(removedFinding?.severity).toBe('critical'); // Removed claims are critical

    expect(addedFinding).toBeDefined();
    expect(addedFinding?.severity).toBe('warn'); // Added claims are warn
  });

  test('policy notes changed → warn', () => {
    const expected: Summary = {
      outcome: 'S1 (High)',
      claimIds: [],
      policyNotes: ['Note 1'],
      highlights: []
    };

    const actual: Summary = {
      outcome: 'S1 (High)',
      claimIds: [],
      policyNotes: ['Note 2'],
      highlights: []
    };

    const findings = diffSummaries(expected, actual);

    expect(findings.some(f => f.severity === 'warn' && f.path.includes('policyNotes'))).toBe(true);
  });

  test('highlights changed → info', () => {
    const expected: Summary = {
      outcome: 'S1 (High)',
      claimIds: [],
      policyNotes: [],
      highlights: ['Highlight 1']
    };

    const actual: Summary = {
      outcome: 'S1 (High)',
      claimIds: [],
      policyNotes: [],
      highlights: ['Highlight 2']
    };

    const findings = diffSummaries(expected, actual);

    expect(findings.some(f => f.severity === 'info' && f.path.includes('highlights'))).toBe(true);
  });

  test('manifest hash changed → warn + file hashes', () => {
    const expected: Summary = {
      outcome: 'S1 (High)',
      claimIds: [],
      policyNotes: [],
      highlights: [],
      manifestHash: 'hash1',
      fileHashes: [
        { name: 'file1.json', sha256: 'hash1' },
        { name: 'file2.json', sha256: 'hash2' }
      ]
    };

    const actual: Summary = {
      outcome: 'S1 (High)',
      claimIds: [],
      policyNotes: [],
      highlights: [],
      manifestHash: 'hash2',
      fileHashes: [
        { name: 'file1.json', sha256: 'hash1-changed' },
        { name: 'file2.json', sha256: 'hash2' }
      ]
    };

    const findings = diffSummaries(expected, actual);

    expect(findings.some(f => f.severity === 'warn' && f.path === 'manifestHash')).toBe(true);
    expect(findings.some(f => f.path === 'files[file1.json]')).toBe(true);
  });

  test('bounding (max findings)', () => {
    const expected: Summary = {
      outcome: 'S1 (High)',
      claimIds: Array.from({ length: 100 }, (_, i) => `claim-${i}`),
      policyNotes: [],
      highlights: []
    };

    const actual: Summary = {
      outcome: 'S1 (High)',
      claimIds: [],
      policyNotes: [],
      highlights: []
    };

    const findings = diffSummaries(expected, actual);

    expect(findings.length).toBeLessThanOrEqual(50); // MAX_FINDINGS
  });
});








































