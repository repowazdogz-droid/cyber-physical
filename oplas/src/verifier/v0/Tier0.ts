/**
 * Tier 0 — Schema + Type Checks
 * 
 * Validates schemas and type checks.
 * 
 * Version: 1.0.0
 */

import { VerifierTraceEvent } from './types';
import { VerifierWhyCode } from '../../contracts/enums/VerifierCodes';
import { Request } from '../../contracts/types/Request';
import { CanonicalRepresentation } from '../../contracts/types/Repr';
import { Program } from '../../dsl/v0/types';
import { ExecutionResult, Grid } from '../../executor/v0/types';
import { validateSchema } from '../../core/SchemaValidator';
import { validateFrame } from '../../dsl/v0/FrameValidator';
import { FrameMode } from '../../contracts/enums/FrameModes';

export interface Tier0Result {
  ok: boolean;
  events: VerifierTraceEvent[];
  why_failed?: VerifierWhyCode;
  details?: Record<string, any>;
  trace_events?: VerifierTraceEvent[];
}

/**
 * Validates Tier 0 (Schema + type checks).
 */
export function validateTier0(
  request: Request,
  repr: CanonicalRepresentation,
  program: Program,
  exec_result: ExecutionResult
): Tier0Result {
  const events: VerifierTraceEvent[] = [];
  const run_id = `run_${Date.now()}`;

  // Tier 0 start
  events.push({
    run_id,
    repr_id: repr.repr_id,
    program_id: program.program_id,
    tier: 0,
    status: 'skip',
    why: VerifierWhyCode.SCHEMA_INVALID,
    details: {}
  });

  // Validate repr schema
  const reprValidation = validateSchema(repr);
  if (!reprValidation.ok) {
    events.push({
      run_id,
      repr_id: repr.repr_id,
      program_id: program.program_id,
      tier: 0,
      status: 'fail',
      why: VerifierWhyCode.SCHEMA_INVALID,
      details: { errors: reprValidation.errors }
    });
    return {
      ok: false,
      events,
      why_failed: VerifierWhyCode.SCHEMA_INVALID,
      details: { errors: reprValidation.errors },
      trace_events: events
    };
  }

  // Validate program frame rules
  const frameValidation = validateFrame(program.ast, program.declared_frame);
  if (!frameValidation.ok) {
    events.push({
      run_id,
      repr_id: repr.repr_id,
      program_id: program.program_id,
      tier: 0,
      status: 'fail',
      why: VerifierWhyCode.SCHEMA_INVALID,
      details: { errors: frameValidation.errors }
    });
    return {
      ok: false,
      events,
      why_failed: VerifierWhyCode.SCHEMA_INVALID,
      details: { errors: frameValidation.errors },
      trace_events: events
    };
  }

  // Validate execution result
  if (!exec_result.ok) {
    events.push({
      run_id,
      repr_id: repr.repr_id,
      program_id: program.program_id,
      tier: 0,
      status: 'fail',
      why: VerifierWhyCode.RUNTIME_ERROR,
      details: { exec_error: exec_result.error }
    });
    return {
      ok: false,
      events,
      why_failed: VerifierWhyCode.RUNTIME_ERROR,
      details: { exec_error: exec_result.error },
      trace_events: events
    };
  }

  // Validate output grid schema
  const outputGrid = exec_result.outputs?.grid;
  if (!outputGrid) {
    events.push({
      run_id,
      repr_id: repr.repr_id,
      program_id: program.program_id,
      tier: 0,
      status: 'fail',
      why: VerifierWhyCode.OUTPUT_MISMATCH,
      details: { message: 'No output grid produced' }
    });
    return {
      ok: false,
      events,
      why_failed: VerifierWhyCode.OUTPUT_MISMATCH,
      details: { message: 'No output grid produced' },
      trace_events: events
    };
  }

  // Validate grid structure
  if (!Array.isArray(outputGrid) || outputGrid.length === 0) {
    events.push({
      run_id,
      repr_id: repr.repr_id,
      program_id: program.program_id,
      tier: 0,
      status: 'fail',
      why: VerifierWhyCode.OUTPUT_MISMATCH,
      details: { message: 'Output grid is not a valid array' }
    });
    return {
      ok: false,
      events,
      why_failed: VerifierWhyCode.OUTPUT_MISMATCH,
      details: { message: 'Output grid is not a valid array' },
      trace_events: events
    };
  }

  // Tier 0 pass
  events.push({
    run_id,
    repr_id: repr.repr_id,
    program_id: program.program_id,
    tier: 0,
    status: 'pass',
    why: VerifierWhyCode.SCHEMA_INVALID, // Placeholder
    details: {}
  });

  return {
    ok: true,
    events,
    trace_events: events
  };
}

