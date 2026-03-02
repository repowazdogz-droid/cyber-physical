/**
 * Pipeline
 * 
 * End-to-end pipeline: parse → canonicalize → hash → validate → store.
 * Gate 1a: Deterministic foundation.
 * 
 * Version: 1.0.0
 */

import { RawInput, ParseResult, CanonicalRepresentation } from './ReprTypes';
import { parse } from './Parser';
import { canonicalize } from './Canonicalizer';
import { setReprId } from './Hasher';
import { validateSchema, ValidationResult } from './SchemaValidator';
import { ReprStorage } from './Storage';

export interface PipelineResult {
  ok: boolean;
  repr_id?: string;
  repr?: CanonicalRepresentation;
  parseError?: string;
  validation?: ValidationResult;
  storageError?: string;
}

/**
 * Runs the full pipeline.
 */
export async function runPipeline(
  input: RawInput,
  storage: ReprStorage
): Promise<PipelineResult> {
  // Step 1: Parse
  const parseResult = parse(input);
  if (!parseResult.ok || !parseResult.repr) {
    return {
      ok: false,
      parseError: parseResult.error
    };
  }

  let repr = parseResult.repr;

  // Step 2: Canonicalize
  repr = canonicalize(repr);

  // Step 3: Hash (sets repr_id)
  setReprId(repr);

  // Step 4: Validate
  const validation = validateSchema(repr);
  if (!validation.ok) {
    return {
      ok: false,
      repr_id: repr.repr_id,
      repr,
      validation
    };
  }

  // Step 5: Store
  try {
    await storage.store(repr);
    return {
      ok: true,
      repr_id: repr.repr_id,
      repr,
      validation
    };
  } catch (error) {
    return {
      ok: false,
      repr_id: repr.repr_id,
      repr,
      validation,
      storageError: error instanceof Error ? error.message : 'Unknown storage error'
    };
  }
}























