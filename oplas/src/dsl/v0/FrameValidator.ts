/**
 * Frame Validator
 * 
 * Validates frame rules: CoordAbs banned under RELATIVE frame.
 * 
 * Version: 1.0.0
 */

import { Expr, DSLType } from './types';
import { FrameMode } from '../../contracts/enums/FrameModes';

export interface FrameValidationResult {
  ok: boolean;
  abs_coord_refs: number;
  errors: string[];
}

/**
 * Validates frame rules in an AST.
 */
export function validateFrame(ast: Expr, declared_frame: FrameMode): FrameValidationResult {
  const errors: string[] = [];
  let abs_coord_refs = 0;

  function checkExpr(expr: Expr): void {
    switch (expr.type) {
      case 'Seq':
        expr.steps.forEach(checkExpr);
        break;

      case 'Op':
        expr.args.forEach(checkExpr);
        break;

      case 'Let':
        checkExpr(expr.expr);
        break;

      case 'Var':
        // Variables are fine
        break;

      case 'Literal':
        if (expr.valueType === DSLType.CoordAbs) {
          abs_coord_refs++;
          if (declared_frame === FrameMode.RELATIVE) {
            errors.push(`CoordAbs literal found but declared_frame is RELATIVE`);
          }
        }
        break;
    }
  }

  checkExpr(ast);

  return {
    ok: errors.length === 0,
    abs_coord_refs,
    errors
  };
}























