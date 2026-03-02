/**
 * DSL v0 Grammar
 * 
 * Grammar definition for DSL v0.
 * Simple s-expression style for minimal parser complexity.
 * 
 * Version: 1.0.0
 */

import { DSLType, Expr, CoordRel, CoordAbs, LiteralValue } from './types';
import { FrameMode } from '../../contracts/enums/FrameModes';

/**
 * DSL Grammar v0:
 * 
 * Program := (program frame:FRAME expr)
 * Expr := Seq | Op | Let | Var | Literal
 * Seq := (seq expr*)
 * Op := (op_name arg*)
 * Let := (let name expr)
 * Var := var_name
 * Literal := int | bool | coord_rel | coord_abs | objset
 * 
 * coord_rel := (rel anchor dy dx)
 * coord_abs := (abs y x)
 * objset := [id*]
 */

export const DSL_GRAMMAR_VERSION = '1.0.0';

/**
 * Operator signatures (for validation).
 */
export const OPERATOR_SIGNATURES: Record<string, { args: DSLType[]; returns: DSLType }> = {
  select_components: {
    args: [DSLType.Repr, DSLType.Bool], // predicate as bool expr (simplified for v0)
    returns: DSLType.ObjSet
  },
  mask_from_objects: {
    args: [DSLType.Repr, DSLType.ObjSet],
    returns: DSLType.Mask
  },
  recolor: {
    args: [DSLType.Grid, DSLType.Mask, DSLType.Color, DSLType.Color], // grid, mask, from?, to
    returns: DSLType.Grid
  },
  crop_to_bbox: {
    args: [DSLType.Grid, DSLType.ObjSet], // or Mask
    returns: DSLType.Grid
  },
  paste_at: {
    args: [DSLType.Grid, DSLType.Grid, DSLType.CoordRel], // or CoordAbs
    returns: DSLType.Grid
  }
};

/**
 * Allowed operators (v0).
 */
export const ALLOWED_OPERATORS = Object.keys(OPERATOR_SIGNATURES);























