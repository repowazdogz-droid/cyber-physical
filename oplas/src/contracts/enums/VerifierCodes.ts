/**
 * Verifier Why Codes
 * 
 * Structured reason codes for verifier failures.
 * Every failure must have a why enum and details.
 * 
 * Version: 1.0.0
 */

export enum VerifierWhyCode {
  // Tier 0: Schema validation
  SCHEMA_INVALID = 'schema_invalid',
  TYPE_MISMATCH = 'type_mismatch',
  MISSING_REQUIRED_FIELD = 'missing_required_field',
  PROGRAM_INVALID = 'program_invalid',
  OUTPUT_INVALID = 'output_invalid',
  
  // Tier 1: Hard invariants
  SHAPE_MISMATCH = 'shape_mismatch',
  COUNT_MISMATCH = 'count_mismatch',
  CONSERVATION_VIOLATION = 'conservation_violation',
  INVARIANT_VIOLATED = 'invariant_violated',
  DIM_MISMATCH = 'dim_mismatch',
  PALETTE_VIOLATED = 'palette_violated',
  
  // Tier 2: Example consistency
  EXAMPLE_FAILED = 'example_failed',
  OUTPUT_MISMATCH = 'output_mismatch',
  EXAMPLE_MISMATCH = 'example_mismatch',
  EXEC_ERROR = 'exec_error',
  
  // Tier 3: Generalization
  COORDINATE_HACK_DETECTED = 'coordinate_hack_detected',
  ABSOLUTE_FRAME_UNJUSTIFIED = 'absolute_frame_unjustified',
  TRANSLATION_TEST_FAILED = 'translation_test_failed',
  
  // Tier 3: Level-0 Invariance
  INVARIANCE_FAILED_PALETTE = 'invariance_failed_palette',
  INVARIANCE_FAILED_TRANSLATION = 'invariance_failed_translation',
  INVARIANCE_SKIPPED = 'invariance_skipped',
  
  // Tier 4: Counterexamples
  INVARIANCE_TEST_FAILED = 'invariance_test_failed',
  PALETTE_PERMUTATION_FAILED = 'palette_permutation_failed',
  ROTATION_TEST_FAILED = 'rotation_test_failed',
  REFLECTION_TEST_FAILED = 'reflection_test_failed',
  GENERALIZATION_FAIL_TIER4 = 'generalization_fail_tier4',
  PERTURBATION_EXEC_ERROR = 'perturbation_exec_error',
  PERTURBATION_TIER1_FAILED = 'perturbation_tier1_failed',
  PERTURBATION_UNTOUCHED_REGION_CHANGED = 'perturbation_untouched_region_changed',
  
  // Other
  RUNTIME_ERROR = 'runtime_error',
  TIMEOUT = 'timeout',
  BUDGET_EXCEEDED = 'budget_exceeded'
}

