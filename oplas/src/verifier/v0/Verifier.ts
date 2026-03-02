/**
 * Verifier v0
 * 
 * Main verifier that runs tiers 0-2.
 * 
 * Version: 1.0.0
 */

import { VerifierResult, VerifierContext, VerifierTraceEvent, Example } from './types';
import { VerifierWhyCode } from '../../contracts/enums/VerifierCodes';
import { CostBreakdown, RunMetrics } from '../../contracts/types/Trace';
import { validateTier0, Tier0Result } from './Tier0';
import { validateTier1, Tier1Result } from './Tier1';
import { validateTier2, Tier2Result } from './Tier2';
import { validateTier3, Tier3Result } from './Tier3';
import { validateTier4, Tier4Result } from './Tier4';
import { extractCost } from './CostExtractor';
import { ExecutionMetrics } from '../../executor/v0/types';

/**
 * Verifies a program against request, repr, and examples.
 */
export function verify(context: VerifierContext): VerifierResult {
  const { request, repr, program, exec_result, examples } = context;
  const run_id = `run_${Date.now()}`;
  const allEvents: VerifierTraceEvent[] = [];
  let allTraceEvents: VerifierTraceEvent[] = [];

  // Extract cost breakdown
  const exec_metrics: ExecutionMetrics = exec_result.metrics || {
    runtime_steps: 0,
    cells_processed: 0,
    objs_selected: 0
  };
  const cost_breakdown = extractCost(program.ast, exec_metrics);

  // Run Tier 0
  const tier0Result = validateTier0(request, repr, program, exec_result);
  allEvents.push(...tier0Result.events);
  if (tier0Result.trace_events) {
    allTraceEvents.push(...tier0Result.trace_events);
  }

  if (!tier0Result.ok) {
    return {
      ok: false,
      highest_tier_passed: 0,
      why_failed: tier0Result.why_failed,
      cost_breakdown,
      metrics: {
        latency_ms: 0,
        runtime_steps: exec_metrics.runtime_steps
      },
      failure_details: {
        ...tier0Result.details,
        trace_events: allTraceEvents
      }
    };
  }

  // Run Tier 1
  const inputGrid = context.input_grid;

  const outputGrid = exec_result.outputs?.grid;
  if (!outputGrid) {
    return {
      ok: false,
      highest_tier_passed: 0,
      why_failed: VerifierWhyCode.OUTPUT_MISMATCH,
      cost_breakdown,
      metrics: {
        latency_ms: 0,
        runtime_steps: exec_metrics.runtime_steps
      }
    };
  }

  const tier1Result = validateTier1(
    request,
    inputGrid,
    outputGrid,
    run_id,
    repr.repr_id,
    program.program_id
  );
  allEvents.push(...tier1Result.events);
  if (tier1Result.trace_events) {
    allTraceEvents.push(...tier1Result.trace_events);
  }

  if (!tier1Result.ok) {
    return {
      ok: false,
      highest_tier_passed: 1,
      why_failed: tier1Result.why_failed,
      cost_breakdown,
      metrics: {
        latency_ms: 0,
        runtime_steps: exec_metrics.runtime_steps
      },
      failure_details: {
        ...tier1Result.details,
        trace_events: allTraceEvents
      }
    };
  }

  // Run Tier 2
  const tier2Examples: Example[] = examples || [];
  const tier2Result = validateTier2(
    request,
    program,
    tier2Examples,
    run_id,
    repr.repr_id,
    program.program_id
  );
  allEvents.push(...tier2Result.events);
  if (tier2Result.trace_events) {
    allTraceEvents.push(...tier2Result.trace_events);
  }

  if (!tier2Result.ok) {
    return {
      ok: false,
      highest_tier_passed: 2,
      why_failed: tier2Result.why_failed,
      cost_breakdown,
      metrics: {
        latency_ms: 0,
        runtime_steps: exec_metrics.runtime_steps
      },
      failure_details: {
        ...tier2Result.details,
        trace_events: allTraceEvents
      }
    };
  }

  // Run Tier 3 (if enabled)
  let tier3Result: Tier3Result | undefined;
  let highestTier = 2;

  if (context.enable_tier3) {
    tier3Result = validateTier3(
      request,
      repr,
      program,
      inputGrid,
      outputGrid,
      tier2Examples,
      run_id,
      repr.repr_id,
      program.program_id,
      true
    );
    allEvents.push(...tier3Result.events);
    if (tier3Result.trace_events) {
      allTraceEvents.push(...tier3Result.trace_events);
    }

    if (tier3Result.ok) {
      highestTier = 3;
    } else {
      // Tier 3 failed - return failure
      return {
        ok: false,
        highest_tier_passed: 3,
        why_failed: tier3Result.why_failed,
        cost_breakdown,
        metrics: {
          latency_ms: 0,
          runtime_steps: exec_metrics.runtime_steps
        },
        tier3_result: {
          ok: false,
          palette_test_passed: tier3Result.palette_test_passed,
          translation_test_passed: tier3Result.translation_test_passed
        },
        failure_details: {
          ...tier3Result.details,
          trace_events: allTraceEvents
        }
      };
    }
  }

  // Run Tier 4 (if enabled and Tier 2 passed)
  // Tier 4 can run even if Tier 3 is disabled or failed
  let tier4Result: Tier4Result | undefined;

  if (context.enable_tier4) {
    tier4Result = validateTier4(
      request,
      repr,
      program,
      inputGrid,
      outputGrid,
      tier2Examples,
      run_id,
      repr.repr_id,
      program.program_id,
      2 // perturbation count
    );
    allEvents.push(...tier4Result.events);
    if (tier4Result.trace_events) {
      allTraceEvents.push(...tier4Result.trace_events);
    }

    if (tier4Result.ok) {
      highestTier = 4;
    } else {
      // Tier 4 failed - return failure
      return {
        ok: false,
        highest_tier_passed: 4,
        why_failed: tier4Result.why_failed,
        cost_breakdown,
        metrics: {
          latency_ms: 0,
          runtime_steps: exec_metrics.runtime_steps
        },
        tier3_result: tier3Result ? {
          ok: tier3Result.ok,
          palette_test_passed: tier3Result.palette_test_passed,
          translation_test_passed: tier3Result.translation_test_passed
        } : undefined,
        tier4_result: {
          ok: false,
          perturbations_passed: tier4Result.perturbations_passed,
          perturbations_failed: tier4Result.perturbations_failed
        },
        failure_details: {
          ...tier4Result.details,
          trace_events: allTraceEvents
        }
      };
    }
  }

  // All tiers passed
  return {
    ok: true,
    highest_tier_passed: highestTier as 0 | 1 | 2 | 3 | 4,
    cost_breakdown,
    metrics: {
      latency_ms: 0,
      runtime_steps: exec_metrics.runtime_steps
    },
    tier3_result: tier3Result ? {
      ok: tier3Result.ok,
      palette_test_passed: tier3Result.palette_test_passed,
      translation_test_passed: tier3Result.translation_test_passed
    } : undefined,
    tier4_result: tier4Result ? {
      ok: tier4Result.ok,
      perturbations_passed: tier4Result.perturbations_passed,
      perturbations_failed: tier4Result.perturbations_failed
    } : undefined,
    failure_details: {
      trace_events: allTraceEvents
    }
  };
}

/**
 * Refinement hook interface (for future LLM integration).
 */
export interface RefinementInfo {
  highest_tier_reached: 0 | 1 | 2;
  diff_size?: number; // Cells mismatched (for Tier 2)
  exec_error_code?: string; // Exec error code if present
  failure_details?: Record<string, any>;
}

/**
 * Extracts refinement info from verifier result.
 */
export function extractRefinementInfo(result: VerifierResult): RefinementInfo {
  return {
    highest_tier_reached: result.highest_tier_passed,
    diff_size: result.failure_details?.examples_failed,
    exec_error_code: result.failure_details?.exec_error?.code,
    failure_details: result.failure_details
  };
}

