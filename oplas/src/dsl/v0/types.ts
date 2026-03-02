/**
 * DSL v0 Types
 * 
 * Type system for DSL v0.
 * 
 * Version: 1.0.0
 */

import { FrameMode } from '../../contracts/enums/FrameModes';

/**
 * DSL Type: Type in the DSL type system.
 */
export enum DSLType {
  Grid = 'Grid',
  Repr = 'Repr',
  Mask = 'Mask',
  ObjSet = 'ObjSet',
  Color = 'Color',
  CoordRel = 'CoordRel',
  CoordAbs = 'CoordAbs',
  Int = 'Int',
  Bool = 'Bool'
}

/**
 * Coordinate Relative: Relative coordinate.
 */
export interface CoordRel {
  anchor: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'center';
  dy: number;
  dx: number;
}

/**
 * Coordinate Absolute: Absolute coordinate.
 */
export interface CoordAbs {
  y: number;
  x: number;
}

/**
 * Literal Value: Typed literal value.
 */
export type LiteralValue =
  | number // Int or Color
  | boolean // Bool
  | CoordRel
  | CoordAbs
  | string[]; // ObjSet (array of node IDs)

/**
 * Expression: DSL expression.
 */
export type Expr =
  | { type: 'Seq'; steps: Expr[] }
  | { type: 'Op'; name: string; args: Expr[] }
  | { type: 'Let'; name: string; expr: Expr }
  | { type: 'Var'; name: string }
  | { type: 'Literal'; value: LiteralValue; valueType: DSLType };

/**
 * Program: Complete DSL program.
 */
export interface Program {
  /** Program ID (hash of canonical AST) */
  program_id: string;
  /** DSL grammar version */
  dsl_grammar_version: string;
  /** Declared frame mode */
  declared_frame: FrameMode;
  /** DSL source (canonical) */
  dsl_source: string;
  /** Canonical AST */
  ast: Expr;
  /** Expected invariants (optional) */
  expected_invariants?: string[];
}























