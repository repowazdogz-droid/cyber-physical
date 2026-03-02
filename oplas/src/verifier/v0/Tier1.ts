/**
 * Tier 1 — Hard Invariants
 * 
 * Enforces hard invariants (domain-generic + grid_2d-specific).
 * 
 * Version: 1.0.0
 */

import { VerifierTraceEvent } from './types';
import { VerifierWhyCode } from '../../contracts/enums/VerifierCodes';
import { Request } from '../../contracts/types/Request';
import { Grid } from '../../executor/v0/types';

export interface Tier1Result {
  ok: boolean;
  events: VerifierTraceEvent[];
  why_failed?: VerifierWhyCode;
  details?: Record<string, any>;
  trace_events?: VerifierTraceEvent[];
}

/**
 * Validates Tier 1 (Hard invariants).
 */
export function validateTier1(
  request: Request,
  inputGrid: Grid,
  outputGrid: Grid,
  run_id: string,
  repr_id: string,
  program_id: string
): Tier1Result {
  const events: VerifierTraceEvent[] = [];

  // Tier 1 start
  events.push({
    run_id,
    repr_id,
    program_id,
    tier: 1,
    status: 'skip',
    why: VerifierWhyCode.SHAPE_MISMATCH,
    details: {}
  });

  // Check output grid is rectangular
  const height = outputGrid.length;
  if (height === 0) {
    events.push({
      run_id,
      repr_id,
      program_id,
      tier: 1,
      status: 'fail',
      why: VerifierWhyCode.SHAPE_MISMATCH,
      details: { message: 'Output grid is empty' }
    });
    return {
      ok: false,
      events,
      why_failed: VerifierWhyCode.SHAPE_MISMATCH,
      details: { message: 'Output grid is empty' }
    };
  }

  const width = outputGrid[0].length;
  for (let y = 0; y < height; y++) {
    if (!Array.isArray(outputGrid[y]) || outputGrid[y].length !== width) {
      events.push({
        run_id,
        repr_id,
        program_id,
        tier: 1,
        status: 'fail',
        why: VerifierWhyCode.SHAPE_MISMATCH,
        details: { message: `Row ${y} has inconsistent width` }
      });
      return {
        ok: false,
        events,
        why_failed: VerifierWhyCode.SHAPE_MISMATCH,
        details: { message: `Row ${y} has inconsistent width` },
        trace_events: events
      };
    }
  }

  // Check cell values are integers
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = outputGrid[y][x];
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        events.push({
          run_id,
          repr_id,
          program_id,
          tier: 1,
          status: 'fail',
          why: VerifierWhyCode.TYPE_MISMATCH,
          details: { message: `Cell (${y},${x}) is not an integer: ${value}` }
        });
        return {
          ok: false,
          events,
          why_failed: VerifierWhyCode.TYPE_MISMATCH,
          details: { message: `Cell (${y},${x}) is not an integer: ${value}` },
          trace_events: events
        };
      }
    }
  }

  // Check constraints from request
  const constraints = request.constraints || [];

  for (const constraint of constraints) {
    if (constraint.type === 'fixed_dims') {
      const expectedHeight = constraint.params.height;
      const expectedWidth = constraint.params.width;
      if (height !== expectedHeight || width !== expectedWidth) {
        events.push({
          run_id,
          repr_id,
          program_id,
          tier: 1,
          status: 'fail',
          why: VerifierWhyCode.DIM_MISMATCH,
          details: {
            expected: { height: expectedHeight, width: expectedWidth },
            actual: { height, width }
          }
        });
        return {
          ok: false,
          events,
          why_failed: VerifierWhyCode.DIM_MISMATCH,
          details: {
            expected: { height: expectedHeight, width: expectedWidth },
            actual: { height, width }
          },
          trace_events: events
        };
      }
    }

    if (constraint.type === 'same_dims') {
      const inputHeight = inputGrid.length;
      const inputWidth = inputGrid[0]?.length || 0;
      if (height !== inputHeight || width !== inputWidth) {
        events.push({
          run_id,
          repr_id,
          program_id,
          tier: 1,
          status: 'fail',
          why: VerifierWhyCode.DIM_MISMATCH,
          details: {
            expected: { height: inputHeight, width: inputWidth },
            actual: { height, width }
          }
        });
        return {
          ok: false,
          events,
          why_failed: VerifierWhyCode.DIM_MISMATCH,
          details: {
            expected: { height: inputHeight, width: inputWidth },
            actual: { height, width }
          },
          trace_events: events
        };
      }
    }

    if (constraint.type === 'palette_preserved') {
      // Extract input colors
      const inputColors = new Set<number>();
      for (const row of inputGrid) {
        for (const cell of row) {
          inputColors.add(cell);
        }
      }

      // Check output colors are subset of input colors
      for (const row of outputGrid) {
        for (const cell of row) {
          if (!inputColors.has(cell)) {
            events.push({
              run_id,
              repr_id,
              program_id,
              tier: 1,
              status: 'fail',
              why: VerifierWhyCode.PALETTE_VIOLATED,
              details: {
                message: `Output color ${cell} not in input palette`,
                input_colors: Array.from(inputColors),
                invalid_color: cell
              }
            });
            return {
              ok: false,
              events,
              why_failed: VerifierWhyCode.PALETTE_VIOLATED,
              details: {
                message: `Output color ${cell} not in input palette`,
                input_colors: Array.from(inputColors),
                invalid_color: cell
              },
              trace_events: events
            };
          }
        }
      }
    }
  }

  // Tier 1 pass
  events.push({
    run_id,
    repr_id,
    program_id,
    tier: 1,
    status: 'pass',
    why: VerifierWhyCode.SHAPE_MISMATCH, // Placeholder
    details: {}
  });

  return {
    ok: true,
    events,
    trace_events: events
  };
}

