/**
 * Cost Extractor
 * 
 * Extracts cost metrics from AST + exec metrics.
 * 
 * Version: 1.0.0
 */

import { Expr, DSLType } from '../../dsl/v0/types';
import { CostBreakdown } from '../../contracts/types/Trace';
import { ExecutionMetrics } from '../../executor/v0/types';

/**
 * Counts AST nodes.
 */
function countNodes(expr: Expr): number {
  switch (expr.type) {
    case 'Seq':
      return 1 + expr.steps.reduce((sum, step) => sum + countNodes(step), 0);
    case 'Op':
      return 1 + expr.args.reduce((sum, arg) => sum + countNodes(arg), 0);
    case 'Let':
      return 1 + countNodes(expr.expr);
    case 'Var':
    case 'Literal':
      return 1;
    default:
      return 1;
  }
}

/**
 * Counts operations.
 */
function countOps(expr: Expr): number {
  switch (expr.type) {
    case 'Seq':
      return expr.steps.reduce((sum, step) => sum + countOps(step), 0);
    case 'Op':
      return 1 + expr.args.reduce((sum, arg) => sum + countOps(arg), 0);
    case 'Let':
      return countOps(expr.expr);
    case 'Var':
    case 'Literal':
      return 0;
    default:
      return 0;
  }
}

/**
 * Counts parameters (let bindings).
 */
function countParams(expr: Expr): number {
  switch (expr.type) {
    case 'Seq':
      return expr.steps.reduce((sum, step) => sum + countParams(step), 0);
    case 'Op':
      return expr.args.reduce((sum, arg) => sum + countParams(arg), 0);
    case 'Let':
      return 1 + countParams(expr.expr);
    case 'Var':
    case 'Literal':
      return 0;
    default:
      return 0;
  }
}

/**
 * Counts literals.
 */
function countLiterals(expr: Expr): number {
  switch (expr.type) {
    case 'Seq':
      return expr.steps.reduce((sum, step) => sum + countLiterals(step), 0);
    case 'Op':
      return expr.args.reduce((sum, arg) => sum + countLiterals(arg), 0);
    case 'Let':
      return countLiterals(expr.expr);
    case 'Var':
      return 0;
    case 'Literal':
      return 1;
    default:
      return 0;
  }
}

/**
 * Counts absolute coordinate references.
 */
function countAbsCoordRefs(expr: Expr): number {
  switch (expr.type) {
    case 'Seq':
      return expr.steps.reduce((sum, step) => sum + countAbsCoordRefs(step), 0);
    case 'Op':
      return expr.args.reduce((sum, arg) => sum + countAbsCoordRefs(arg), 0);
    case 'Let':
      return countAbsCoordRefs(expr.expr);
    case 'Var':
      return 0;
    case 'Literal':
      if (expr.valueType === DSLType.CoordAbs) {
        return 1;
      }
      return 0;
    default:
      return 0;
  }
}

/**
 * Counts color binding literals.
 */
function countColorBindingLiterals(expr: Expr): number {
  switch (expr.type) {
    case 'Seq':
      return expr.steps.reduce((sum, step) => sum + countColorBindingLiterals(step), 0);
    case 'Op':
      return expr.args.reduce((sum, arg) => sum + countColorBindingLiterals(arg), 0);
    case 'Let':
      return countColorBindingLiterals(expr.expr);
    case 'Var':
      return 0;
    case 'Literal':
      if (expr.valueType === DSLType.Color) {
        return 1;
      }
      return 0;
    default:
      return 0;
  }
}

/**
 * Extracts cost breakdown from AST + exec metrics.
 */
export function extractCost(ast: Expr, exec_metrics: ExecutionMetrics): CostBreakdown {
  const n_nodes = countNodes(ast);
  const n_ops = countOps(ast);
  const n_params = countParams(ast);
  const n_literals = countLiterals(ast);
  const abs_coord_refs = countAbsCoordRefs(ast);
  const color_binding_literals = countColorBindingLiterals(ast);
  const runtime_steps = exec_metrics.runtime_steps;

  // Cost function: C = 5*N_ops + 2*N_nodes + 3*N_params + 4*N_literals + 1*runtime_steps + 20*abs_coord_refs + 8*color_binding_literals
  const total_cost = 
    5 * n_ops +
    2 * n_nodes +
    3 * n_params +
    4 * n_literals +
    1 * runtime_steps +
    20 * abs_coord_refs +
    8 * color_binding_literals;

  return {
    n_nodes,
    n_ops,
    n_params,
    n_literals,
    runtime_steps,
    abs_coord_refs,
    color_binding_literals,
    total_cost
  };
}























