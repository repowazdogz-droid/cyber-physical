/**
 * Executor v0 Types
 * 
 * Types for DSL v0 executor runtime.
 * 
 * Version: 1.0.0
 */

import { Expr, DSLType, LiteralValue, CoordRel, CoordAbs } from '../../dsl/v0/types';
import { CanonicalRepresentation } from '../../contracts/types/Repr';

/**
 * Grid: 2D integer matrix.
 */
export type Grid = number[][];

/**
 * Mask: Boolean grid.
 */
export type Mask = boolean[][];

/**
 * ObjSet: Set of component node IDs (sorted array).
 */
export type ObjSet = string[];

/**
 * Runtime Value: Value in runtime environment.
 */
export type RuntimeValue =
  | Grid
  | Mask
  | ObjSet
  | number // Color or Int
  | boolean // Bool
  | CoordRel
  | CoordAbs
  | CanonicalRepresentation; // Repr

/**
 * Execution Error Codes.
 */
export enum ExecErrorCode {
  TYPE_MISMATCH = 'TYPE_MISMATCH',
  UNKNOWN_VAR = 'UNKNOWN_VAR',
  INVALID_PREDICATE = 'INVALID_PREDICATE',
  EMPTY_SELECTION = 'EMPTY_SELECTION',
  OUT_OF_BOUNDS_PASTE = 'OUT_OF_BOUNDS_PASTE',
  LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
  INVALID_INPUT = 'INVALID_INPUT'
}

/**
 * Execution Error.
 */
export interface ExecError {
  code: ExecErrorCode;
  details: Record<string, any>;
}

/**
 * Execution Limits.
 */
export interface ExecutionLimits {
  max_steps: number;
  max_cells: number;
  max_objs: number;
}

/**
 * Execution Metrics.
 */
export interface ExecutionMetrics {
  runtime_steps: number;
  cells_processed: number;
  objs_selected: number;
}

/**
 * Execution Trace Event.
 */
export interface TraceEvent {
  step: number;
  op_name?: string;
  args_types?: DSLType[];
  output_type?: DSLType;
  expr_type?: string; // Expression type (Seq, Op, Let, Var, Literal)
  event_type: 'step_start' | 'step_end' | 'op_call';
}

/**
 * Execution Result.
 */
export interface ExecutionResult {
  ok: boolean;
  outputs?: {
    grid?: Grid;
  };
  metrics?: ExecutionMetrics;
  trace?: TraceEvent[];
  error?: ExecError;
}

/**
 * Runtime Environment.
 */
export interface RuntimeEnv {
  vars: Map<string, RuntimeValue>;
  repr: CanonicalRepresentation;
  inputs: {
    grid: Grid;
  };
  steps: number;
  limits: ExecutionLimits;
  trace: TraceEvent[];
  metrics: ExecutionMetrics;
}

