/**
 * Signal Parsers
 * 
 * Pure deterministic helpers for parsing raw signals.
 * Bounded, deterministic, no side effects.
 * 
 * Version: 1.0.0
 */

import { RawSignalValue, SignalValue, SignalParseResult, SignalParseIssue } from './SignalTypes';

/**
 * Options for parsing numbers.
 */
export interface ParseNumberOptions {
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Default value if parsing fails */
  defaultValue?: number;
  /** Whether to allow NaN (default: false) */
  allowNaN?: boolean;
}

/**
 * Parses a raw signal value to a number.
 * Bounded, deterministic, handles NaN.
 */
export function parseNumber(
  raw: RawSignalValue,
  options: ParseNumberOptions = {}
): SignalParseResult<number> {
  const issues: SignalParseIssue[] = [];
  const { min, max, defaultValue, allowNaN = false } = options;

  // Handle null/undefined
  if (raw === null || raw === undefined) {
    if (defaultValue !== undefined) {
      return { value: defaultValue, issues };
    }
    issues.push({
      signalKey: 'unknown',
      severity: 'warn',
      message: truncate('Missing numeric signal value', 140)
    });
    return { issues };
  }

  // Handle boolean (convert to 0/1)
  if (typeof raw === 'boolean') {
    return { value: raw ? 1 : 0, issues };
  }

  // Handle string (try to parse)
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed === '') {
      if (defaultValue !== undefined) {
        return { value: defaultValue, issues };
      }
      issues.push({
        signalKey: 'unknown',
        severity: 'warn',
        message: truncate('Empty string cannot be parsed as number', 140)
      });
      return { issues };
    }

    const parsed = Number(trimmed);
    if (isNaN(parsed)) {
      if (defaultValue !== undefined) {
        issues.push({
          signalKey: 'unknown',
          severity: 'warn',
          message: truncate(`Failed to parse "${trimmed}" as number, using default`, 140)
        });
        return { value: defaultValue, issues };
      }
      issues.push({
        signalKey: 'unknown',
        severity: 'critical',
        message: truncate(`Cannot parse "${trimmed}" as number`, 140)
      });
      return { issues };
    }

    raw = parsed; // Continue with number validation
  }

  // Handle number
  if (typeof raw === 'number') {
    // Check NaN
    if (isNaN(raw)) {
      if (!allowNaN) {
        if (defaultValue !== undefined) {
          issues.push({
            signalKey: 'unknown',
            severity: 'critical',
            message: truncate('NaN value not allowed, using default', 140)
          });
          return { value: defaultValue, issues };
        }
        issues.push({
          signalKey: 'unknown',
          severity: 'critical',
          message: truncate('NaN value not allowed', 140)
        });
        return { issues };
      }
    }

    // Check bounds
    if (min !== undefined && raw < min) {
      issues.push({
        signalKey: 'unknown',
        severity: 'warn',
        message: truncate(`Value ${raw} below minimum ${min}`, 140)
      });
      raw = min;
    }
    if (max !== undefined && raw > max) {
      issues.push({
        signalKey: 'unknown',
        severity: 'warn',
        message: truncate(`Value ${raw} above maximum ${max}`, 140)
      });
      raw = max;
    }

    return { value: raw, issues };
  }

  // Unsupported type
  issues.push({
    signalKey: 'unknown',
    severity: 'critical',
    message: truncate(`Unsupported type for number parsing: ${typeof raw}`, 140)
  });
  return { issues };
}

/**
 * Parses a raw signal value to an enum (string or number).
 * Coerces string/number to match allowed values.
 */
export function parseEnum<T extends string | number>(
  raw: RawSignalValue,
  allowed: T[]
): SignalParseResult<T> {
  const issues: SignalParseIssue[] = [];

  // Handle null/undefined
  if (raw === null || raw === undefined) {
    issues.push({
      signalKey: 'unknown',
      severity: 'critical',
      message: truncate('Missing enum signal value', 140)
    });
    return { issues };
  }

  // Normalize to string for comparison
  const normalized = String(raw).trim();

  // Try exact match first
  for (const allowedValue of allowed) {
    if (String(allowedValue) === normalized) {
      return { value: allowedValue, issues };
    }
  }

  // Try case-insensitive match
  for (const allowedValue of allowed) {
    if (String(allowedValue).toLowerCase() === normalized.toLowerCase()) {
      issues.push({
        signalKey: 'unknown',
        severity: 'info',
        message: truncate(`Case-insensitive match: "${normalized}" -> "${allowedValue}"`, 140)
      });
      return { value: allowedValue, issues };
    }
  }

  // No match found
  issues.push({
    signalKey: 'unknown',
    severity: 'critical',
    message: truncate(`Value "${normalized}" not in allowed enum values: ${allowed.join(', ')}`, 140)
  });
  return { issues };
}

/**
 * Parses a raw signal value to a boolean.
 */
export function parseBoolean(raw: RawSignalValue): SignalParseResult<boolean> {
  const issues: SignalParseIssue[] = [];

  // Handle null/undefined
  if (raw === null || raw === undefined) {
    issues.push({
      signalKey: 'unknown',
      severity: 'warn',
      message: truncate('Missing boolean signal value, defaulting to false', 140)
    });
    return { value: false, issues };
  }

  // Handle boolean
  if (typeof raw === 'boolean') {
    return { value: raw, issues };
  }

  // Handle number (0 = false, non-zero = true)
  if (typeof raw === 'number') {
    return { value: raw !== 0 && !isNaN(raw), issues };
  }

  // Handle string
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
      return { value: true, issues };
    }
    if (normalized === 'false' || normalized === '0' || normalized === 'no') {
      return { value: false, issues };
    }
    issues.push({
      signalKey: 'unknown',
      severity: 'warn',
      message: truncate(`Cannot parse "${raw}" as boolean, defaulting to false`, 140)
    });
    return { value: false, issues };
  }

  // Unsupported type
  issues.push({
    signalKey: 'unknown',
    severity: 'critical',
    message: truncate(`Unsupported type for boolean parsing: ${typeof raw}`, 140)
  });
  return { value: false, issues };
}

/**
 * Parses a raw signal value to a string.
 * Bounds length to maxLen.
 */
export function parseString(
  raw: RawSignalValue,
  maxLen: number = 500
): SignalParseResult<string> {
  const issues: SignalParseIssue[] = [];

  // Handle null/undefined
  if (raw === null || raw === undefined) {
    issues.push({
      signalKey: 'unknown',
      severity: 'warn',
      message: truncate('Missing string signal value', 140)
    });
    return { issues };
  }

  // Convert to string
  let str = String(raw);

  // Bound length
  if (str.length > maxLen) {
    issues.push({
      signalKey: 'unknown',
      severity: 'warn',
      message: truncate(`String truncated from ${str.length} to ${maxLen} chars`, 140)
    });
    str = str.substring(0, maxLen);
  }

  return { value: str, issues };
}

/**
 * Truncates text to max length.
 */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) {
    return text;
  }
  return text.substring(0, maxLen - 3) + '...';
}








































