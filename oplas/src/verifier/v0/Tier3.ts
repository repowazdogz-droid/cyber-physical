/**
 * Tier 3 — Level-0 Invariance Tests
 * 
 * Tests generalization pressure via deterministic invariance tests.
 * 
 * Version: 1.0.0
 */

import { VerifierTraceEvent } from './types';
import { VerifierWhyCode } from '../../contracts/enums/VerifierCodes';
import { Request } from '../../contracts/types/Request';
import { CanonicalRepresentation } from '../../contracts/types/Repr';
import { Program } from '../../dsl/v0/types';
import { Grid } from '../../executor/v0/types';
import { testPalettePermutation, testTranslationInvariance } from './InvarianceTests';

export interface Tier3Result {
  ok: boolean;
  events: VerifierTraceEvent[];
  why_failed?: VerifierWhyCode;
  details?: Record<string, any>;
  trace_events?: VerifierTraceEvent[];
  palette_test_passed: boolean;
  translation_test_passed: boolean;
}

/**
 * Validates Tier 3 (Level-0 invariance tests).
 */
export function validateTier3(
  request: Request,
  repr: CanonicalRepresentation,
  program: Program,
  inputGrid: Grid,
  outputGrid: Grid,
  examples: Array<{ input_grid: Grid; expected_output_grid: Grid }>,
  run_id: string,
  repr_id: string,
  program_id: string,
  enableInvariance: boolean = true
): Tier3Result {
  const events: VerifierTraceEvent[] = [];

  // Tier 3 start
  events.push({
    run_id,
    repr_id,
    program_id,
    tier: 3,
    status: 'skip',
    why: VerifierWhyCode.INVARIANCE_SKIPPED,
    details: {}
  });

  if (!enableInvariance) {
    events.push({
      run_id,
      repr_id,
      program_id,
      tier: 3,
      status: 'skip',
      why: VerifierWhyCode.INVARIANCE_SKIPPED,
      details: { reason: 'invariance_tests_disabled' }
    });
    return {
      ok: true,
      events,
      trace_events: events,
      palette_test_passed: false,
      translation_test_passed: false
    };
  }

  let paletteTestPassed = false;
  let translationTestPassed = false;
  let allTestsPassed = true;

  // Test palette permutation (always run if examples exist)
  if (examples.length > 0) {
    const example = examples[0]; // Use first example
    const paletteTest = testPalettePermutation(
      program,
      repr,
      example.input_grid,
      example.expected_output_grid
    );

    if (paletteTest.details?.skipped) {
      events.push({
        run_id,
        repr_id,
        program_id,
        tier: 3,
        status: 'skip',
        why: VerifierWhyCode.INVARIANCE_SKIPPED,
        details: { test: 'palette_permutation', reason: paletteTest.details.reason }
      });
    } else if (paletteTest.ok) {
      paletteTestPassed = true;
      events.push({
        run_id,
        repr_id,
        program_id,
        tier: 3,
        status: 'pass',
        why: VerifierWhyCode.INVARIANCE_SKIPPED, // Placeholder
        details: { test: 'palette_permutation', passed: true }
      });
    } else {
      allTestsPassed = false;
      events.push({
        run_id,
        repr_id,
        program_id,
        tier: 3,
        status: 'fail',
        why: VerifierWhyCode.INVARIANCE_FAILED_PALETTE,
        details: {
          test: 'palette_permutation',
          error: paletteTest.error,
          ...paletteTest.details
        }
      });
    }
  }

  // Test translation invariance (only if eligible)
  if (examples.length > 0) {
    const example = examples[0]; // Use first example
    const translationTest = testTranslationInvariance(
      program,
      repr,
      example.input_grid,
      example.expected_output_grid
    );

    if (translationTest.details?.skipped) {
      events.push({
        run_id,
        repr_id,
        program_id,
        tier: 3,
        status: 'skip',
        why: VerifierWhyCode.INVARIANCE_SKIPPED,
        details: { test: 'translation', reason: translationTest.details.reason }
      });
    } else if (translationTest.ok) {
      translationTestPassed = true;
      events.push({
        run_id,
        repr_id,
        program_id,
        tier: 3,
        status: 'pass',
        why: VerifierWhyCode.INVARIANCE_SKIPPED, // Placeholder
        details: { test: 'translation', passed: true }
      });
    } else {
      // Translation failure doesn't block write-back for ABSOLUTE programs
      if (program.declared_frame === FrameMode.ABSOLUTE) {
        events.push({
          run_id,
          repr_id,
          program_id,
          tier: 3,
          status: 'skip',
          why: VerifierWhyCode.INVARIANCE_SKIPPED,
          details: {
            test: 'translation',
            skipped: true,
            reason: 'absolute_frame_allows_translation_failure'
          }
        });
      } else {
        allTestsPassed = false;
        events.push({
          run_id,
          repr_id,
          program_id,
          tier: 3,
          status: 'fail',
          why: VerifierWhyCode.INVARIANCE_FAILED_TRANSLATION,
          details: {
            test: 'translation',
            error: translationTest.error,
            ...translationTest.details
          }
        });
      }
    }
  }

  // Tier 3 result
  if (allTestsPassed) {
    events.push({
      run_id,
      repr_id,
      program_id,
      tier: 3,
      status: 'pass',
      why: VerifierWhyCode.INVARIANCE_SKIPPED, // Placeholder
      details: {
        palette_test_passed: paletteTestPassed,
        translation_test_passed: translationTestPassed
      }
    });
  }

  return {
    ok: allTestsPassed,
    events,
    why_failed: allTestsPassed ? undefined : VerifierWhyCode.INVARIANCE_FAILED_PALETTE,
    details: {
      palette_test_passed: paletteTestPassed,
      translation_test_passed: translationTestPassed
    },
    trace_events: events,
    palette_test_passed: paletteTestPassed,
    translation_test_passed: translationTestPassed
  };
}

