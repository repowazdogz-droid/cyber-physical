/**
 * Diff Engine
 * 
 * Compares summaries and produces diff findings.
 * Deterministic, bounded, ND-first.
 * 
 * Version: 1.0.0
 */

import { Summary, DiffFinding, MAX_FINDINGS, MAX_FIELD_LENGTH } from './RegressionTypes';

/**
 * Bounds a string to max length.
 */
function boundString(text: string, maxLen: number): string {
  if (typeof text !== 'string') return String(text);
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + '...';
}

/**
 * Compares two arrays and returns differences.
 */
function diffArrays(
  before: string[],
  after: string[],
  path: string
): DiffFinding[] {
  const findings: DiffFinding[] = [];
  const beforeSet = new Set(before);
  const afterSet = new Set(after);

  // Added items
  for (const item of after) {
    if (!beforeSet.has(item)) {
      findings.push({
        severity: 'warn',
        path: `${path}[+]`,
        before: '',
        after: boundString(item, MAX_FIELD_LENGTH),
        hint: 'Item added'
      });
    }
  }

  // Removed items
  for (const item of before) {
    if (!afterSet.has(item)) {
      findings.push({
        severity: 'warn',
        path: `${path}[-]`,
        before: boundString(item, MAX_FIELD_LENGTH),
        after: '',
        hint: 'Item removed'
      });
    }
  }

  return findings;
}

/**
 * Diffs two summaries.
 */
export function diffSummaries(expected: Summary, actual: Summary): DiffFinding[] {
  const findings: DiffFinding[] = [];

  // Outcome changed (critical)
  if (expected.outcome !== actual.outcome) {
    findings.push({
      severity: 'critical',
      path: 'outcome',
      before: boundString(expected.outcome, MAX_FIELD_LENGTH),
      after: boundString(actual.outcome, MAX_FIELD_LENGTH),
      hint: 'Outcome changed - this is a breaking change'
    });
  }

  // Claim set changed
  const claimDiffs = diffArrays(expected.claimIds, actual.claimIds, 'claimIds');
  for (const diff of claimDiffs) {
    // Critical if claim removed, warn if added
    diff.severity = diff.before ? 'critical' : 'warn';
    findings.push(diff);
  }

  // Policy notes changed (warn)
  const policyDiffs = diffArrays(expected.policyNotes, actual.policyNotes, 'policyNotes');
  for (const diff of policyDiffs) {
    diff.severity = 'warn';
    findings.push(diff);
  }

  // Highlights changed (info/warn)
  const highlightDiffs = diffArrays(expected.highlights, actual.highlights, 'highlights');
  for (const diff of highlightDiffs) {
    diff.severity = 'info';
    findings.push(diff);
  }

  // Manifest hash changed (warn) + show which files changed
  if (expected.manifestHash && actual.manifestHash && expected.manifestHash !== actual.manifestHash) {
    findings.push({
      severity: 'warn',
      path: 'manifestHash',
      before: boundString(expected.manifestHash.substring(0, 16), MAX_FIELD_LENGTH),
      after: boundString(actual.manifestHash.substring(0, 16), MAX_FIELD_LENGTH),
      hint: 'Manifest hash changed - check file hashes below'
    });

    // Compare file hashes
    const expectedFiles = new Map(
      (expected.fileHashes || []).map(f => [f.name, f.sha256])
    );
    const actualFiles = new Map(
      (actual.fileHashes || []).map(f => [f.name, f.sha256])
    );

    // Files changed
    for (const [name, expectedHash] of expectedFiles.entries()) {
      const actualHash = actualFiles.get(name);
      if (actualHash && actualHash !== expectedHash) {
        findings.push({
          severity: 'warn',
          path: `files[${name}]`,
          before: boundString(expectedHash.substring(0, 16), MAX_FIELD_LENGTH),
          after: boundString(actualHash.substring(0, 16), MAX_FIELD_LENGTH),
          hint: 'File hash changed'
        });
      }
    }

    // Files added
    for (const [name, actualHash] of actualFiles.entries()) {
      if (!expectedFiles.has(name)) {
        findings.push({
          severity: 'info',
          path: `files[${name}][+]`,
          before: '',
          after: boundString(actualHash.substring(0, 16), MAX_FIELD_LENGTH),
          hint: 'File added'
        });
      }
    }

    // Files removed
    for (const [name, expectedHash] of expectedFiles.entries()) {
      if (!actualFiles.has(name)) {
        findings.push({
          severity: 'warn',
          path: `files[${name}][-]`,
          before: boundString(expectedHash.substring(0, 16), MAX_FIELD_LENGTH),
          after: '',
          hint: 'File removed'
        });
      }
    }
  }

  // Bound findings
  return findings.slice(0, MAX_FINDINGS);
}








































