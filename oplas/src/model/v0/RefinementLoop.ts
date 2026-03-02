/**
 * Refinement Loop
 * 
 * Bounded refinement loop for repairing failed programs.
 * 
 * Version: 1.0.0
 */

import { IModelAdapter, validateRepairOutput } from './ModelAdapter';
import { Program } from '../../dsl/v0/types';
import { CanonicalRepresentation } from '../../contracts/types/Repr';
import { Request } from '../../contracts/types/Request';
import { CandidateResult } from '../../orchestrator/v0/types';
import { evaluateCandidate } from '../../orchestrator/v0/CandidateEvaluator';
import { parseDSL, buildProgram } from '../../dsl/v0';
import { Grid } from '../../executor/v0/types';
import { scheduleRepairs, adjustForBudget, BudgetGuardrails } from './AdaptiveScheduler';

/**
 * Refinement Loop Result.
 */
export interface RefinementLoopResult {
  /** Success flag */
  ok: boolean;
  /** Repaired program (if ok) */
  repaired_program?: Program;
  /** Final candidate result (if ok) */
  final_result?: CandidateResult;
  /** Iterations performed */
  iterations: number;
  /** All attempts */
  attempts: Array<{
    iteration: number;
    program: Program;
    result: CandidateResult;
  }>;
}

/**
 * Runs bounded refinement loop with adaptive scheduling.
 * 
 * Algorithm:
 * - Schedule repairs using priority score R
 * - Allocate iterations per candidate (max 3 each)
 * - Apply budget guardrails
 * - Stop early on Tier 3 pass if writeback_target=true
 */
export async function runRefinementLoop(
  modelAdapter: IModelAdapter,
  failures: CandidateResult[],
  repr: CanonicalRepresentation,
  request: Request,
  inputGrid: Grid,
  examples?: Array<{ input_grid: Grid; expected_output_grid: Grid }>,
  maxIterations: number = 6,
  writebackTarget: boolean = false,
  budgetGuardrails?: BudgetGuardrails
): Promise<RefinementLoopResult> {
  // Schedule repairs
  let schedule = scheduleRepairs(failures, {
    max_total_iterations: maxIterations,
    max_per_candidate: 3,
    top_k: 3,
    writeback_target: writebackTarget
  });

  // Apply budget guardrails
  if (budgetGuardrails) {
    schedule = adjustForBudget(schedule, budgetGuardrails);
  }

  const attempts: Array<{ iteration: number; program: Program; result: CandidateResult }> = [];
  let globalIteration = 0;

  // Iterate through scheduled candidates
  for (const scheduleItem of schedule.scheduled) {
    const failure = scheduleItem.candidate;
    const maxRepairs = scheduleItem.max_repairs;

    for (let candidateIteration = 0; candidateIteration < maxRepairs; candidateIteration++) {
      globalIteration++;

    // Call repair_program
    const repairInput = {
      failure_trace: {
        highest_tier_passed: failure.verifier_result.highest_tier_passed,
        why_failed: failure.verifier_result.why_failed,
        failure_details: failure.verifier_result.failure_details,
        cost_breakdown: failure.cost_breakdown
      },
      repr,
      prior_program: {
        dsl: failure.program.dsl_source,
        ast_metrics: {
          n_nodes: failure.cost_breakdown.n_nodes,
          n_ops: failure.cost_breakdown.n_ops,
          n_params: failure.cost_breakdown.n_params,
          n_literals: failure.cost_breakdown.n_literals
        }
      }
    };

    const repairOutput = await modelAdapter.repair_program(repairInput);
    
    // Validate output
    const validation = validateRepairOutput(repairOutput);
    if (!validation.ok) {
      continue; // Skip invalid repairs
    }

    // Parse repaired DSL
    let repairedDsl: string;
    if (repairOutput.dsl_patch) {
      // Apply patch (simple: replace prior DSL)
      repairedDsl = repairOutput.dsl_patch;
    } else if (repairOutput.dsl_full) {
      repairedDsl = repairOutput.dsl_full;
    } else {
      // No repair provided, skip
      continue;
    }

    // Parse and build program
    const parse = parseDSL(repairedDsl.trim());
    if (!parse.ok || !parse.ast || !parse.declared_frame) {
      continue; // Skip invalid programs
    }

    const build = buildProgram(parse.ast, parse.declared_frame);
    if (!build.ok || !build.program) {
      continue; // Skip programs with build errors
    }

    const repairedProgram = build.program;

    // Evaluate repaired program
    const result = evaluateCandidate(
      repairedProgram,
      repr,
      request,
      inputGrid,
      examples
    );

      attempts.push({
        iteration: globalIteration,
        program: repairedProgram,
        result
      });

      // Check if passes tiers 0-2
      if (result.verifier_result.ok && result.verifier_result.highest_tier_passed >= 2) {
        // If writeback target, also check for Tier 3
        if (writebackTarget && result.verifier_result.highest_tier_passed >= 3) {
          return {
            ok: true,
            repaired_program: repairedProgram,
            final_result: result,
            iterations: globalIteration,
            attempts
          };
        }
        // Otherwise, stop on Tier 2
        return {
          ok: true,
          repaired_program: repairedProgram,
          final_result: result,
          iterations: globalIteration,
          attempts
        };
      }
    }
  }

  // Max iterations reached
  return {
    ok: false,
    iterations: globalIteration,
    attempts
  };
}

