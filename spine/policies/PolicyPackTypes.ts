/**
 * Policy Pack Types
 * 
 * Types for policy packs: named collections of overrides, disallows, and constraints.
 * Contract-compatible, domain-agnostic.
 * 
 * Version: 1.0.0
 */

import { PolicyOverrideContract, PolicyDecisionContract } from '../contracts/PolicyContracts';
import { CONTRACT_VERSION } from '../contracts/ContractVersion';

/**
 * Policy Pack ID: Stable identifier for a policy pack.
 */
export type PolicyPackId =
  | "uav_safety_conservative"
  | "learning_privacy_default"
  | "xr_comfort_default";

/**
 * Policy Constraint: Display-only constraint (does not affect decision).
 */
export interface PolicyConstraint {
  /** Constraint ID */
  id: string;
  /** Constraint type */
  type: "cap_trace_nodes" | "cap_question_count" | "cap_motion_intensity" | "cap_text_length";
  /** Maximum value */
  maxValue: number;
  /** Reason (max 100 chars) */
  reason: string;
}

/**
 * Policy Pack Descriptor: Metadata about a policy pack.
 */
export interface PolicyPackDescriptor {
  /** Pack ID */
  id: PolicyPackId;
  /** Version */
  version: string;
  /** Description (max 200 chars) */
  description: string;
  /** Applicable domains */
  domains: string[];
}

/**
 * Policy Pack: Collection of overrides, disallows, and constraints.
 */
export interface PolicyPack {
  /** Contract version */
  contractVersion: string;
  /** Pack descriptor */
  descriptor: PolicyPackDescriptor;
  /** Override rules (bounded, max 10) */
  overrides: PolicyOverrideContract[];
  /** Disallow rules (bounded, max 10) */
  disallows: Array<{
    /** Disallow ID */
    id: string;
    /** Outcome to disallow */
    outcome: string;
    /** Reason (max 200 chars) */
    reason: string;
    /** Priority (higher = checked first, 0-100) */
    priority: number;
  }>;
  /** Constraints (optional, bounded, max 5) */
  constraints?: PolicyConstraint[];
}

/**
 * Policy Pack Application Result: Result of applying a policy pack.
 */
export interface PolicyPackApplicationResult {
  /** Contract version */
  contractVersion: string;
  /** Modified run (new object, not mutated) */
  run: any; // KernelRunContract
  /** Policy notes (bounded, max 3 lines, each max 150 chars) */
  policyNotes: string[];
  /** Applied overrides (bounded, max 5) */
  appliedOverrides: string[];
  /** Disallowed outcomes (bounded, max 5) */
  disallowedOutcomes: string[];
}








































