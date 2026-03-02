/**
 * DSL v0 Parser
 * 
 * Parses DSL source into AST.
 * Simple s-expression parser.
 * 
 * Version: 1.0.0
 */

import { Expr, DSLType, CoordRel, CoordAbs, LiteralValue } from './types';
import { FrameMode } from '../../contracts/enums/FrameModes';
import { ALLOWED_OPERATORS } from './grammar';

export interface ParseResult {
  ok: boolean;
  ast?: Expr;
  declared_frame?: FrameMode;
  error?: string;
}

/**
 * Tokenizes DSL source.
 */
function tokenize(source: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inString = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];

    if (char === '"' && (i === 0 || source[i - 1] !== '\\')) {
      inString = !inString;
      if (!inString && current) {
        tokens.push(`"${current}"`);
        current = '';
      }
      continue;
    }

    if (inString) {
      current += char;
      continue;
    }

    if (char === '(' || char === ')' || char === '[' || char === ']' || char === ':') {
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
      tokens.push(char);
    } else if (/\s/.test(char)) {
      if (current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    tokens.push(current.trim());
  }

  return tokens.filter(t => t.length > 0);
}

/**
 * Parses a list expression.
 */
function parseList(tokens: string[], pos: { index: number }): Expr | null {
  if (pos.index >= tokens.length) return null;
  if (tokens[pos.index] !== '(') return null;

  pos.index++; // consume '('
  const items: string[] = [];

  while (pos.index < tokens.length && tokens[pos.index] !== ')') {
    items.push(tokens[pos.index]);
    pos.index++;
  }

  if (pos.index >= tokens.length || tokens[pos.index] !== ')') {
    return null;
  }

  pos.index++; // consume ')'

  if (items.length === 0) return null;

  const first = items[0];

  // (seq ...)
  if (first === 'seq') {
    const steps: Expr[] = [];
    const stepPos = { index: 1 };
    while (stepPos.index < items.length) {
      const step = parseExpr(items, stepPos);
      if (!step) return null;
      steps.push(step);
    }
    return { type: 'Seq', steps };
  }

  // (let name expr)
  if (first === 'let' && items.length === 3) {
    const name = items[1];
    const exprPos = { index: 2 };
    const expr = parseExpr(items, exprPos);
    if (!expr || exprPos.index !== items.length) return null;
    return { type: 'Let', name, expr };
  }

  // (rel anchor dy dx) or (abs y x)
  if (first === 'rel' && items.length === 4) {
    const anchor = items[1] as CoordRel['anchor'];
    const dy = parseInt(items[2], 10);
    const dx = parseInt(items[3], 10);
    if (isNaN(dy) || isNaN(dx)) return null;
    return {
      type: 'Literal',
      value: { anchor, dy, dx } as CoordRel,
      valueType: DSLType.CoordRel
    };
  }

  if (first === 'abs' && items.length === 3) {
    const y = parseInt(items[1], 10);
    const x = parseInt(items[2], 10);
    if (isNaN(y) || isNaN(x)) return null;
    return {
      type: 'Literal',
      value: { y, x } as CoordAbs,
      valueType: DSLType.CoordAbs
    };
  }

  // (op_name ...)
  if (ALLOWED_OPERATORS.includes(first)) {
    const args: Expr[] = [];
    const argPos = { index: 1 };
    while (argPos.index < items.length) {
      const arg = parseExpr(items, argPos);
      if (!arg) return null;
      args.push(arg);
    }
    return { type: 'Op', name: first, args };
  }

  return null;
}

/**
 * Parses an expression.
 */
function parseExpr(tokens: string[], pos: { index: number }): Expr | null {
  if (pos.index >= tokens.length) return null;

  const token = tokens[pos.index];

  // List expression
  if (token === '(') {
    return parseList(tokens, pos);
  }

  // Array literal [id*]
  if (token === '[') {
    pos.index++; // consume '['
    const ids: string[] = [];
    while (pos.index < tokens.length && tokens[pos.index] !== ']') {
      ids.push(tokens[pos.index]);
      pos.index++;
    }
    if (pos.index >= tokens.length || tokens[pos.index] !== ']') return null;
    pos.index++; // consume ']'
    return {
      type: 'Literal',
      value: ids,
      valueType: DSLType.ObjSet
    };
  }

  // Integer literal
  if (/^-?\d+$/.test(token)) {
    pos.index++;
    return {
      type: 'Literal',
      value: parseInt(token, 10),
      valueType: DSLType.Int
    };
  }

  // Boolean literal
  if (token === 'true' || token === 'false') {
    pos.index++;
    return {
      type: 'Literal',
      value: token === 'true',
      valueType: DSLType.Bool
    };
  }

  // Variable reference
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
    pos.index++;
    return { type: 'Var', name: token };
  }

  return null;
}

/**
 * Parses DSL source into AST.
 */
export function parseDSL(source: string): ParseResult {
  try {
    const tokens = tokenize(source);
    if (tokens.length === 0) {
      return { ok: false, error: 'Empty source' };
    }

    // Parse program header: (program frame:FRAME expr)
    if (tokens[0] !== '(' || tokens[1] !== 'program') {
      return { ok: false, error: 'Program must start with (program ...)' };
    }

    let pos = { index: 2 };
    let declared_frame: FrameMode = FrameMode.RELATIVE;

    // Parse frame declaration
    if (pos.index < tokens.length && tokens[pos.index] === 'frame') {
      pos.index++;
      if (pos.index >= tokens.length || tokens[pos.index] !== ':') {
        return { ok: false, error: 'Expected : after frame' };
      }
      pos.index++;
      if (pos.index >= tokens.length) {
        return { ok: false, error: 'Expected frame mode after :' };
      }
      const frameToken = tokens[pos.index];
      if (frameToken === 'RELATIVE') {
        declared_frame = FrameMode.RELATIVE;
      } else if (frameToken === 'ABSOLUTE') {
        declared_frame = FrameMode.ABSOLUTE;
      } else {
        return { ok: false, error: `Invalid frame mode: ${frameToken}` };
      }
      pos.index++;
    }

    // Parse main expression
    const expr = parseExpr(tokens, pos);
    if (!expr) {
      return { ok: false, error: 'Failed to parse expression' };
    }

    if (pos.index < tokens.length - 1 || (pos.index === tokens.length - 1 && tokens[pos.index] !== ')')) {
      return { ok: false, error: 'Unexpected tokens after expression' };
    }

    return {
      ok: true,
      ast: expr,
      declared_frame
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Parse error'
    };
  }
}























