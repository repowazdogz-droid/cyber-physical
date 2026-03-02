/**
 * Adapter Conformance
 * 
 * Conformance checker for IKernelAdapter outputs.
 * Validates bounds, determinism, and structure.
 * 
 * Version: 1.0.0
 */

import { KernelInput } from '../../core/KernelTypes';
import { SignalParseIssue } from './SignalTypes';

/**
 * Options for conformance checking.
 */
export interface ConformanceCheckOptions {
  /** Whether to throw on errors (default: false, only in dev/test) */
  throwOnError?: boolean;
  /** Maximum number of signals allowed */
  maxSignals?: number;
  /** Maximum string length */
  maxStringLength?: number;
}

/**
 * Validates adapter output for conformance.
 * Returns issues array, optionally throws in dev/test.
 */
export function validateAdapterOutput(
  adapterId: string,
  kernelId: string,
  kernelInput: KernelInput,
  options: ConformanceCheckOptions = {}
): SignalParseIssue[] {
  const {
    throwOnError = false,
    maxSignals = 50,
    maxStringLength = 500
  } = options;

  const issues: SignalParseIssue[] = [];

  // Check signal count
  const signalCount = Object.keys(kernelInput.signals).length;
  if (signalCount > maxSignals) {
    const issue: SignalParseIssue = {
      signalKey: 'signals',
      severity: 'critical',
      message: truncate(`Signal count ${signalCount} exceeds maximum ${maxSignals}`, 140)
    };
    issues.push(issue);
    if (throwOnError) {
      throw new Error(`Adapter ${adapterId} exceeded max signals: ${signalCount} > ${maxSignals}`);
    }
  }

  // Check for undefined values
  for (const [key, value] of Object.entries(kernelInput.signals)) {
    if (value === undefined) {
      const issue: SignalParseIssue = {
        signalKey: key,
        severity: 'critical',
        message: truncate(`Signal "${key}" has undefined value (use null for missing)`, 140)
      };
      issues.push(issue);
      if (throwOnError) {
        throw new Error(`Adapter ${adapterId} produced undefined value for signal: ${key}`);
      }
    }

    // Check string bounds
    if (typeof value === 'string' && value.length > maxStringLength) {
      const issue: SignalParseIssue = {
        signalKey: key,
        severity: 'warn',
        message: truncate(`Signal "${key}" string length ${value.length} exceeds maximum ${maxStringLength}`, 140)
      };
      issues.push(issue);
    }
  }

  // Check uncertainty flags
  const uncertaintyCount = Object.keys(kernelInput.uncertainty).length;
  if (uncertaintyCount > maxSignals) {
    const issue: SignalParseIssue = {
      signalKey: 'uncertainty',
      severity: 'warn',
      message: truncate(`Uncertainty flags ${uncertaintyCount} exceed maximum ${maxSignals}`, 140)
    };
    issues.push(issue);
  }

  // Check for deterministic key ordering (keys should be sorted)
  const signalKeys = Object.keys(kernelInput.signals);
  const sortedKeys = [...signalKeys].sort();
  if (JSON.stringify(signalKeys) !== JSON.stringify(sortedKeys)) {
    const issue: SignalParseIssue = {
      signalKey: 'signals',
      severity: 'info',
      message: truncate('Signal keys are not in deterministic order (should be sorted)', 140)
    };
    issues.push(issue);
  }

  return issues;
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








































