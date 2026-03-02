/**
 * DSL v0 AST Canonicalizer
 * 
 * Canonicalizes AST for stable hashing.
 * Ensures deterministic ordering and encoding.
 * 
 * Version: 1.0.0
 */

import { Expr, DSLType, CoordRel, CoordAbs, LiteralValue } from './types';

/**
 * Canonicalizes a literal value.
 */
function canonicalizeLiteral(value: LiteralValue, valueType: DSLType): LiteralValue {
  switch (valueType) {
    case DSLType.ObjSet: {
      const ids = value as string[];
      return [...ids].sort(); // Sort object set IDs
    }
    case DSLType.CoordRel: {
      const coord = value as CoordRel;
      return {
        anchor: coord.anchor,
        dy: coord.dy,
        dx: coord.dx
      };
    }
    case DSLType.CoordAbs: {
      const coord = value as CoordAbs;
      return {
        y: coord.y,
        x: coord.x
      };
    }
    default:
      return value;
  }
}

/**
 * Canonicalizes an expression AST.
 */
export function canonicalizeAST(ast: Expr): Expr {
  switch (ast.type) {
    case 'Seq':
      return {
        type: 'Seq',
        steps: ast.steps.map(canonicalizeAST)
      };

    case 'Op':
      return {
        type: 'Op',
        name: ast.name,
        args: ast.args.map(canonicalizeAST)
      };

    case 'Let':
      return {
        type: 'Let',
        name: ast.name,
        expr: canonicalizeAST(ast.expr)
      };

    case 'Var':
      return ast;

    case 'Literal':
      return {
        type: 'Literal',
        value: canonicalizeLiteral(ast.value, ast.valueType),
        valueType: ast.valueType
      };

    default:
      return ast;
  }
}























