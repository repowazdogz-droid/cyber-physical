/**
 * Orchestrator v0 Types
 * 
 * Types for orchestrator v0.
 * 
 * Version: 1.0.0
 */

import { Request } from '../../contracts/types/Request';
import { Program } from '../../dsl/v0/types';
import { CanonicalRepresentation } from '../../contracts/types/Repr';
import { VerifierResult } from '../../verifier/v0/types';
import { ExecutionResult } from '../../executor/v0/types';
import { CostBreakdown } from '../../contracts/types/Trace';
import { Grid } from '../../executor/v0/types';

/**
 * Candidate Evaluation Result.
 */
export interface CandidateResult {
  /** Program */
  program: Program;
  /** Execution result */
  exec_result: ExecutionResult;
  /** Verifier result */
  verifier_result: VerifierResult;
  /** Cost breakdown */
  cost_breakdown: CostBreakdown;
  /** Trace ID (hash of verifier trace) */
  trace_id: string;
}

/**
 * Run-Level Event.
 */
export interface RunEvent {
  /** Event type */
  event_type: 'candidate_evaluated' | 'candidate_rejected' | 'candidate_eligible' | 'winner_selected' | 'budget_exhausted' | 'run_failed';
  /** Timestamp */
  timestamp_iso: string;
  /** Program ID (if applicable) */
  program_id?: string;
  /** Details */
  details: Record<string, any>;
}

/**
 * Run Summary.
 */
export interface RunSummary {
  /** Run ID */
  run_id: string;
  /** Task ID */
  task_id: string;
  /** Success flag */
  ok: boolean;
  /** Winner program ID (if ok) */
  winner_program_id?: string;
  /** Winner candidate result (if ok) */
  winner_result?: CandidateResult;
  /** Failure reason (if not ok) */
  failure_reason?: string;
  /** Closest-to-pass candidate (if not ok) */
  closest_candidate?: {
    program_id: string;
    highest_tier: number;
    cost_breakdown: CostBreakdown;
  };
  /** Candidates evaluated */
  candidates_evaluated: number;
  /** Candidates eligible */
  candidates_eligible: number;
  /** Run events */
  events: RunEvent[];
  /** Budget exhausted flag */
  budget_exhausted: boolean;
}

/**
 * Task Run Inputs.
 */
export interface TaskRunInputs {
  /** Input grid */
  grid: Grid;
  /** Examples (optional) */
  examples?: Array<{
    input_grid: Grid;
    expected_output_grid: Grid;
  }>;
}

/**
 * Task Run Options.
 */
export interface TaskRunOptions {
  /** Vault root (optional) */
  vaultRoot?: string;
  /** Model adapter (optional) */
  modelAdapter?: any; // IModelAdapter
  /** Enable refinement loop */
  enableRefinement?: boolean;
  /** Max refinement iterations */
  maxRefinementIterations?: number;
  /** Enable Tier 3 (invariance tests) */
  enableTier3?: boolean;
  /** Enable Tier 4 (counterexample probing) */
  enableTier4?: boolean;
  /** Write-back strictness level */
  writebackStrictness?: number; // WriteBackStrictness enum value
  /** Retrieval mode */
  retrievalMode?: RetrievalMode;
}

