/**
 * Policy Contracts
 * 
 * Interfaces for policy evaluation.
 * Policies describe permission, never control.
 * 
 * Version: 1.0.0
 */

import { CONTRACT_VERSION } from './ContractVersion';
import { KernelInputContract } from './KernelContracts';
import type { ClaimContract } from './ClaimContracts';

/**
 * PolicyContextContract: Context for policy evaluation.
 * Read-only context, no mutable state.
 */
export interface PolicyContextContract {
  /** Contract version (must match CONTRACT_VERSION) */
  contractVersion: string;
  /** Kernel input being evaluated */
  input: KernelInputContract;
  /** Current decision being built (optional) */
  currentDecision?: PolicyDecisionContract;
  /** Session ID (optional) */
  sessionId?: string;
  /** Learner ID (optional) */
  learnerId?: string;
}

/**
 * PolicyDecisionContract: Policy evaluation result.
 * Describes permission, never executes action.
 */
export interface PolicyDecisionContract {
  /** Contract version (must match CONTRACT_VERSION) */
  contractVersion: string;
  /** Proposed outcome (domain-specific enum, as string) */
  outcome: string;
  /** Confidence level */
  confidence: "Low" | "Medium" | "High" | "Unknown";
  /** Reason (human-readable, max 300 chars) */
  reason: string;
  /** Policy ID that produced this decision */
  policyId: string;
  /** Decision type */
  decisionType: "allow" | "deny" | "force" | "constrain";
  /** Claims (bounded, max 5) */
  claims?: ClaimContract[];
  /** Next actions suggested (bounded, max 5) */
  nextActions?: string[];
  /** Refusal reason (if decisionType is "deny", max 200 chars) */
  refusalReason?: string;
  /** Escalation path (if needed, max 100 chars) */
  escalationPath?: string;
  /** Metadata (optional, bounded, max 10 keys) */
  metadata?: Record<string, string | number | boolean>;
}

/**
 * PolicyOverrideContract: Override rule result.
 * Forces specific outcome based on conditions.
 */
export interface PolicyOverrideContract {
  /** Contract version (must match CONTRACT_VERSION) */
  contractVersion: string;
  /** Override ID */
  overrideId: string;
  /** Forced outcome */
  forcedOutcome: string;
  /** Reason (human-readable, max 200 chars) */
  reason: string;
  /** Priority (higher = more urgent, 0-100) */
  priority: number;
  /** Condition that triggered override (max 100 chars) */
  condition: string;
}




