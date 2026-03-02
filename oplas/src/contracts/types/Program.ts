/**
 * Program Types
 * 
 * DSL program structure and AST.
 * 
 * Version: 1.0.0
 */

import { FrameMode } from '../enums/FrameModes';
import { InvariantTag } from '../enums/InvariantTags';

/**
 * AST Node Types (minimal v0).
 */
export type ASTNode =
  | { type: 'Op'; name: string; args: ASTNode[] }
  | { type: 'Literal'; value: any }
  | { type: 'Var'; name: string }
  | { type: 'Let'; name: string; expr: ASTNode }
  | { type: 'Seq'; exprs: ASTNode[] };

/**
 * Program: DSL program structure.
 */
export interface Program {
  /** Program ID (hash) */
  program_id: string;
  /** DSL grammar version (hash of grammar spec) */
  dsl_grammar_version: string;
  /** DSL source */
  dsl_source: string;
  /** Canonical AST */
  ast: ASTNode;
  /** Declared frame mode */
  declared_frame: FrameMode;
  /** Expected invariants (optional, may be LLM-proposed but verifier-owned) */
  expected_invariants?: InvariantTag[];
}

/**
 * Invariants:
 * - AST must round-trip: source -> AST -> source' (canonical formatting)
 * - No unbounded loops in grammar v0
 */























