/**
 * Signal Types
 * 
 * Common types used by adapters for signal parsing, normalization, and uncertainty.
 * Bounded, deterministic, domain-agnostic.
 * 
 * Version: 1.0.0
 */

/**
 * RawSignalValue: Raw input value from domain.
 * May include null/undefined for missing signals.
 */
export type RawSignalValue = number | string | boolean | null | undefined;

/**
 * SignalValue: Normalized signal value.
 * No undefined (null is allowed for explicit missing).
 */
export type SignalValue = number | string | boolean | null;

/**
 * SignalParseIssue: Issue encountered during signal parsing.
 * Bounded: message max 140 chars.
 */
export interface SignalParseIssue {
  /** Signal key that had the issue */
  signalKey: string;
  /** Severity level */
  severity: "info" | "warn" | "critical";
  /** Human-readable message (max 140 chars) */
  message: string;
}

/**
 * SignalParseResult: Result of parsing a signal.
 * Bounded: issues max 10.
 */
export interface SignalParseResult<T extends SignalValue> {
  /** Parsed value (undefined if parsing failed) */
  value?: T;
  /** Parse issues (bounded, max 10) */
  issues: SignalParseIssue[];
}

/**
 * UncertaintyFlag: Flag indicating uncertainty in a signal.
 * Bounded: reason max 120 chars.
 */
export interface UncertaintyFlag {
  /** Signal key with uncertainty */
  signalKey: string;
  /** Reason for uncertainty (max 120 chars) */
  reason: string;
  /** Uncertainty level (magnitude) */
  level: "low" | "medium" | "high";
}

/**
 * AdapterNormalizationResult: Complete normalization result.
 * Bounded: normalized max 50 keys, issues max 20, uncertainty max 20.
 */
export interface AdapterNormalizationResult {
  /** Normalized signals (bounded, max 50 keys) */
  normalized: Record<string, SignalValue>;
  /** Parse issues (bounded, max 20) */
  issues: SignalParseIssue[];
  /** Uncertainty flags (bounded, max 20) */
  uncertainty: UncertaintyFlag[];
}








































