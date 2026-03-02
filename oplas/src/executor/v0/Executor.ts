/**
 * DSL v0 Executor
 * 
 * Deterministic executor for DSL v0 programs.
 * 
 * Version: 1.0.0
 */

import { Expr, DSLType } from '../../dsl/v0/types';
import { Program } from '../../dsl/v0/types';
import { CanonicalRepresentation } from '../../contracts/types/Repr';
import {
  RuntimeValue,
  RuntimeEnv,
  ExecutionResult,
  ExecutionMetrics,
  ExecutionLimits,
  TraceEvent,
  ExecError,
  ExecErrorCode,
  Grid
} from './types';
import {
  selectComponents,
  maskFromObjects,
  recolor,
  cropToBbox,
  pasteAt
} from './operators';

const DEFAULT_LIMITS: ExecutionLimits = {
  max_steps: 1000,
  max_cells: 1000000,
  max_objs: 10000
};

/**
 * Evaluates an expression in the runtime environment.
 */
function evaluateExpr(env: RuntimeEnv, expr: Expr): { ok: boolean; value?: RuntimeValue; error?: ExecError } {
  // Check step limit
  if (env.steps >= env.limits.max_steps) {
    return {
      ok: false,
      error: {
        code: ExecErrorCode.LIMIT_EXCEEDED,
        details: { limit: 'max_steps', value: env.steps, max: env.limits.max_steps }
      }
    };
  }

  env.steps++;
  env.metrics.runtime_steps = env.steps;

  // Trace step start
  env.trace.push({
    step: env.steps,
    event_type: 'step_start',
    expr_type: expr.type
  } as TraceEvent);

  let result: { ok: boolean; value?: RuntimeValue; error?: ExecError };

  switch (expr.type) {
    case 'Seq':
      return evaluateSeq(env, expr);

    case 'Op':
      return evaluateOp(env, expr);

    case 'Let':
      return evaluateLet(env, expr);

    case 'Var':
      return evaluateVar(env, expr);

    case 'Literal':
      result = {
        ok: true,
        value: expr.value as RuntimeValue
      };
      break;

    default:
      result = {
        ok: false,
        error: {
          code: ExecErrorCode.INVALID_INPUT,
          details: { message: `Unknown expression type: ${(expr as any).type}` }
        }
      };
      break;
  }

  // Trace step end
  env.trace.push({
    step: env.steps,
    event_type: 'step_end',
    output_type: result.ok && result.value ? inferType(result.value) : undefined
  } as TraceEvent);

  return result;
}

/**
 * Infers the DSL type of a runtime value.
 */
function inferType(value: RuntimeValue): DSLType {
  if (Array.isArray(value)) {
    if (value.length > 0 && Array.isArray(value[0])) {
      if (typeof value[0][0] === 'boolean') {
        return DSLType.Mask;
      } else if (typeof value[0][0] === 'number') {
        return DSLType.Grid;
      }
    } else if (value.every(v => typeof v === 'string')) {
      return DSLType.ObjSet;
    }
  } else if (typeof value === 'number') {
    return DSLType.Int;
  } else if (typeof value === 'boolean') {
    return DSLType.Bool;
  } else if (value !== null && typeof value === 'object') {
    if ('anchor' in value) {
      return DSLType.CoordRel;
    } else if ('y' in value && 'x' in value) {
      return DSLType.CoordAbs;
    } else if ('nodes' in value && 'edges' in value) {
      return DSLType.Repr;
    }
  }
  return DSLType.Int; // Default fallback
}

/**
 * Evaluates a Seq expression.
 */
function evaluateSeq(env: RuntimeEnv, expr: Expr & { type: 'Seq' }): { ok: boolean; value?: RuntimeValue; error?: ExecError } {
  let lastValue: RuntimeValue | undefined;

  for (const step of expr.steps) {
    const result = evaluateExpr(env, step);
    if (!result.ok) {
      return result;
    }
    lastValue = result.value;
  }

  return {
    ok: true,
    value: lastValue
  };
}

/**
 * Evaluates a Let expression.
 */
function evaluateLet(env: RuntimeEnv, expr: Expr & { type: 'Let' }): { ok: boolean; value?: RuntimeValue; error?: ExecError } {
  const exprResult = evaluateExpr(env, expr.expr);
  if (!exprResult.ok) {
    return exprResult;
  }

  env.vars.set(expr.name, exprResult.value!);
  return {
    ok: true,
    value: exprResult.value
  };
}

/**
 * Evaluates a Var expression.
 */
function evaluateVar(env: RuntimeEnv, expr: Expr & { type: 'Var' }): { ok: boolean; value?: RuntimeValue; error?: ExecError } {
  const value = env.vars.get(expr.name);
  if (value === undefined) {
    return {
      ok: false,
      error: {
        code: ExecErrorCode.UNKNOWN_VAR,
        details: { var_name: expr.name }
      }
    };
  }

  return {
    ok: true,
    value
  };
}

/**
 * Evaluates an Op expression.
 */
function evaluateOp(env: RuntimeEnv, expr: Expr & { type: 'Op' }): { ok: boolean; value?: RuntimeValue; error?: ExecError } {
  // Trace op call
  const traceEvent: TraceEvent = {
    step: env.steps,
    op_name: expr.name,
    args_types: expr.args.map(() => DSLType.Int), // Simplified for v0
    event_type: 'op_call'
  };
  env.trace.push(traceEvent);

  // Evaluate arguments
  const args: RuntimeValue[] = [];
  for (const arg of expr.args) {
    const argResult = evaluateExpr(env, arg);
    if (!argResult.ok) {
      return argResult;
    }
    args.push(argResult.value!);
  }

  // Dispatch to operator
  switch (expr.name) {
    case 'select_components':
      if (args.length !== 2) {
        return {
          ok: false,
          error: {
            code: ExecErrorCode.INVALID_INPUT,
            details: { message: `select_components expects 2 args, got ${args.length}` }
          }
        };
      }
      // Use args[0] as repr (evaluated from DSL), fallback to env.repr for compatibility
      const reprArg = (args[0] as any)?.nodes ? (args[0] as CanonicalRepresentation) : env.repr;
      return selectComponents(env, reprArg, args[1]);

    case 'mask_from_objects':
      if (args.length !== 2) {
        return {
          ok: false,
          error: {
            code: ExecErrorCode.INVALID_INPUT,
            details: { message: `mask_from_objects expects 2 args, got ${args.length}` }
          }
        };
      }
      // Use args[0] as repr (evaluated from DSL), fallback to env.repr for compatibility
      const reprArg2 = (args[0] as any)?.nodes ? (args[0] as CanonicalRepresentation) : env.repr;
      return maskFromObjects(env, reprArg2, args[1] as any);

    case 'recolor':
      if (args.length !== 3 && args.length !== 4) {
        return {
          ok: false,
          error: {
            code: ExecErrorCode.INVALID_INPUT,
            details: { message: `recolor expects 3 or 4 args, got ${args.length}` }
          }
        };
      }
      const from = args.length === 4 ? args[2] : null;
      const to = args[args.length === 4 ? 3 : 2];
      return recolor(env, args[0] as Grid, args[1] as Mask, from, to);

    case 'crop_to_bbox':
      if (args.length !== 2) {
        return {
          ok: false,
          error: {
            code: ExecErrorCode.INVALID_INPUT,
            details: { message: `crop_to_bbox expects 2 args, got ${args.length}` }
          }
        };
      }
      return cropToBbox(env, args[0] as Grid, args[1] as any);

    case 'paste_at':
      if (args.length !== 3) {
        return {
          ok: false,
          error: {
            code: ExecErrorCode.INVALID_INPUT,
            details: { message: `paste_at expects 3 args, got ${args.length}` }
          }
        };
      }
      return pasteAt(env, args[0] as Grid, args[1] as Grid, args[2]);

    default:
      return {
        ok: false,
        error: {
          code: ExecErrorCode.INVALID_INPUT,
          details: { message: `Unknown operator: ${expr.name}` }
        }
      };
  }
}

/**
 * Executes a DSL v0 program.
 */
export function execute(
  program: Program,
  repr: CanonicalRepresentation,
  inputs: { grid: Grid },
  seed?: number,
  limits?: ExecutionLimits
): ExecutionResult {
  // Initialize environment
  const env: RuntimeEnv = {
    vars: new Map(),
    repr,
    inputs,
    steps: 0,
    limits: limits || DEFAULT_LIMITS,
    trace: [],
    metrics: {
      runtime_steps: 0,
      cells_processed: 0,
      objs_selected: 0
    }
  };

  // Add grid to vars (for convenience)
  env.vars.set('grid', inputs.grid);
  env.vars.set('repr', repr);

  // Evaluate program AST
  const result = evaluateExpr(env, program.ast);

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      metrics: env.metrics,
      trace: env.trace
    };
  }

  // Extract output grid (if result is a Grid)
  const outputGrid = result.value && Array.isArray(result.value) && Array.isArray(result.value[0]) && typeof result.value[0][0] === 'number'
    ? (result.value as Grid)
    : undefined;

  return {
    ok: true,
    outputs: {
      grid: outputGrid
    },
    metrics: env.metrics,
    trace: env.trace
  };
}

