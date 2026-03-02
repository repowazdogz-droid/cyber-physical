/**
 * Claim Contracts
 * 
 * Interfaces for assurance claims.
 * Claims are declarative ("this is true"), not imperative.
 * 
 * Version: 1.0.0
 */

import { CONTRACT_VERSION } from './ContractVersion';

/**
 * ClaimType: Types of assurance claims.
 */
export enum ClaimType {
  /** Safety claim: System is safe under these conditions */
  Safety = "Safety",
  /** Determinism claim: Output is deterministic */
  Determinism = "Determinism",
  /** Bounded claim: All outputs are bounded */
  Bounded = "Bounded",
  /** Explainable claim: Decision process is explainable */
  Explainable = "Explainable",
  /** Reversible claim: Decision can be reversed */
  Reversible = "Reversible",
  /** Performance claim: Performance meets requirements */
  Performance = "Performance",
  /** Constraint claim: Constraints are satisfied */
  Constraint = "Constraint"
}

/**
 * ClaimContract: Assurance claim about a decision.
 * Declarative statement, not an action.
 */
export interface ClaimContract {
  /** Contract version (must match CONTRACT_VERSION) */
  contractVersion: string;
  /** Claim type */
  type: ClaimType;
  /** Claim statement (declarative, max 200 chars) */
  statement: string;
  /** Evidence (bounded, max 5 items) */
  evidence?: ClaimEvidenceContract[];
  /** Confidence level */
  confidence: "Low" | "Medium" | "High" | "Unknown";
  /** Claim ID (deterministic hash) */
  claimId: string;
}

/**
 * ClaimEvidenceContract: Evidence supporting a claim.
 * Structured, bounded, optional.
 */
export interface ClaimEvidenceContract {
  /** Evidence type */
  type: "trace_node" | "input_signal" | "policy_result" | "external";
  /** Reference (e.g., trace node ID, signal key) */
  reference: string;
  /** Description (max 150 chars) */
  description?: string;
  /** Data (optional, bounded, max 5 keys) */
  data?: Record<string, string | number | boolean>;
}








































