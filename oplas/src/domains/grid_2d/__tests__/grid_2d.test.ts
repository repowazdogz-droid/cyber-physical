/**
 * Grid 2D Tests
 * 
 * Contract tests for grid_2d parsing and canonicalization.
 * 
 * Version: 1.0.0
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { RawGridInput } from '../types';
import { parseGrid } from '../Parser';
import { canonicalizeGrid } from '../Canonicalizer';
import { hashCanonical } from '../../../contracts/invariants/CanonicalHashing';
import { validateSchema } from '../../../core/SchemaValidator';

function loadFixture(name: string): RawGridInput {
  const path = join(process.cwd(), 'fixtures', 'grids', `${name}.json`);
  return JSON.parse(readFileSync(path, 'utf8'));
}

describe('Grid 2D Parser', () => {
  it('should parse single color grid', () => {
    const input = loadFixture('single_color');
    const result = parseGrid(input);

    expect(result.ok).toBe(true);
    expect(result.repr).toBeDefined();
    expect(result.repr?.nodes.length).toBeGreaterThan(0);
  });

  it('should parse two separated components', () => {
    const input = loadFixture('two_separated');
    const result = parseGrid(input);

    expect(result.ok).toBe(true);
    expect(result.repr).toBeDefined();
    
    const components = result.repr?.nodes.filter(n => n.type === 'component') || [];
    expect(components.length).toBe(2);
  });

  it('should parse touching different colors', () => {
    const input = loadFixture('touching_different');
    const result = parseGrid(input);

    expect(result.ok).toBe(true);
    expect(result.repr).toBeDefined();
    
    const adjEdges = result.repr?.edges.filter(e => e.type === 'adjacent_to') || [];
    expect(adjEdges.length).toBeGreaterThan(0);
  });

  it('should parse nested containment', () => {
    const input = loadFixture('nested_containment');
    const result = parseGrid(input);

    expect(result.ok).toBe(true);
    expect(result.repr).toBeDefined();
    
    const contEdges = result.repr?.edges.filter(e => e.type === 'contained_in') || [];
    expect(contEdges.length).toBeGreaterThan(0);
  });

  it('should reject floats', () => {
    const input: RawGridInput = {
      cells: [[1.5, 2], [1, 2]]
    };
    const result = parseGrid(input);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('not an integer');
  });

  it('should reject ragged rows', () => {
    const input: RawGridInput = {
      cells: [[1, 2], [1]]
    };
    const result = parseGrid(input);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('inconsistent width');
  });
});

describe('Grid 2D Canonicalization', () => {
  it('should produce stable ordering', () => {
    const input = loadFixture('two_separated');
    const result1 = parseGrid(input);
    const result2 = parseGrid(input);

    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);

    const repr1 = canonicalizeGrid(result1.repr!);
    const repr2 = canonicalizeGrid(result2.repr!);

    // Nodes should be in same order
    expect(repr1.nodes.map(n => n.id)).toEqual(repr2.nodes.map(n => n.id));
    
    // Edges should be in same order
    const edges1 = repr1.edges.map(e => `${e.src}::${e.type}::${e.dst}`);
    const edges2 = repr2.edges.map(e => `${e.src}::${e.type}::${e.dst}`);
    expect(edges1).toEqual(edges2);
  });

  it('should produce stable hash', () => {
    const input = loadFixture('single_color');
    const result = parseGrid(input);
    expect(result.ok).toBe(true);

    const repr = canonicalizeGrid(result.repr!);
    repr.repr_id = hashCanonical(repr);

    const hash1 = repr.repr_id;
    const hash2 = hashCanonical(repr);

    expect(hash1).toBe(hash2);
  });

  it('should produce identical hash for identical grids', () => {
    const input1 = loadFixture('single_color');
    const input2 = loadFixture('single_color');

    const result1 = parseGrid(input1);
    const result2 = parseGrid(input2);

    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);

    const repr1 = canonicalizeGrid(result1.repr!);
    const repr2 = canonicalizeGrid(result2.repr!);

    repr1.repr_id = hashCanonical(repr1);
    repr2.repr_id = hashCanonical(repr2);

    expect(repr1.repr_id).toBe(repr2.repr_id);
  });
});

describe('Determinism', () => {
  it('should be deterministic across runs', () => {
    const input = loadFixture('symmetry');
    
    const run1 = parseGrid(input);
    const run2 = parseGrid(input);

    expect(run1.ok).toBe(true);
    expect(run2.ok).toBe(true);

    const repr1 = canonicalizeGrid(run1.repr!);
    const repr2 = canonicalizeGrid(run2.repr!);

    repr1.repr_id = hashCanonical(repr1);
    repr2.repr_id = hashCanonical(repr2);

    expect(repr1.repr_id).toBe(repr2.repr_id);
  });
});

describe('Schema Validation', () => {
  it('should validate canonicalized repr', () => {
    const input = loadFixture('single_color');
    const result = parseGrid(input);
    expect(result.ok).toBe(true);

    const repr = canonicalizeGrid(result.repr!);
    repr.repr_id = hashCanonical(repr);

    const validation = validateSchema(repr);
    expect(validation.ok).toBe(true);
  });
});























