/**
 * Replay Verifier Types
 * 
 * Types for replay verification results.
 * Bounded, deterministic, no grading.
 * 
 * Version: 1.0.0
 */

/**
 * CheckResult: Result of a single verification check.
 */
export interface CheckResult {
  /** Check ID */
  id: string;
  /** Whether check passed */
  ok: boolean;
  /** Optional detail message (max 200 chars) */
  detail?: string;
}

/**
 * ReplayVerificationResult: Complete verification result.
 * Bounded: checks max 20, notes max 10.
 */
export interface ReplayVerificationResult {
  /** Whether overall verification passed */
  ok: boolean;
  /** Session ID being verified */
  sessionId: string;
  /** Original bundle hash */
  bundleHash: string;
  /** Recomputed bundle hash (should match) */
  recomputedHash: string;
  /** Individual check results (bounded, max 20) */
  checks: CheckResult[];
  /** Optional notes (bounded, max 10) */
  notes: string[];
  /** Verification timestamp (ISO string) */
  verifiedAtIso: string;
}








































