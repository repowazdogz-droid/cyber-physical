/**
 * Uncertainty Mapping
 * 
 * Domain-agnostic mapping utility for deriving confidence hints and uncertainty flags.
 * Generic patterns only, no domain-specific semantics.
 * 
 * Version: 1.0.0
 */

import { SignalParseIssue, UncertaintyFlag, AdapterNormalizationResult } from './SignalTypes';

/**
 * Confidence hint levels.
 */
export type ConfidenceHint = "HIGH" | "MEDIUM" | "LOW" | "H1" | "H2" | "H3";

/**
 * Options for uncertainty mapping.
 */
export interface UncertaintyMappingOptions {
  /** Critical signal keys (missing these = high uncertainty) */
  criticalSignals?: string[];
  /** Conflict groups (signals that conflict with each other) */
  conflictGroups?: Array<{
    groupId: string;
    signals: string[];
    description: string;
  }>;
  /** Use H-level style (H1/H2/H3) instead of generic (HIGH/MEDIUM/LOW) */
  useHLevelStyle?: boolean;
}

/**
 * Maps normalization result to confidence hint and uncertainty flags.
 * Domain-agnostic, generic patterns only.
 */
export function mapUncertainty(
  result: AdapterNormalizationResult,
  options: UncertaintyMappingOptions = {}
): {
  confidenceHint: ConfidenceHint;
  uncertaintyFlags: UncertaintyFlag[];
} {
  const { criticalSignals = [], conflictGroups = [], useHLevelStyle = false } = options;
  const uncertaintyFlags: UncertaintyFlag[] = [];
  let uncertaintyScore = 0;

  // Check for missing critical signals
  for (const criticalKey of criticalSignals) {
    if (!(criticalKey in result.normalized) || result.normalized[criticalKey] === null) {
      uncertaintyFlags.push({
        signalKey: criticalKey,
        reason: boundString(`Missing critical signal: ${criticalKey}`, 120),
        level: 'high'
      });
      uncertaintyScore += 3; // High weight for missing critical
    }
  }

  // Check for critical parse issues
  const criticalIssues = result.issues.filter(i => i.severity === 'critical');
  if (criticalIssues.length > 0) {
    // Critical issues always map to HIGH uncertainty
    for (const issue of criticalIssues.slice(0, 10)) { // Bound to 10
      uncertaintyFlags.push({
        signalKey: issue.signalKey,
        reason: boundString(`Critical parse issue: ${issue.message}`, 120),
        level: 'high'
      });
      uncertaintyScore += 2; // Each critical issue adds 2 to score
    }
    // Ensure score is high enough for LOW confidence hint
    if (uncertaintyScore < 5) {
      uncertaintyScore = 5; // Force LOW confidence if any critical issues exist
    }
  }

  // Check for warning parse issues
  const warnIssues = result.issues.filter(i => i.severity === 'warn');
  for (const issue of warnIssues.slice(0, 10)) { // Bound to 10
    uncertaintyFlags.push({
      signalKey: issue.signalKey,
      reason: boundString(`Parse warning: ${issue.message}`, 120),
      level: 'medium'
    });
    uncertaintyScore += 1;
  }

  // Check for conflict groups
  for (const group of conflictGroups) {
    const presentSignals = group.signals.filter(key => 
      key in result.normalized && result.normalized[key] !== null
    );
    
    if (presentSignals.length > 1) {
      // Multiple signals in conflict group are present
      uncertaintyFlags.push({
        signalKey: group.groupId,
        reason: boundString(`Conflicting signals: ${group.description}`, 120),
        level: 'medium'
      });
      uncertaintyScore += 1;
    }
  }

  // Check for existing uncertainty flags from normalization
  for (const flag of result.uncertainty.slice(0, 10)) { // Bound to 10
    uncertaintyFlags.push(flag);
    const flagScore = flag.level === 'high' ? 2 : flag.level === 'medium' ? 1 : 0;
    uncertaintyScore += flagScore;
  }

  // Bound uncertainty flags to max 20
  const boundedFlags = boundList(uncertaintyFlags, 20);

  // Derive confidence hint from score
  let confidenceHint: ConfidenceHint;
  if (useHLevelStyle) {
    if (uncertaintyScore >= 5) {
      confidenceHint = 'H3';
    } else if (uncertaintyScore >= 2) {
      confidenceHint = 'H2';
    } else {
      confidenceHint = 'H1';
    }
  } else {
    if (uncertaintyScore >= 5) {
      confidenceHint = 'LOW';
    } else if (uncertaintyScore >= 2) {
      confidenceHint = 'MEDIUM';
    } else {
      confidenceHint = 'HIGH';
    }
  }

  return {
    confidenceHint,
    uncertaintyFlags: boundedFlags
  };
}

/**
 * Bounds a list to max length.
 */
function boundList<T>(xs: T[], maxLen: number): T[] {
  return xs.slice(0, maxLen);
}

/**
 * Bounds a string to max length.
 */
function boundString(s: string, maxLen: number): string {
  if (s.length <= maxLen) {
    return s;
  }
  return s.substring(0, maxLen - 3) + '...';
}




