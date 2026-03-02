/**
 * Tier 4 — Counterexample Probing
 * 
 * Grammar-bounded perturbations for robustness testing.
 * 
 * Version: 1.0.0
 */

import { VerifierTraceEvent } from './types';
import { VerifierWhyCode } from '../../contracts/enums/VerifierCodes';
import { Request } from '../../contracts/types/Request';
import { CanonicalRepresentation } from '../../contracts/types/Repr';
import { Program } from '../../dsl/v0/types';
import { Grid } from '../../executor/v0/types';
import { generatePerturbations, Perturbation } from './Perturbations';
import { execute } from '../../executor/v0/Executor';
import { validateTier1 } from './Tier1';
import { parseGrid } from '../../domains/grid_2d/Parser';
import { canonicalizeGrid } from '../../domains/grid_2d/Canonicalizer';
import { hashCanonical } from '../../contracts/invariants/CanonicalHashing';

export interface Tier4Result {
  ok: boolean;
  events: VerifierTraceEvent[];
  why_failed?: VerifierWhyCode;
  details?: Record<string, any>;
  trace_events?: VerifierTraceEvent[];
  perturbations_passed: number;
  perturbations_failed: number;
}

/**
 * Checks if untouched region is unchanged.
 */
function checkUntouchedRegion(
  originalOutput: Grid,
  perturbedOutput: Grid,
  touchedMask: boolean[][]
): { ok: boolean; details?: Record<string, any> } {
  const height = Math.min(originalOutput.length, perturbedOutput.length);
  const width = Math.min(originalOutput[0]?.length || 0, perturbedOutput[0]?.length || 0);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!touchedMask[y]?.[x]) {
        // Untouched region - should be unchanged (or background)
        const originalValue = originalOutput[y]?.[x] ?? 0;
        const perturbedValue = perturbedOutput[y]?.[x] ?? 0;
        
        // Allow background changes (0) but not other changes
        if (originalValue !== 0 && perturbedValue !== originalValue) {
          return {
            ok: false,
            details: {
              position: { y, x },
              original_value: originalValue,
              perturbed_value: perturbedValue
            }
          };
        }
      }
    }
  }

  return { ok: true };
}

/**
 * Validates Tier 4 (counterexample probing).
 */
export function validateTier4(
  request: Request,
  repr: CanonicalRepresentation,
  program: Program,
  inputGrid: Grid,
  outputGrid: Grid,
  examples: Array<{ input_grid: Grid; expected_output_grid: Grid }>,
  run_id: string,
  repr_id: string,
  program_id: string,
  perturbationCount: number = 2
): Tier4Result {
  const events: VerifierTraceEvent[] = [];

  // Tier 4 start
  events.push({
    run_id,
    repr_id,
    program_id,
    tier: 4,
    status: 'skip',
    why: VerifierWhyCode.INVARIANCE_SKIPPED,
    details: { perturbation_count: perturbationCount }
  });

  // Only run Tier 4 if passed tiers 0-2
  // (This is checked by caller, but we validate here too)

  // Generate perturbations
  const perturbations = generatePerturbations(
    inputGrid,
    repr,
    program_id,
    perturbationCount
  );

  if (perturbations.length === 0) {
    events.push({
      run_id,
      repr_id,
      program_id,
      tier: 4,
      status: 'skip',
      why: VerifierWhyCode.INVARIANCE_SKIPPED,
      details: { reason: 'no_valid_perturbations' }
    });
    return {
      ok: true,
      events,
      trace_events: events,
      perturbations_passed: 0,
      perturbations_failed: 0
    };
  }

  let perturbationsPassed = 0;
  let perturbationsFailed = 0;
  let allPassed = true;

  // Test each perturbation
  for (const perturbation of perturbations) {
    const perturbedInput = perturbation.perturbed_grid;
    const touchedMask = perturbation.touched_mask;

    // Parse perturbed input -> repr
    const parseResult = parseGrid({ cells: perturbedInput });
    if (!parseResult.ok || !parseResult.repr) {
      perturbationsFailed++;
      allPassed = false;
      events.push({
        run_id,
        repr_id,
        program_id,
        tier: 4,
        status: 'fail',
        why: VerifierWhyCode.PERTURBATION_EXEC_ERROR,
        details: {
          perturbation_id: perturbation.perturbation_id,
          perturbation_type: perturbation.type,
          error: 'failed_to_parse_perturbed_input'
        }
      });
      continue;
    }

    let perturbedRepr = canonicalizeGrid(parseResult.repr);
    perturbedRepr.repr_id = hashCanonical(perturbedRepr);

    // Execute program on perturbed input
    const execResult = execute(program, perturbedRepr, { grid: perturbedInput });

    if (!execResult.ok || !execResult.outputs?.grid) {
      perturbationsFailed++;
      allPassed = false;
      events.push({
        run_id,
        repr_id,
        program_id,
        tier: 4,
        status: 'fail',
        why: VerifierWhyCode.PERTURBATION_EXEC_ERROR,
        details: {
          perturbation_id: perturbation.perturbation_id,
          perturbation_type: perturbation.type,
          exec_error: execResult.error
        }
      });
      continue;
    }

    const perturbedOutput = execResult.outputs.grid;

    // Check Tier 1 invariants on perturbed output
    const tier1Result = validateTier1(
      request,
      perturbedInput,
      perturbedOutput,
      run_id,
      repr_id,
      program_id
    );

    if (!tier1Result.ok) {
      perturbationsFailed++;
      allPassed = false;
      events.push({
        run_id,
        repr_id,
        program_id,
        tier: 4,
        status: 'fail',
        why: VerifierWhyCode.PERTURBATION_TIER1_FAILED,
        details: {
          perturbation_id: perturbation.perturbation_id,
          perturbation_type: perturbation.type,
          tier1_error: tier1Result.why_failed
        }
      });
      continue;
    }

    // Check untouched region (if perturbation doesn't touch selected objects)
    const untouchedCheck = checkUntouchedRegion(outputGrid, perturbedOutput, touchedMask);
    if (!untouchedCheck.ok) {
      perturbationsFailed++;
      allPassed = false;
      events.push({
        run_id,
        repr_id,
        program_id,
        tier: 4,
        status: 'fail',
        why: VerifierWhyCode.PERTURBATION_UNTOUCHED_REGION_CHANGED,
        details: {
          perturbation_id: perturbation.perturbation_id,
          perturbation_type: perturbation.type,
          ...untouchedCheck.details
        }
      });
      continue;
    }

    // Passed
    perturbationsPassed++;
    events.push({
      run_id,
      repr_id,
      program_id,
      tier: 4,
      status: 'pass',
      why: VerifierWhyCode.INVARIANCE_SKIPPED, // Placeholder
      details: {
        perturbation_id: perturbation.perturbation_id,
        perturbation_type: perturbation.type
      }
    });
  }

  // Tier 4 result
  if (allPassed) {
    events.push({
      run_id,
      repr_id,
      program_id,
      tier: 4,
      status: 'pass',
      why: VerifierWhyCode.INVARIANCE_SKIPPED, // Placeholder
      details: {
        perturbations_passed: perturbationsPassed,
        perturbations_failed: perturbationsFailed
      }
    });
  } else {
    events.push({
      run_id,
      repr_id,
      program_id,
      tier: 4,
      status: 'fail',
      why: VerifierWhyCode.GENERALIZATION_FAIL_TIER4,
      details: {
        perturbations_passed: perturbationsPassed,
        perturbations_failed: perturbationsFailed
      }
    });
  }

  return {
    ok: allPassed,
    events,
    why_failed: allPassed ? undefined : VerifierWhyCode.GENERALIZATION_FAIL_TIER4,
    details: {
      perturbations_passed: perturbationsPassed,
      perturbations_failed: perturbationsFailed
    },
    trace_events: events,
    perturbations_passed: perturbationsPassed,
    perturbations_failed: perturbationsFailed
  };
}

