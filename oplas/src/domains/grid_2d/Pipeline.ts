/**
 * Grid 2D Pipeline
 * 
 * End-to-end pipeline for grid_2d: parse → canonicalize → hash → validate → store.
 * 
 * Version: 1.0.0
 */

import { RawGridInput } from './types';
import { parseGrid } from './Parser';
import { canonicalizeGrid } from './Canonicalizer';
import { hashCanonical } from '../../contracts/invariants/CanonicalHashing';
import { validateSchema } from '../../core/SchemaValidator';
import { CanonicalRepresentation } from '../../contracts/types/Repr';
import { ReprStorage } from '../../core/Storage';

export interface PipelineResult {
  ok: boolean;
  repr_id?: string;
  repr?: CanonicalRepresentation;
  parseError?: string;
  validation?: any;
  storageError?: string;
}

/**
 * Runs the full grid_2d pipeline.
 */
export async function runGridPipeline(
  input: RawGridInput,
  storage: ReprStorage,
  taskId?: string
): Promise<PipelineResult> {
  // Step 1: Parse
  const parseResult = parseGrid(input);
  if (!parseResult.ok || !parseResult.repr) {
    return {
      ok: false,
      parseError: parseResult.error
    };
  }

  let repr = parseResult.repr;

  // Step 2: Canonicalize
  repr = canonicalizeGrid(repr);

  // Step 3: Hash (sets repr_id)
  repr.repr_id = hashCanonical(repr);

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























