/**
 * Tier 2 — Example Consistency
 * 
 * Validates example consistency.
 * 
 * Version: 1.0.0
 */

import { VerifierTraceEvent, Example } from './types';
import { VerifierWhyCode } from '../../contracts/enums/VerifierCodes';
import { Request } from '../../contracts/types/Request';
import { CanonicalRepresentation } from '../../contracts/types/Repr';
import { Program } from '../../dsl/v0/types';
import { execute } from '../../executor/v0/Executor';
import { parseGrid } from '../../domains/grid_2d/Parser';
import { canonicalizeGrid } from '../../domains/grid_2d/Canonicalizer';
import { hashCanonical } from '../../contracts/invariants/CanonicalHashing';
import { Grid } from '../../executor/v0/types';

export interface Tier2Result {
  ok: boolean;
  events: VerifierTraceEvent[];
  why_failed?: VerifierWhyCode;
  details?: Record<string, any>;
  examples_passed: number;
  examples_failed: number;
  trace_events?: VerifierTraceEvent[];
}

/**
 * Compares two grids exactly.
 */
function gridsEqual(grid1: Grid, grid2: Grid): boolean {
  if (grid1.length !== grid2.length) return false;
  if (grid1.length === 0) return true;

  const width = grid1[0].length;
  if (width !== grid2[0]?.length) return false;

  for (let y = 0; y < grid1.length; y++) {
    for (let x = 0; x < width; x++) {
      if (grid1[y][x] !== grid2[y][x]) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Validates Tier 2 (Example consistency).
 */
export function validateTier2(
  request: Request,
  program: Program,
  examples: Example[],
  run_id: string,
  repr_id: string,
  program_id: string
): Tier2Result {
  const events: VerifierTraceEvent[] = [];
  let examples_passed = 0;
  let examples_failed = 0;

  // Tier 2 start
  events.push({
    run_id,
    repr_id,
    program_id,
    tier: 2,
    status: 'skip',
    why: VerifierWhyCode.EXAMPLE_FAILED,
    details: {}
  });

  if (examples.length === 0) {
    // No examples - skip tier 2
    events.push({
      run_id,
      repr_id,
      program_id,
      tier: 2,
      status: 'skip',
      why: VerifierWhyCode.EXAMPLE_FAILED,
      details: { message: 'No examples provided' }
    });
    return {
      ok: true,
      events,
      examples_passed: 0,
      examples_failed: 0,
      trace_events: events
    };
  }

  // Validate each example
  for (let i = 0; i < examples.length; i++) {
    const example = examples[i];

    // Example start
    events.push({
      run_id,
      repr_id,
      program_id,
      tier: 2,
      status: 'skip',
      why: VerifierWhyCode.EXAMPLE_FAILED,
      details: { example_index: i, event: 'example_start' }
    });

    // Parse and canonicalize input grid -> repr
    const parseResult = parseGrid({ cells: example.input_grid });
    if (!parseResult.ok || !parseResult.repr) {
      events.push({
        run_id,
        repr_id,
        program_id,
        tier: 2,
        status: 'fail',
        why: VerifierWhyCode.EXAMPLE_FAILED,
        details: {
          example_index: i,
          error: 'Failed to parse input grid',
          parse_error: parseResult.error
        }
      });
      examples_failed++;
      continue;
    }

    let exampleRepr = canonicalizeGrid(parseResult.repr);
    exampleRepr.repr_id = hashCanonical(exampleRepr);

    // Execute program
    const execResult = execute(
      program,
      exampleRepr,
      { grid: example.input_grid }
    );

    if (!execResult.ok) {
      events.push({
        run_id,
        repr_id,
        program_id,
        tier: 2,
        status: 'fail',
        why: VerifierWhyCode.EXEC_ERROR,
        details: {
          example_index: i,
          exec_error: execResult.error
        }
      });
      examples_failed++;
      continue;
    }

    const outputGrid = execResult.outputs?.grid;
    if (!outputGrid) {
      events.push({
        run_id,
        repr_id,
        program_id,
        tier: 2,
        status: 'fail',
        why: VerifierWhyCode.EXAMPLE_FAILED,
        details: {
          example_index: i,
          error: 'No output grid produced'
        }
      });
      examples_failed++;
      continue;
    }

    // Compare output to expected
    if (!gridsEqual(outputGrid, example.expected_output_grid)) {
      events.push({
        run_id,
        repr_id,
        program_id,
        tier: 2,
        status: 'fail',
        why: VerifierWhyCode.EXAMPLE_MISMATCH,
        details: {
          example_index: i,
          output_height: outputGrid.length,
          output_width: outputGrid[0]?.length || 0,
          expected_height: example.expected_output_grid.length,
          expected_width: example.expected_output_grid[0]?.length || 0
        }
      });
      examples_failed++;
      continue;
    }

    // Example passed
    events.push({
      run_id,
      repr_id,
      program_id,
      tier: 2,
      status: 'pass',
      why: VerifierWhyCode.EXAMPLE_FAILED, // Placeholder
      details: { example_index: i, event: 'example_end' }
    });
    examples_passed++;
  }

  // Tier 2 result
  const ok = examples_failed === 0;
  if (ok) {
    events.push({
      run_id,
      repr_id,
      program_id,
      tier: 2,
      status: 'pass',
      why: VerifierWhyCode.EXAMPLE_FAILED, // Placeholder
      details: { examples_passed, examples_failed: 0 }
    });
  } else {
    events.push({
      run_id,
      repr_id,
      program_id,
      tier: 2,
      status: 'fail',
      why: VerifierWhyCode.EXAMPLE_MISMATCH,
      details: { examples_passed, examples_failed }
    });
  }

  return {
    ok,
    events,
    why_failed: ok ? undefined : VerifierWhyCode.EXAMPLE_MISMATCH,
    details: { examples_passed, examples_failed },
    examples_passed,
    examples_failed,
    trace_events: events
  };
}

