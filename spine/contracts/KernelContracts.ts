/**
 * Kernel Contracts
 * 
 * Domain-agnostic interfaces for kernel inputs, decisions, traces, and runs.
 * Schema only, no implementation logic.
 * 
 * Version: 1.0.0
 */

import { CONTRACT_VERSION } from './ContractVersion';
import type { ClaimContract } from './ClaimContracts';

/**
 * KernelInputContract: Input to kernel decision logic.
 * Domain-agnostic signal values.
 */
export interface KernelInputContract {
  /** Contract version (must match CONTRACT_VERSION) */
  contractVersion: string;
  /** Timestamp (ISO string) */
  timestamp: string;
  /** Domain-specific signal values (key-value pairs) */
  signals: Record<string, number | string | boolean>;
  /** Uncertainty flags per signal */
  uncertainty: Record<string, boolean>;
  /** Environment/time overrides (optional) */
  overrides?: Record<string, string | number | boolean>;
  /** Session ID (optional, for traceability) */
  sessionId?: string;
  /** Learner ID (optional, for learning context) */
  learnerId?: string;
}

/**
 * KernelDecisionContract: Output decision from kernel.
 * Domain-agnostic outcome structure.
 */
export interface KernelDecisionContract {
  /** Contract version (must match CONTRACT_VERSION) */
  contractVersion: string;
  /** Decision outcome (domain-specific enum, as string) */
  outcome: string;
  /** Confidence level */
  confidence: "Low" | "Medium" | "High" | "Unknown";
  /** Rationale (human-readable, max 500 chars) */
  rationale: string;
  /** Assumptions made (bounded, max 10) */
  assumptions: string[];
  /** Uncertainties acknowledged (bounded, max 10) */
  uncertainties: string[];
  /** Overrides applied (if any, bounded, max 5) */
  overridesApplied?: string[];
  /** Kernel ID that produced this decision */
  kernelId: string;
  /** Adapter ID that provided input */
  adapterId: string;
}

/**
 * KernelTraceContract: Bounded trace of decision process.
 * ND-calm, deterministic, explainable.
 */
export interface KernelTraceContract {
  /** Contract version (must match CONTRACT_VERSION) */
  contractVersion: string;
  /** Trace ID (deterministic hash) */
  traceId: string;
  /** Trace nodes (bounded, max 100 nodes) */
  nodes: KernelTraceNodeContract[];
  /** Claims (bounded, max 10) */
  claims: ClaimContract[];
  /** Summary (human-readable, max 200 chars) */
  summary: string;
  /** Kernel version */
  kernelVersion: string;
}

/**
 * KernelTraceNodeContract: Single trace node.
 * Bounded depth and data.
 */
export interface KernelTraceNodeContract {
  /** Node ID (deterministic hash) */
  id: string;
  /** Parent node ID (optional, for hierarchy) */
  parentId?: string;
  /** Node type */
  type: "Input" | "Policy" | "Override" | "Decision" | "Claim" | "Error" | "Summary";
  /** Human-readable label (max 100 chars) */
  label: string;
  /** Description (max 200 chars) */
  description?: string;
  /** Timestamp (ISO string) */
  timestamp: string;
  /** Data (bounded, max 10 keys) */
  data?: Record<string, string | number | boolean>;
  /** Child nodes (bounded depth, max 5 levels) */
  children?: KernelTraceNodeContract[];
  /** Depth level (0 = root) */
  level: number;
}

/**
 * KernelRunContract: Complete kernel run record.
 * Includes input, decision, trace, and metadata.
 */
export interface KernelRunContract {
  /** Contract version (must match CONTRACT_VERSION) */
  contractVersion: string;
  /** Run ID (deterministic hash) */
  runId: string;
  /** Kernel ID */
  kernelId: string;
  /** Adapter ID */
  adapterId: string;
  /** Input used */
  input: KernelInputContract;
  /** Decision produced */
  decision: KernelDecisionContract;
  /** Trace of decision process */
  trace: KernelTraceContract;
  /** Creation timestamp (ISO string) */
  createdAtIso: string;
  /** Input hash (for reproducibility) */
  inputHash: string;
}




