/**
 * Program Builder
 * 
 * Builds complete Program structure with canonicalization and hashing.
 * 
 * Version: 1.0.0
 */

import { Program, Expr } from './types';
import { FrameMode } from '../../contracts/enums/FrameModes';
import { DSL_GRAMMAR_VERSION } from './grammar';
import { canonicalizeAST } from './Canonicalizer';
import { formatDSL } from './Formatter';
import { hashCanonical } from '../../contracts/invariants/CanonicalHashing';
import { validateFrame } from './FrameValidator';

export interface BuildResult {
  ok: boolean;
  program?: Program;
  errors: string[];
}

/**
 * Builds a Program from AST and frame declaration.
 */
export function buildProgram(ast: Expr, declared_frame: FrameMode): BuildResult {
  const errors: string[] = [];

  // Canonicalize AST
  const canonicalAST = canonicalizeAST(ast);

  // Validate frame rules
  const frameValidation = validateFrame(canonicalAST, declared_frame);
  if (!frameValidation.ok) {
    errors.push(...frameValidation.errors);
  }

  // Format canonical source
  const dsl_source = formatDSL(canonicalAST, declared_frame);

  // Compute program_id (hash of canonical AST)
  const program_id = hashCanonical({
    dsl_grammar_version: DSL_GRAMMAR_VERSION,
    declared_frame,
    ast: canonicalAST
  });

  const program: Program = {
    program_id,
    dsl_grammar_version: DSL_GRAMMAR_VERSION,
    declared_frame,
    dsl_source,
    ast: canonicalAST
  };

  return {
    ok: errors.length === 0,
    program,
    errors
  };
}























