/**
 * Normalization
 * 
 * Helpers for normalizing and bounding values.
 * Deterministic, bounded, no side effects.
 * 
 * Version: 1.0.0
 */

import { SignalParseIssue } from './SignalTypes';

/**
 * Clamps a number to min/max bounds.
 */
export function clampNumber(x: number, min: number, max: number): number {
  if (x < min) return min;
  if (x > max) return max;
  return x;
}

/**
 * Bounds a string to max length.
 */
export function boundString(s: string, maxLen: number): string {
  if (s.length <= maxLen) {
    return s;
  }
  return s.substring(0, maxLen - 3) + '...';
}

/**
 * Bounds a list to max length.
 */
export function boundList<T>(xs: T[], maxLen: number): T[] {
  return xs.slice(0, maxLen);
}

/**
 * Stable sort of issues (deterministic ordering).
 * Sorts by severity (critical > warn > info), then by signalKey, then by message.
 */
export function stableSortIssues(issues: SignalParseIssue[]): SignalParseIssue[] {
  const severityOrder = { critical: 3, warn: 2, info: 1 };
  
  return [...issues].sort((a, b) => {
    // Sort by severity first
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    
    // Then by signalKey
    const keyDiff = a.signalKey.localeCompare(b.signalKey);
    if (keyDiff !== 0) return keyDiff;
    
    // Then by message
    return a.message.localeCompare(b.message);
  });
}

/**
 * Merges two issue arrays with max cap.
 * Bounded to maxIssues, deterministically sorted.
 */
export function mergeIssues(
  a: SignalParseIssue[],
  b: SignalParseIssue[],
  maxIssues: number = 20
): SignalParseIssue[] {
  const merged = [...a, ...b];
  const sorted = stableSortIssues(merged);
  return boundList(sorted, maxIssues);
}








































