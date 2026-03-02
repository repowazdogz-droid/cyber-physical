/**
 * Candidate Evaluator
 * 
 * Evaluates a single candidate program.
 * 
 * Version: 1.0.0
 */

import { Program } from '../../dsl/v0/types';
import { CanonicalRepresentation } from '../../contracts/types/Repr';
import { Request } from '../../contracts/types/Request';
import { execute } from '../../executor/v0/Executor';
import { verify, VerifierContext } from '../../verifier/v0/Verifier';
import { CandidateResult } from './types';
import { hashCanonical } from '../../contracts/invariants/CanonicalHashing';
import { writeTrace } from '../../verifier/v0/TraceWriter';
import { VerifierTraceEvent } from '../../verifier/v0/types';
import { Grid } from '../../executor/v0/types';

/**
 * Evaluates a candidate program.
 */
export function evaluateCandidate(
  program: Program,
  repr: CanonicalRepresentation,
  request: Request,
  input_grid: Grid,
  examples?: Array<{ input_grid: Grid; expected_output_grid: Grid }>,
  options?: {
    enable_tier3?: boolean;
    enable_tier4?: boolean;
  }
): CandidateResult {
  // Execute program
  const exec_result = execute(program, repr, { grid: input_grid });

  // Verify program
  const verifier_context: VerifierContext = {
    request,
    repr,
    program,
    exec_result,
    input_grid,
    examples,
    enable_tier3: options?.enable_tier3,
    enable_tier4: options?.enable_tier4
  };

  const verifier_result = verify(verifier_context);

  // Compute trace ID (hash of verifier trace)
  // Get trace events from verifier result (stored in failure_details for all cases)
  const trace_events: VerifierTraceEvent[] = verifier_result.failure_details?.trace_events || [];
  const trace_jsonl = trace_events.length > 0 ? writeTrace(trace_events) : '';
  const trace_id = trace_jsonl ? hashCanonical(trace_jsonl) : '';

  return {
    program,
    exec_result,
    verifier_result,
    cost_breakdown: verifier_result.cost_breakdown,
    trace_id
  };
}

