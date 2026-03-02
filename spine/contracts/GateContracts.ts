/**
 * Gate Contracts
 * 
 * Schema-only contracts for gate system.
 * Versioned, bounded, deterministic.
 * 
 * Version: 1.0.0
 */

import { CONTRACT_VERSION } from './ContractVersion';
import { GateAction, ViewerRole, ConsentState, Surface } from '../gates/GateTypes';

/**
 * GateActionContract: Contract for gate action.
 */
export interface GateActionContract {
  /** Contract version */
  contractVersion: string;
  /** Action type */
  action: GateAction;
}

/**
 * GateContextContract: Contract for gate context.
 */
export interface GateContextContract {
  /** Contract version */
  contractVersion: string;
  /** Viewer role */
  viewerRole: ViewerRole;
  /** Whether viewer is a minor */
  isMinor: boolean;
  /** Optional consent state */
  consentState?: ConsentState;
  /** Surface/context */
  surface: Surface;
  /** Optional policy pack IDs (bounded, max 5) */
  policyPackIds?: string[];
  /** Optional calm mode */
  calmMode?: boolean;
  /** Optional reduce motion preference */
  reduceMotion?: boolean;
}

/**
 * GateConstraintsContract: Contract for gate constraints.
 * Bounded: redactFields max 10.
 */
export interface GateConstraintsContract {
  /** Contract version */
  contractVersion: string;
  /** Maximum trace nodes (bounded) */
  maxTraceNodes?: number;
  /** Fields to redact (bounded, max 10) */
  redactFields?: string[];
  /** Require reduce motion */
  requireReduceMotion?: boolean;
  /** Require dismissible */
  requireDismissible?: boolean;
  /** Maximum items (bounded) */
  maxItems?: number;
  /** Deny if adult has not opted in */
  denyIfAdultNoOptIn?: boolean;
}

/**
 * GateDecisionContract: Contract for gate decision.
 */
export interface GateDecisionContract {
  /** Contract version */
  contractVersion: string;
  /** Whether action is allowed */
  allowed: boolean;
  /** Optional constraints */
  constraints?: GateConstraintsContract;
  /** Human-readable reason (max 200 chars) */
  reason: string;
}

/**
 * Creates a GateDecisionContract from a GateDecision.
 */
export function toGateDecisionContract(decision: any): GateDecisionContract {
  return {
    contractVersion: CONTRACT_VERSION,
    allowed: decision.allowed,
    constraints: decision.constraints ? {
      contractVersion: CONTRACT_VERSION,
      maxTraceNodes: decision.constraints.maxTraceNodes,
      redactFields: decision.constraints.redactFields?.slice(0, 10), // Bound to 10
      requireReduceMotion: decision.constraints.requireReduceMotion,
      requireDismissible: decision.constraints.requireDismissible,
      maxItems: decision.constraints.maxItems,
      denyIfAdultNoOptIn: decision.constraints.denyIfAdultNoOptIn
    } : undefined,
    reason: decision.reason.substring(0, 200) // Bound to 200 chars
  };
}








































