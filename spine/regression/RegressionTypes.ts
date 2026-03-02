/**
 * Regression Types
 * 
 * Types for golden artifact regression testing.
 * Deterministic, bounded, ND-first.
 * 
 * Version: 1.0.0
 */

/**
 * Summary: Canonical summary of an artifact run.
 * Order-stable and bounded.
 */
export interface Summary {
  /** Outcome summary (max 200 chars) */
  outcome: string;
  /** Claim IDs (bounded, max 20) */
  claimIds: string[];
  /** Policy note summaries (bounded, max 10, each max 200 chars) */
  policyNotes: string[];
  /** Highlight summaries (bounded, max 12, each max 200 chars) */
  highlights: string[];
  /** Manifest root SHA-256 */
  manifestHash?: string;
  /** File hashes (bounded, max 10) */
  fileHashes?: Array<{ name: string; sha256: string }>;
}

/**
 * GoldenCase: A golden test case.
 */
export interface GoldenCase {
  /** Artifact ID */
  artifactId: string;
  /** Human-readable label (max 200 chars) */
  label: string;
  /** Expected summary */
  expected: Summary;
  /** Optional: Skip this case */
  skip?: boolean;
}

/**
 * ReplayResultSummary: Summary of a replay result.
 * Bounded: max 50 findings, max 200 chars per field.
 */
export interface ReplayResultSummary {
  /** Artifact ID */
  artifactId: string;
  /** Label */
  label: string;
  /** Whether replay succeeded */
  ok: boolean;
  /** Actual summary (if replay succeeded) */
  actual?: Summary;
  /** Diff findings (bounded, max 50) */
  findings: DiffFinding[];
  /** Error message (if replay failed, max 200 chars) */
  error?: string;
}

/**
 * DiffFinding: A single diff finding.
 */
export interface DiffFinding {
  /** Severity */
  severity: 'info' | 'warn' | 'critical';
  /** Path to changed field (max 200 chars) */
  path: string;
  /** Before value (max 200 chars) */
  before: string;
  /** After value (max 200 chars) */
  after: string;
  /** Optional hint (max 200 chars) */
  hint?: string;
}

/**
 * GoldenSuiteResult: Result of running a golden suite.
 */
export interface GoldenSuiteResult {
  /** Whether suite passed (no critical findings) */
  ok: boolean;
  /** Total cases run */
  totalCases: number;
  /** Cases passed */
  passedCases: number;
  /** Cases failed */
  failedCases: number;
  /** Critical findings count */
  criticalCount: number;
  /** Warning findings count */
  warnCount: number;
  /** Info findings count */
  infoCount: number;
  /** Results (bounded, max 50) */
  results: ReplayResultSummary[];
}

/**
 * Maximum findings per result.
 */
export const MAX_FINDINGS = 50;

/**
 * Maximum characters per field.
 */
export const MAX_FIELD_LENGTH = 200;








































