/**
 * Request Types
 * 
 * Typed request structure for OPLAS tasks.
 * 
 * Version: 1.0.0
 */

import { Domain } from '../enums/Domains';
import { ArtifactRef } from './ArtifactRef';
import { BudgetSpec } from './BudgetSpec';

/**
 * Constraint: Optional typed constraint.
 */
export interface Constraint {
  type: string;
  params: Record<string, any>;
}

/**
 * RunConfig: Configuration for execution.
 */
export interface RunConfig {
  seed?: number;
  strict_mode?: boolean;
  degradation_mode?: string;
  [key: string]: any;
}

/**
 * Request: Typed request for OPLAS task.
 */
export interface Request {
  /** Task ID */
  task_id: string;
  /** Domain (must be declared) */
  domain: Domain;
  /** Input artifacts */
  inputs: ArtifactRef[];
  /** Output artifacts (expected shapes/types if known) */
  outputs: ArtifactRef[];
  /** Constraints (optional, typed) */
  constraints?: Constraint[];
  /** Budgets */
  budgets: BudgetSpec;
  /** Run configuration */
  run_config: RunConfig;
}

/**
 * Invariants:
 * - must validate against RequestSchema
 * - domain must be declared (no implicit)
 * - budgets must be finite
 */























