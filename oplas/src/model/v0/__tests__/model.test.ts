/**
 * Model Adapter v0 Tests
 * 
 * Tests for model adapter v0.
 * 
 * Version: 1.0.0
 */

import { describe, it, expect } from 'vitest';
import { StubModelAdapter } from '../StubAdapter';
import { ReplayModelAdapter } from '../ReplayAdapter';
import { validateProposeOutput, validateRepairOutput } from '../ModelAdapter';
import { propose_program } from '../ModelAdapter';
import { runRefinementLoop } from '../RefinementLoop';
import { Domain } from '../../../contracts/enums/Domains';
import { Request } from '../../../contracts/types/Request';
import { DEFAULT_BUDGETS } from '../../../contracts/types/BudgetSpec';
import { parseGrid } from '../../../domains/grid_2d/Parser';
import { canonicalizeGrid } from '../../../domains/grid_2d/Canonicalizer';
import { hashCanonical } from '../../../contracts/invariants/CanonicalHashing';
import { readFileSync } from 'fs';
import { join } from 'path';

function loadGridFixture(name: string): any {
  const path = join(process.cwd(), 'fixtures', 'grids', `${name}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

describe('Model Adapter v0 - Schema Validation', () => {
  it('should validate propose output schema', () => {
    const validOutput = {
      candidates: [
        {
          dsl: '(seq (recolor (input) 0 1))',
          expected_invariants: ['shape_preserved'],
          rationale_tags: ['simple_recolor']
        }
      ],
      temperature_id: 'low'
    };

    const result = validateProposeOutput(validOutput);
    expect(result.ok).toBe(true);
  });

  it('should reject invalid propose output', () => {
    const invalidOutput = {
      candidates: [],
      temperature_id: 'low'
    };

    const result = validateProposeOutput(invalidOutput);
    expect(result.ok).toBe(false);
  });

  it('should validate repair output schema', () => {
    const validOutput = {
      dsl_full: '(seq (recolor (input) 0 1))'
    };

    const result = validateRepairOutput(validOutput);
    expect(result.ok).toBe(true);
  });

  it('should reject invalid repair output', () => {
    const invalidOutput = {
      dsl_patch: null,
      dsl_full: null
    };

    const result = validateRepairOutput(invalidOutput);
    expect(result.ok).toBe(false);
  });
});

describe('Model Adapter v0 - Stub Adapter', () => {
  it('should propose programs', async () => {
    const adapter = new StubModelAdapter();
    
    const request: Request = {
      task_id: 'test',
      domain: Domain.GRID_2D,
      inputs: [],
      outputs: [],
      budgets: DEFAULT_BUDGETS,
      run_config: {}
    };

    const grid = loadGridFixture('single_color');
    const parseResult = parseGrid({ cells: grid.cells });
    expect(parseResult.ok && parseResult.repr).toBe(true);
    if (!parseResult.repr) return;

    let repr = canonicalizeGrid(parseResult.repr);
    repr.repr_id = hashCanonical(repr);

    const input = {
      request,
      repr,
      concept_shortlist: [],
      budgets: {
        max_candidates: 5,
        max_tokens: 1000
      }
    };

    const output = await adapter.propose_program(input);
    expect(output.candidates.length).toBeGreaterThan(0);
    expect(output.candidates[0].dsl).toBeDefined();
  });

  it('should repair programs', async () => {
    const adapter = new StubModelAdapter();
    
    const input = {
      failure_trace: {
        highest_tier_passed: 1,
        why_failed: 'example_mismatch',
        failure_details: {},
        cost_breakdown: {
          n_nodes: 5,
          n_ops: 1,
          n_params: 0,
          n_literals: 2
        }
      },
      repr: {} as any,
      prior_program: {
        dsl: '(seq (recolor (input) 0 1))',
        ast_metrics: {
          n_nodes: 5,
          n_ops: 1,
          n_params: 0,
          n_literals: 2
        }
      }
    };

    const output = await adapter.repair_program(input);
    expect(output.dsl_full || output.dsl_patch).toBeDefined();
  });
});

describe('Model Adapter v0 - propose_program wrapper', () => {
  it('should validate and log propose calls', async () => {
    const adapter = new StubModelAdapter();
    
    const request: Request = {
      task_id: 'test',
      domain: Domain.GRID_2D,
      inputs: [],
      outputs: [],
      budgets: DEFAULT_BUDGETS,
      run_config: {}
    };

    const grid = loadGridFixture('single_color');
    const parseResult = parseGrid({ cells: grid.cells });
    expect(parseResult.ok && parseResult.repr).toBe(true);
    if (!parseResult.repr) return;

    let repr = canonicalizeGrid(parseResult.repr);
    repr.repr_id = hashCanonical(repr);

    const input = {
      request,
      repr,
      concept_shortlist: [],
      budgets: {
        max_candidates: 5,
        max_tokens: 1000
      }
    };

    const result = await propose_program(adapter, input);
    expect(result.ok).toBe(true);
    expect(result.output).toBeDefined();
    expect(result.log).toBeDefined();
    expect(result.log?.model_id).toBe('stub');
  });
});























