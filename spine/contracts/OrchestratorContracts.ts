/**
 * Orchestrator Contracts
 * 
 * Schema-only contracts for kernel graph orchestration.
 * Contract-compatible, bounded, deterministic.
 * 
 * Version: 1.0.0
 */

import { CONTRACT_VERSION } from './ContractVersion';

/**
 * KernelNodeSpecContract: Specification for a single kernel node.
 */
export interface KernelNodeSpecContract {
  /** Contract version */
  contractVersion: string;
  /** Node ID */
  nodeId: string;
  /** Adapter ID */
  adapterId: string;
  /** Kernel ID */
  kernelId: string;
  /** Input reference (key in inputBag) */
  inputRef: string;
  /** Optional: Node-specific policy pack ID */
  policyPackId?: string;
  /** Dependencies (other node IDs, bounded max 5) */
  dependsOn: string[];
  /** Optional: Mark as terminal node */
  isTerminal?: boolean;
}

/**
 * KernelGraphSpecContract: Specification for a kernel graph.
 */
export interface KernelGraphSpecContract {
  /** Contract version */
  contractVersion: string;
  /** Graph ID */
  graphId: string;
  /** Graph nodes (bounded, max 25) */
  nodes: KernelNodeSpecContract[];
  /** Maximum steps to process (hard cap, default 25) */
  maxSteps: number;
}

/**
 * OrchestratorNodeResultContract: Result from a single node execution.
 */
export interface OrchestratorNodeResultContract {
  /** Contract version */
  contractVersion: string;
  /** Node ID */
  nodeId: string;
  /** Run ID */
  runId: string;
  /** Decision outcome */
  outcome: string;
  /** Policy notes (bounded, max 3) */
  policyNotes: string[];
}

/**
 * OrchestratorRunContract: Complete orchestrator run result.
 */
export interface OrchestratorRunContract {
  /** Contract version */
  contractVersion: string;
  /** Graph ID */
  graphId: string;
  /** Optional: Session ID */
  sessionId?: string;
  /** Optional: Learner ID */
  learnerId?: string;
  /** Start timestamp (ISO string) */
  startedAtIso: string;
  /** Node results (bounded, max 25) */
  nodes: OrchestratorNodeResultContract[];
  /** Summary claims (aggregated, bounded max 12) */
  summaryClaims: Array<{
    claimId: string;
    title: string;
    severity: "info" | "warn" | "critical";
    count: number;
  }>;
  /** Policy notes (aggregated, bounded max 12) */
  policyNotes: string[];
  /** Bounded trace highlights (max 12) */
  boundedTraceHighlights: Array<{
    nodeId: string;
    label: string;
    description: string;
    type: "override" | "disallow" | "decision" | "claim";
  }>;
  /** Terminal outcome */
  terminalOutcome: string;
  /** Terminal node ID */
  terminalNodeId: string;
}








































