/**
 * Tier 4 Tests
 * 
 * Tests for counterexample probing and perturbations.
 * 
 * Version: 1.0.0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { validateTier4 } from '../Tier4';
import { generatePerturbations, checkPerturbationSafety } from '../Perturbations';
import { parseDSL, buildProgram } from '../../../dsl/v0';
import { parseGrid } from '../../../domains/grid_2d/Parser';
import { canonicalizeGrid } from '../../../domains/grid_2d/Canonicalizer';
import { hashCanonical } from '../../../contracts/invariants/CanonicalHashing';
import { Domain } from '../../../contracts/enums/Domains';
import { Request } from '../../../contracts/types/Request';
import { DEFAULT_BUDGETS } from '../../../contracts/types/BudgetSpec';
import { VerifierWhyCode } from '../../../contracts/enums/VerifierCodes';

function loadGridFixture(name: string): any {
  const path = join(process.cwd(), 'fixtures', 'grids', `${name}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadProgramFixture(name: string): string {
  const path = join(process.cwd(), 'fixtures', 'programs', `${name}.txt`);
  return readFileSync(path, 'utf8').trim();
}

function createTestRepr(grid: number[][]): any {
  const parseResult = parseGrid({ cells: grid });
  if (!parseResult.ok || !parseResult.repr) {
    throw new Error('Failed to parse grid');
  }
  let repr = canonicalizeGrid(parseResult.repr);
  repr.repr_id = hashCanonical(repr);
  return repr;
}

function createTestRequest(): Request {
  return {
    task_id: 'test-task',
    domain: Domain.GRID_2D,
    inputs: [],
    outputs: [],
    constraints: [],
    budgets: DEFAULT_BUDGETS,
    run_config: {
      enable_refinement: false,
      enable_vault: false
    }
  };
}

describe('Perturbations - Safety', () => {
  it('should check perturbation safety', () => {
    const original: number[][] = [
      [0, 0, 1],
      [0, 1, 1]
    ];
    const perturbed: number[][] = [
      [0, 0, 1, 2],
      [0, 1, 1, 2]
    ];

    const safety = checkPerturbationSafety(original, perturbed);
    expect(safety.ok).toBe(true);
  });

  it('should reject perturbations with excessive edit distance', () => {
    const original: number[][] = [
      [0, 0],
      [0, 0]
    ];
    const perturbed: number[][] = [
      [0, 0, 1, 1, 1, 1, 1],
      [0, 0, 1, 1, 1, 1, 1]
    ];

    const safety = checkPerturbationSafety(original, perturbed);
    expect(safety.ok).toBe(false);
    expect(safety.reason).toBe('edit_distance_exceeded');
  });
});

describe('Perturbations - Generation', () => {
  it('should generate perturbations deterministically', () => {
    const grid = loadGridFixture('two_separated');
    const repr = createTestRepr(grid.cells);
    const program = buildProgram(parseDSL(loadProgramFixture('01_simple_recolor')).ast!, 'RELATIVE').program!;

    const perturbations1 = generatePerturbations(grid.cells, repr, program.program_id, 2);
    const perturbations2 = generatePerturbations(grid.cells, repr, program.program_id, 2);

    expect(perturbations1.length).toBe(perturbations2.length);
    if (perturbations1.length > 0) {
      expect(perturbations1[0].perturbation_id).toBe(perturbations2[0].perturbation_id);
    }
  });

  it('should generate safe perturbations', () => {
    const grid = loadGridFixture('two_separated');
    const repr = createTestRepr(grid.cells);
    const program = buildProgram(parseDSL(loadProgramFixture('01_simple_recolor')).ast!, 'RELATIVE').program!;

    const perturbations = generatePerturbations(grid.cells, repr, program.program_id, 2);

    for (const perturbation of perturbations) {
      const safety = checkPerturbationSafety(grid.cells, perturbation.perturbed_grid);
      expect(safety.ok).toBe(true);
    }
  });
});

describe('Tier 4 - Validation', () => {
  it('should run Tier 4 validation', () => {
    const source = loadProgramFixture('01_simple_recolor');
    const parse = parseDSL(source);
    expect(parse.ok).toBe(true);
    if (!parse.ast || !parse.declared_frame) return;

    const build = buildProgram(parse.ast, parse.declared_frame);
    expect(build.ok).toBe(true);
    if (!build.program) return;

    const grid = loadGridFixture('single_color');
    const repr = createTestRepr(grid.cells);
    if (!repr) return;

    const request = createTestRequest();
    const examples = [
      {
        input_grid: grid.cells,
        expected_output_grid: grid.cells
      }
    ];

    const result = validateTier4(
      request,
      repr,
      build.program,
      grid.cells,
      grid.cells,
      examples,
      'run_test',
      repr.repr_id,
      build.program.program_id,
      2
    );

    expect(result.events.length).toBeGreaterThan(0);
    expect(result.perturbations_passed + result.perturbations_failed).toBeGreaterThanOrEqual(0);
  });
});























