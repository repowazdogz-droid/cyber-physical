/**
 * Model Adapter v0
 * 
 * Strict interface for LLM propose/repair/annotate.
 * 
 * Version: 1.0.0
 */

import {
  ProposeProgramInput,
  ProposeProgramOutput,
  RepairProgramInput,
  RepairProgramOutput,
  AnnotateInput,
  AnnotateOutput,
  ModelCallLog
} from './types';
import { hashCanonical } from '../../contracts/invariants/CanonicalHashing';
import Ajv from 'ajv';

/**
 * Model Adapter Interface.
 */
export interface IModelAdapter {
  /** Model ID */
  model_id: string;

  /**
   * Proposes candidate DSL programs.
   */
  propose_program(input: ProposeProgramInput): Promise<ProposeProgramOutput>;

  /**
   * Repairs a failed program.
   */
  repair_program(input: RepairProgramInput): Promise<RepairProgramOutput>;

  /**
   * Annotates representation (optional, labels only).
   */
  annotate?(input: AnnotateInput): Promise<AnnotateOutput>;
}

/**
 * JSON Schema for propose_program output.
 */
const proposeOutputSchema = {
  type: 'object',
  required: ['candidates', 'temperature_id'],
  properties: {
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        required: ['dsl'],
        properties: {
          dsl: { type: 'string' },
          expected_invariants: {
            type: 'array',
            items: { type: 'string' }
          },
          rationale_tags: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    },
    temperature_id: {
      type: 'string',
      enum: ['low', 'med', 'high']
    }
  }
};

/**
 * JSON Schema for repair_program output.
 */
const repairOutputSchema = {
  type: 'object',
  properties: {
    dsl_patch: { type: ['string', 'null'] },
    dsl_full: { type: ['string', 'null'] }
  },
  anyOf: [
    { required: ['dsl_patch'] },
    { required: ['dsl_full'] }
  ]
};

/**
 * Validates propose_program output against schema.
 */
export function validateProposeOutput(output: any): { ok: boolean; error?: string } {
  const ajv = new Ajv();
  const validate = ajv.compile(proposeOutputSchema);
  const valid = validate(output);

  if (!valid) {
    return {
      ok: false,
      error: `Schema validation failed: ${ajv.errorsText(validate.errors)}`
    };
  }

  // Additional validation: either patch or full must be non-null
  if (output.candidates.length === 0) {
    return {
      ok: false,
      error: 'At least one candidate required'
    };
  }

  return { ok: true };
}

/**
 * Validates repair_program output against schema.
 */
export function validateRepairOutput(output: any): { ok: boolean; error?: string } {
  const ajv = new Ajv();
  const validate = ajv.compile(repairOutputSchema);
  const valid = validate(output);

  if (!valid) {
    return {
      ok: false,
      error: `Schema validation failed: ${ajv.errorsText(validate.errors)}`
    };
  }

  // Additional validation: either patch or full must be non-null
  if (output.dsl_patch === null && output.dsl_full === null) {
    return {
      ok: false,
      error: 'Either dsl_patch or dsl_full must be non-null'
    };
  }

  return { ok: true };
}

/**
 * Logs a model call.
 */
export function logModelCall(
  model_id: string,
  call_type: 'propose' | 'repair' | 'annotate',
  request: any,
  response: any,
  options?: {
    token_estimates?: { input_tokens?: number; output_tokens?: number; total_tokens?: number };
    latency_ms?: number;
    cost_usd_est?: number;
  }
): ModelCallLog {
  const requestHash = hashCanonical(JSON.stringify(request));
  const promptHash = requestHash; // Same for v0
  const responseHash = hashCanonical(JSON.stringify(response));

  return {
    timestamp_iso: new Date().toISOString(),
    model_id,
    call_type,
    request_hash: requestHash,
    prompt_hash: promptHash,
    response_hash: responseHash,
    response,
    token_estimates: options?.token_estimates,
    latency_ms: options?.latency_ms,
    cost_usd_est: options?.cost_usd_est
  };
}

/**
 * Wrapper for propose_program with validation and logging.
 */
export async function propose_program(
  adapter: IModelAdapter,
  input: ProposeProgramInput
): Promise<{ ok: boolean; output?: ProposeProgramOutput; log?: ModelCallLog; error?: string }> {
  const startTime = Date.now();
  
  try {
    const output = await adapter.propose_program(input);
    
    // Validate output
    const validation = validateProposeOutput(output);
    if (!validation.ok) {
      return { ok: false, error: validation.error };
    }

    // Log call
    const latency_ms = Date.now() - startTime;
    const log = logModelCall(
      adapter.model_id,
      'propose',
      input,
      output,
      { latency_ms }
    );

    return { ok: true, output, log };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Wrapper for repair_program with validation and logging.
 */
export async function repair_program(
  adapter: IModelAdapter,
  input: RepairProgramInput
): Promise<{ ok: boolean; output?: RepairProgramOutput; log?: ModelCallLog; error?: string }> {
  const startTime = Date.now();
  
  try {
    const output = await adapter.repair_program(input);
    
    // Validate output
    const validation = validateRepairOutput(output);
    if (!validation.ok) {
      return { ok: false, error: validation.error };
    }

    // Log call
    const latency_ms = Date.now() - startTime;
    const log = logModelCall(
      adapter.model_id,
      'repair',
      input,
      output,
      { latency_ms }
    );

    return { ok: true, output, log };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

