/**
 * Spec Types
 * 
 * Types for kernel specification (text → JSON → runnable kernel).
 * Domain-agnostic, bounded, deterministic.
 * 
 * Version: 1.0.0
 */

/**
 * KernelSpec: Complete kernel specification.
 * Bounded: max outcomes, max rules, max nodes, max strings.
 */
export interface KernelSpec {
  /** Spec version */
  version: string;
  /** Kernel ID */
  kernelId: string;
  /** Adapter ID (or "spec:{hash}" for compiled specs) */
  adapterId: string;
  /** Kernel name (max 200 chars) */
  name: string;
  /** Kernel description (max 500 chars) */
  description: string;
  /** Outcome mapping rules (bounded, max 20) */
  outcomes: OutcomeMapping[];
  /** Policy rules (bounded, max 20) */
  policies?: PolicySpec[];
  /** Override rules (bounded, max 10) */
  overrides?: OverrideSpec[];
  /** Disallow rules (bounded, max 10) */
  disallows?: DisallowSpec[];
}

/**
 * OutcomeMapping: Maps signal conditions to outcomes.
 */
export interface OutcomeMapping {
  /** Outcome ID (max 50 chars) */
  outcomeId: string;
  /** Outcome label (max 100 chars) */
  label: string;
  /** Conditions (bounded, max 10) */
  conditions: Condition[];
  /** Confidence level */
  confidence: 'Low' | 'Medium' | 'High' | 'Unknown';
  /** Rationale (max 500 chars) */
  rationale: string;
}

/**
 * Condition: Signal condition.
 */
export interface Condition {
  /** Signal key (max 100 chars) */
  signalKey: string;
  /** Operator */
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in';
  /** Value (string, number, boolean, or array) */
  value: string | number | boolean | (string | number | boolean)[];
}

/**
 * PolicySpec: Policy rule.
 */
export interface PolicySpec {
  /** Policy ID (max 50 chars) */
  policyId: string;
  /** Policy name (max 100 chars) */
  name: string;
  /** Conditions (bounded, max 10) */
  conditions: Condition[];
  /** Action */
  action: 'allow' | 'deny' | 'force' | 'constrain';
  /** Target outcome (optional) */
  targetOutcome?: string;
  /** Reason (max 300 chars) */
  reason: string;
}

/**
 * OverrideSpec: Override rule.
 */
export interface OverrideSpec {
  /** Override ID (max 50 chars) */
  overrideId: string;
  /** Override name (max 100 chars) */
  name: string;
  /** Conditions (bounded, max 10) */
  conditions: Condition[];
  /** Forced outcome */
  forcedOutcome: string;
  /** Reason (max 300 chars) */
  reason: string;
}

/**
 * DisallowSpec: Disallow rule.
 */
export interface DisallowSpec {
  /** Disallow ID (max 50 chars) */
  disallowId: string;
  /** Disallow name (max 100 chars) */
  name: string;
  /** Conditions (bounded, max 10) */
  conditions: Condition[];
  /** Disallowed outcome */
  disallowedOutcome: string;
  /** Reason (max 300 chars) */
  reason: string;
}

/**
 * ClaimSpec: Claim specification (optional).
 */
export interface ClaimSpec {
  /** Claim ID (max 50 chars) */
  claimId: string;
  /** Claim type */
  type: 'fact' | 'assumption' | 'uncertainty';
  /** Statement (max 200 chars) */
  statement: string;
  /** Confidence level */
  confidence: 'Low' | 'Medium' | 'High' | 'Unknown';
  /** Conditions (bounded, max 10) */
  conditions: Condition[];
}

/**
 * AdapterSpec: Adapter specification (optional).
 */
export interface AdapterSpec {
  /** Adapter ID (max 50 chars) */
  adapterId: string;
  /** Adapter name (max 100 chars) */
  name: string;
  /** Signal mappings (bounded, max 50) */
  signalMappings: Array<{
    /** Source key (max 100 chars) */
    sourceKey: string;
    /** Target key (max 100 chars) */
    targetKey: string;
    /** Optional transform */
    transform?: 'number' | 'string' | 'boolean';
  }>;
}

/**
 * Bounds
 */
export const MAX_OUTCOMES = 20;
export const MAX_POLICIES = 20;
export const MAX_OVERRIDES = 10;
export const MAX_DISALLOWS = 10;
export const MAX_CONDITIONS = 10;
export const MAX_CLAIMS = 50;
export const MAX_SIGNAL_MAPPINGS = 50;
export const MAX_STRING_LENGTH = 500;
export const MAX_NAME_LENGTH = 100;
export const MAX_ID_LENGTH = 50;








































