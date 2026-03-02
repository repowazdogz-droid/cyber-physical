/**
 * Orchestrator Types
 * 
 * Types for multi-kernel graph orchestration.
 * Deterministic, bounded, explainable, policy-aware.
 * 
 * Version: 1.0.0
 */

import { CONTRACT_VERSION } from '../contracts/ContractVersion';
import { PolicyPackId } from '../policies/PolicyPackTypes';
import { KernelRunRecord } from '../kernels/surfaces/learning/KernelSurfaceTypes';
import { ThoughtObject } from '../../app/learning/board/ThoughtObjects';
import type { OmegaMeta } from '../llm/modes/OmegaMeta';

/**
 * KernelNodeSpec: Specification for a single kernel node in the graph.
 * Bounded: dependsOn max 5, inputRef max 200 chars.
 */
export interface KernelNodeSpec {
  /** Node ID (unique within graph) */
  nodeId: string;
  /** Adapter ID */
  adapterId: string;
  /** Kernel ID */
  kernelId: string;
  /** Input reference (key in inputBag, max 200 chars) */
  inputRef: string;
  /** Optional: Node-specific policy pack ID */
  policyPackId?: PolicyPackId;
  /** Dependencies (other node IDs, bounded max 5) */
  dependsOn: string[];
  /** Optional: Mark as terminal node (final outcome) */
  isTerminal?: boolean;
}

/**
 * KernelGraphSpec: Specification for a kernel graph.
 * Bounded: nodes max 25, maxSteps default 25.
 */
export interface KernelGraphSpec {
  /** Graph ID */
  graphId: string;
  /** Graph nodes (bounded, max 25) */
  nodes: KernelNodeSpec[];
  /** Maximum steps to process (hard cap, default 25) */
  maxSteps: number;
  /** Contract version */
  contractVersion: string;
}

/**
 * OrchestratorInput: Input to orchestrator.
 * Bounded: inputBag max 50 keys, runMeta max 20 keys.
 */
export interface OrchestratorInput {
  /** Graph specification */
  graphSpec: KernelGraphSpec;
  /** Input bag (key-value pairs, bounded max 50 keys) */
  inputBag: Record<string, Record<string, unknown>>;
  /** Optional: Global policy pack ID (applied after node policy) */
  globalPolicyPackId?: PolicyPackId;
  /** Optional: Run metadata (bounded max 20 keys) */
  runMeta?: {
    sessionId?: string;
    learnerId?: string;
    startedAtIso?: string;
    [key: string]: string | undefined;
  };
}

/**
 * OrchestratorNodeResult: Result from a single node execution.
 * Bounded: policyNotes max 3, thoughtObjects max 5.
 */
export interface OrchestratorNodeResult {
  /** Node ID */
  nodeId: string;
  /** Kernel run record */
  runRecord: KernelRunRecord;
  /** Policy notes (bounded, max 3) */
  policyNotes: string[];
  /** Optional: Thought objects (bounded, max 5) */
  thoughtObjects?: ThoughtObject[];
  /** Optional: Omega mode metadata (propagated from KernelResult) */
  omega?: OmegaMeta;
}

/**
 * OrchestratorRun: Complete orchestrator run result.
 * Bounded: nodes max 25, summaryClaims max 12, traceHighlights max 12.
 */
export interface OrchestratorRun {
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
  nodes: OrchestratorNodeResult[];
  /** Summary claims (aggregated, bounded max 12, ordered by severity then ID) */
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
  /** Terminal outcome (from terminal node or last node) */
  terminalOutcome: string;
  /** Terminal node ID */
  terminalNodeId: string;
  /** Optional: Omega mode metadata */
  omega?: OmegaMeta;
}





