/**
 * Invariant Tags
 * 
 * Tags for expected invariants that programs should satisfy.
 * Used in concept cards and verifier checks.
 * 
 * Version: 1.0.0
 */

export enum InvariantTag {
  /** Translation invariance */
  TRANSLATION_INVARIANT = 'translation_invariant',
  /** Rotation invariance */
  ROTATION_INVARIANT = 'rotation_invariant',
  /** Reflection invariance */
  REFLECTION_INVARIANT = 'reflection_invariant',
  /** Palette permutation invariance */
  PALETTE_INVARIANT = 'palette_invariant',
  /** Scale invariance */
  SCALE_INVARIANT = 'scale_invariant',
  /** Shape preservation */
  SHAPE_PRESERVED = 'shape_preserved',
  /** Count preservation */
  COUNT_PRESERVED = 'count_preserved',
  /** Connectivity preserved */
  CONNECTIVITY_PRESERVED = 'connectivity_preserved',
  /** Color-blind safe */
  COLOR_BLIND_SAFE = 'color_blind_safe'
}























