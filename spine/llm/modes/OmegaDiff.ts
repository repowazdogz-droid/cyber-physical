// spine/llm/modes/OmegaDiff.ts

import type { OmegaGoldenResult } from "./OmegaGoldenRunner";
import { omegaGIsWellFormed } from "./OmegaGShape";

export type OmegaDiffResult = {
  passed: boolean;
  errors: string[];
  warnings: string[];
  driftRatio?: number;
  linesChanged?: number;
};

/**
 * Normalize text for comparison (collapse whitespace, lowercase)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Compute Levenshtein distance ratio (0-1, where 1 = identical)
 */
function levenshteinRatio(a: string, b: string): number {
  const normalizedA = normalizeText(a);
  const normalizedB = normalizeText(b);

  if (normalizedA === normalizedB) return 1.0;
  if (normalizedA.length === 0 || normalizedB.length === 0) return 0.0;

  const matrix: number[][] = [];
  const lenA = normalizedA.length;
  const lenB = normalizedB.length;

  for (let i = 0; i <= lenA; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= lenB; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = normalizedA[i - 1] === normalizedB[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[lenA][lenB];
  const maxLen = Math.max(lenA, lenB);
  return 1 - distance / maxLen;
}

/**
 * Compute line-based diff stats
 */
function computeLineDiff(actual: string, expected: string): {
  linesChanged: number;
  totalLines: number;
  changeRatio: number;
} {
  const actualLines = actual.split("\n").filter((l) => l.trim().length > 0);
  const expectedLines = expected.split("\n").filter((l) => l.trim().length > 0);

  const totalLines = Math.max(actualLines.length, expectedLines.length);
  let linesChanged = 0;

  const maxLen = Math.max(actualLines.length, expectedLines.length);
  for (let i = 0; i < maxLen; i++) {
    const actualLine = normalizeText(actualLines[i] || "");
    const expectedLine = normalizeText(expectedLines[i] || "");
    if (actualLine !== expectedLine) {
      linesChanged++;
    }
  }

  return {
    linesChanged,
    totalLines,
    changeRatio: totalLines > 0 ? linesChanged / totalLines : 0,
  };
}

/**
 * Check if required sections are present
 */
function checkRequiredSections(
  text: string,
  requiredSections: string[]
): boolean {
  const normalizedText = normalizeText(text);
  return requiredSections.every((section) =>
    normalizedText.includes(normalizeText(section))
  );
}

/**
 * Check if forbidden tokens are absent
 */
function checkForbiddenTokens(
  text: string,
  forbiddenTokens: string[]
): boolean {
  const normalizedText = normalizeText(text);
  return !forbiddenTokens.some((token) =>
    normalizedText.includes(normalizeText(token))
  );
}

/**
 * Compare actual result against expected snapshot and case expectations
 */
export function diffOmegaGolden(
  actual: OmegaGoldenResult,
  expected: OmegaGoldenResult | null,
  testCase: {
    expect: {
      auditOk: boolean;
      shapeOk?: boolean;
      requiredSections?: string[];
      forbiddenTokens?: string[];
    };
  },
  snapshotResults?: OmegaGoldenResult[] | null
): OmegaDiffResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Hard failures: audit violations
  if (!actual.audit.ok) {
    errors.push(
      `Audit failed: violations [${actual.audit.violations.join(", ")}]`
    );
  }

  // Hard failures: G-mode shape violations
  if (actual.mode === "G") {
    if (!omegaGIsWellFormed(actual.text)) {
      errors.push("OMEGA-G shape invalid: missing required headings or structure");
    }
    if (testCase.expect.shapeOk && !omegaGIsWellFormed(actual.text)) {
      errors.push("OMEGA-G shape validation failed (expected shapeOk: true)");
    }
  }

  // Hard failures: required sections missing
  if (testCase.expect.requiredSections) {
    if (!checkRequiredSections(actual.text, testCase.expect.requiredSections)) {
      const missing = testCase.expect.requiredSections.filter(
        (s) => !normalizeText(actual.text).includes(normalizeText(s))
      );
      errors.push(`Missing required sections: ${missing.join(", ")}`);
    }
  }

  // Hard failures: forbidden tokens present
  if (testCase.expect.forbiddenTokens) {
    if (!checkForbiddenTokens(actual.text, testCase.expect.forbiddenTokens)) {
      const found = testCase.expect.forbiddenTokens.filter((t) =>
        normalizeText(actual.text).includes(normalizeText(t))
      );
      errors.push(`Forbidden tokens found: ${found.join(", ")}`);
    }
  }

  // Soft drift detection: compare to snapshot if available
  if (expected) {
    const driftRatio = levenshteinRatio(actual.text, expected.text);
    const lineDiff = computeLineDiff(actual.text, expected.text);

    // Thresholds: fail if >35% character drift OR >40% line changes
    const DRIFT_THRESHOLD = 0.35;
    const LINE_CHANGE_THRESHOLD = 0.4;

    const driftPercent = (1 - driftRatio) * 100;

    if (driftRatio < 1 - DRIFT_THRESHOLD) {
      warnings.push(
        `Significant text drift: ${driftPercent.toFixed(1)}% changed (threshold: ${DRIFT_THRESHOLD * 100}%)`
      );
    }

    if (lineDiff.changeRatio > LINE_CHANGE_THRESHOLD) {
      warnings.push(
        `Significant line changes: ${(lineDiff.changeRatio * 100).toFixed(1)}% (${lineDiff.linesChanged}/${lineDiff.totalLines} lines, threshold: ${LINE_CHANGE_THRESHOLD * 100}%)`
      );
    }

    // Fail if drift exceeds thresholds (unless explicitly accepted)
    if (
      driftRatio < 1 - DRIFT_THRESHOLD ||
      lineDiff.changeRatio > LINE_CHANGE_THRESHOLD
    ) {
      if (process.env.OMEGA_GOLDENS_ACCEPT !== "1") {
        errors.push(
          `Output drift exceeds threshold (${driftPercent.toFixed(1)}% changed, ${(lineDiff.changeRatio * 100).toFixed(1)}% lines changed). Set OMEGA_GOLDENS_ACCEPT=1 to accept changes.`
        );
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      driftRatio: driftPercent / 100,
      linesChanged: lineDiff.linesChanged,
    };
  }

  // No snapshot: only check hard requirements (first run, no baseline)
  if (!snapshotResults || snapshotResults.length === 0) {
    warnings.push("No snapshot found - this is the first run. Snapshot will be created on accept.");
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

