/**
 * Verifier Trace Types
 * 
 * Structured trace events for verifier runs.
 * 
 * Version: 1.0.0
 */

import { VerifierWhyCode } from '../enums/VerifierCodes';

/**
 * CostBreakdown: Cost metrics breakdown.
 */
export interface CostBreakdown {
  /** Number of AST nodes */
  n_nodes: number;
  /** Number of operations */
  n_ops: number;
  /** Number of parameters */
  n_params: number;
  /** Number of literals */
  n_literals: number;
  /** Runtime steps */
  runtime_steps: number;
  /** Absolute coordinate references */
  abs_coord_refs: number;
  /** Color binding literals */
  color_binding_literals: number;
  /** Total cost (computed) */
  total_cost: number;
}

/**
 * RunMetrics: Runtime metrics.
 */
export interface RunMetrics {
  /** Tokens in (if LLM used) */
  tokens_in?: number;
  /** Tokens out (if LLM used) */
  tokens_out?: number;
  /** Latency (milliseconds) */
  latency_ms: number;
  /** Cost estimate (USD) */
  cost_usd_est?: number;
  /** Runtime steps */
  runtime_steps: number;
}

/**
 * TraceEvent: Single trace event.
 */
export interface TraceEvent {
  /** Run ID */
  run_id: string;
  /** Representation ID */
  repr_id: string;
  /** Program ID (or candidate_id) */
  program_id: string;
  /** Verifier tier */
  tier: number;
  /** Status */
  status: 'pass' | 'fail' | 'skip';
  /** Why code (structured) */
  why: VerifierWhyCode;
  /** Details */
  details: Record<string, any>;
  /** Cost breakdown (optional) */
  cost_breakdown?: CostBreakdown;
  /** Metrics (optional) */
  metrics?: RunMetrics;
}

/**
 * Invariants:
 * - Every failure must have why enum and details
 * - Trace must be replay-derivable (no ad-hoc prose)
 */























