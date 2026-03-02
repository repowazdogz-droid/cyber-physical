/**
 * DSL v0 Formatter
 * 
 * Formats AST into canonical DSL source.
 * Round-trip invariant: format(parse(source)) == canonical_source
 * 
 * Version: 1.0.0
 */

import { Expr, DSLType, CoordRel, CoordAbs } from './types';
import { FrameMode } from '../../contracts/enums/FrameModes';

/**
 * Formats a literal value.
 */
function formatLiteral(value: any, valueType: DSLType): string {
  switch (valueType) {
    case DSLType.Int:
    case DSLType.Color:
      return String(value);
    case DSLType.Bool:
      return value ? 'true' : 'false';
    case DSLType.CoordRel: {
      const coord = value as CoordRel;
      return `(rel ${coord.anchor} ${coord.dy} ${coord.dx})`;
    }
    case DSLType.CoordAbs: {
      const coord = value as CoordAbs;
      return `(abs ${coord.y} ${coord.x})`;
    }
    case DSLType.ObjSet: {
      const ids = value as string[];
      return `[${ids.join(' ')}]`;
    }
    default:
      return String(value);
  }
}

/**
 * Formats an expression.
 */
function formatExpr(expr: Expr, indent: number = 0): string {
  const indentStr = '  '.repeat(indent);

  switch (expr.type) {
    case 'Seq':
      const steps = expr.steps.map(step => formatExpr(step, indent + 1));
      return `(seq\n${steps.map(s => indentStr + '  ' + s).join('\n')}\n${indentStr})`;

    case 'Op':
      const args = expr.args.map(arg => formatExpr(arg, indent + 1));
      if (args.length === 0) {
        return `(${expr.name})`;
      }
      return `(${expr.name} ${args.join(' ')})`;

    case 'Let':
      return `(let ${expr.name} ${formatExpr(expr.expr, indent + 1)})`;

    case 'Var':
      return expr.name;

    case 'Literal':
      return formatLiteral(expr.value, expr.valueType);

    default:
      return String(expr);
  }
}

/**
 * Formats a program AST into canonical DSL source.
 */
export function formatDSL(ast: Expr, declared_frame: FrameMode): string {
  const frameDecl = declared_frame === FrameMode.ABSOLUTE ? ' frame:ABSOLUTE' : '';
  const exprStr = formatExpr(ast);
  return `(program${frameDecl} ${exprStr})`;
}























