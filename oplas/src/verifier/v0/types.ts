/**
 * Verifier v0 Types
 * 
 * Types for verifier tiers 0-2.
 * 
 * Version: 1.0.0
 */

import { VerifierWhyCode } from '../../contracts/enums/VerifierCodes';
import { CostBreakdown, RunMetrics } from '../../contracts/types/Trace';
import { Request } from '../../contracts/types/Request';
import { CanonicalRepresentation } from '../../contracts/types/Repr';
import { Program } from '../../dsl/v0/types';
import { ExecutionResult } from '../../executor/v0/types';
import { Grid } from '../../executor/v0/types';

/**
 * Verifier Result.
 */
export interface VerifierResult {
  /** Success flag */
  ok: boolean;
  /** Highest tier passed (0, 1, 2, 3, or 4) */
  highest_tier_passed: 0 | 1 | 2 | 3 | 4;
  /** Why failed (if not ok) */
  why_failed?: VerifierWhyCode;
  /** Cost breakdown (always present) */
  cost_breakdown: CostBreakdown;
  /** Run metrics */
  metrics: RunMetrics;
  /** Failure details (if not ok) */
  failure_details?: Record<string, any>;
  /** Tier 3 results (if run) */
  tier3_result?: {
    ok: boolean;
    palette_test_passed: boolean;
    translation_test_passed: boolean;
  };
  /** Tier 4 results (if run) */
  tier4_result?: {
    ok: boolean;
    perturbations_passed: number;
    perturbations_failed: number;
  };
}

/**
 * Verifier Trace Event.
 */
export interface VerifierTraceEvent {
  /** Run ID */
  run_id: string;
  /** Representation ID */
  repr_id: string;
  /** Program ID */
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
 * Example: Input/output example for Tier 2.
 */
export interface Example {
  /** Input grid */
  input_grid: Grid;
  /** Expected output grid */
  expected_output_grid: Grid;
}

/**
 * Verifier Context.
 */
export interface VerifierContext {
  request: Request;
  repr: CanonicalRepresentation;
  program: Program;
  exec_result: ExecutionResult;
  input_grid: Grid; // Input grid used for execution
  examples?: Example[];
}

