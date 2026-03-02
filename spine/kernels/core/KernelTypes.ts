/**
 * KernelTypes: Core types for domain-agnostic kernel framework.
 * Logic-only, deterministic, explainable. No control algorithms.
 * 
 * TODO: Future migration to /spine/contracts/KernelContracts.ts
 * - KernelInput → KernelInputContract (add contractVersion, sessionId, learnerId)
 * - KernelDecision → KernelDecisionContract (add contractVersion, kernelId, adapterId)
 * - DecisionTrace → KernelTraceContract (add contractVersion, align structure)
 * - Claim → ClaimContract (add contractVersion, claimId, align evidence structure)
 */

import type { OmegaMeta } from "../../llm/modes/OmegaMeta";

/**
 * KernelInput: Input to kernel decision logic.
 * Domain-agnostic signal values.
 * 
 * TODO: Migrate to KernelInputContract from /spine/contracts/KernelContracts.ts
 */
export interface KernelInput {
  /** Timestamp (ISO string) */
  timestamp: string;
  /** Domain-specific signal values (key-value pairs) */
  signals: Record<string, number | string | boolean>;
  /** Uncertainty flags per signal */
  uncertainty: Record<string, boolean>;
  /** Environment/time overrides (optional) */
  overrides?: {
    environment?: string;
    timeToContact?: string;
    [key: string]: string | undefined;
  };
  /** Optional: Learning session ID if attached */
  sessionId?: string;
  /** Optional: Learner ID if persisted */
  learnerId?: string;
  /** Optional: Adapter ID for tracking */
  adapterId?: string;
  /** Optional: Policy pack ID */
  policyPackId?: string;
}

/**
 * KernelDecision: Output decision from kernel.
 * 
 * TODO: Migrate to KernelDecisionContract from /spine/contracts/KernelContracts.ts
 */
export interface KernelDecision {
  /** Decision outcome (domain-specific enum) */
  outcome: string;
  /** Confidence level */
  confidence: "Low" | "Medium" | "High" | "Unknown";
  /** Rationale (human-readable) */
  rationale: string;
  /** Assumptions made */
  assumptions: string[];
  /** Uncertainties acknowledged */
  uncertainties: string[];
  /** Overrides applied (if any) */
  overridesApplied?: string[];
}

/**
 * Claim: Assurance claim about the decision.
 * 
 * TODO: Migrate to ClaimContract from /spine/contracts/ClaimContracts.ts
 */
export interface Claim {
  /** Claim type */
  type: "Safety" | "Determinism" | "Bounded" | "Explainable" | "Reversible";
  /** Claim statement */
  statement: string;
  /** Evidence for claim */
  evidence: string[];
  /** Confidence in claim */
  confidence: "Low" | "Medium" | "High" | "Unknown";
}

/**
 * TraceNode: Single node in decision trace.
 * Bounded, deterministic, ND-calm display friendly.
 */
export interface TraceNode {
  /** Node ID (deterministic) */
  id: string;
  /** Timestamp (ISO string) */
  timestamp: string;
  /** Node type */
  type: "Input" | "Policy" | "Override" | "Decision" | "Claim" | "Error";
  /** Human-readable label */
  label: string;
  /** Short description */
  description: string;
  /** Associated data (bounded, no large objects) */
  data?: Record<string, string | number | boolean>;
  /** Child nodes (bounded depth) */
  children?: TraceNode[];
}

/**
 * DecisionTrace: Complete trace of decision process.
 * Bounded length, deterministic, explainable.
 * 
 * TODO: Migrate to KernelTraceContract from /spine/contracts/KernelContracts.ts
 */
export interface DecisionTrace {
  /** Trace ID (deterministic hash) */
  traceId: string;
  /** Input hash (for reproducibility) */
  inputHash: string;
  /** Root nodes (bounded count) */
  nodes: TraceNode[];
  /** Total node count (bounded) */
  nodeCount: number;
  /** Claims made */
  claims: Claim[];
  /** Version */
  version: string;
  /** Optional: Summary of trace */
  summary?: string;
}

/**
 * KernelResult: Complete kernel output.
 */
export interface KernelResult {
  /** Decision */
  decision: KernelDecision;
  /** Trace */
  trace: DecisionTrace;
  /** Timestamp */
  timestamp: string;
  /** Optional: Omega mode metadata */
  omega?: OmegaMeta;
}

/**
 * TraceNodeType: Types of trace nodes.
 */
export enum TraceNodeType {
  Input = "Input",
  Policy = "Policy",
  Override = "Override",
  Decision = "Decision",
  Claim = "Claim",
  Error = "Error"
}

/**
 * ConfidenceLevel: Confidence levels.
 */
export enum ConfidenceLevel {
  Low = "Low",
  Medium = "Medium",
  High = "High",
  Unknown = "Unknown"
}

/**
 * ClaimType: Types of assurance claims.
 */
export enum ClaimType {
  Safety = "Safety",
  Determinism = "Determinism",
  Bounded = "Bounded",
  Explainable = "Explainable",
  Reversible = "Reversible"
}

