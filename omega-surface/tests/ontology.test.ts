import { describe, it, expect } from 'vitest';
import { classifyToOntologyState } from '../src/ontology/classify.js';
import { canonicalise } from '../src/artifact/canonical.js';
import { sha256 } from '../src/artifact/hash.js';

describe('OntologyState', () => {
  it('AT-SURFACE-008: OntologyState with all four layers can be created, canonicalised, and hashed', async () => {
    const state = classifyToOntologyState([
      { id: 's1', label: 'S', description: 'd', layer: 'structure', relationships: [] },
      { id: 'c1', label: 'C', description: 'd', layer: 'constraints', falsifiable: true },
      { id: 'u1', label: 'U', description: 'd', layer: 'uncertainty', magnitude: 'high', reducible: true },
      { id: 'a1', label: 'A', description: 'd', layer: 'assumptions', sensitivity: 'high', testable: true },
    ]);
    expect(state.structure).toHaveLength(1);
    expect(state.constraints).toHaveLength(1);
    expect(state.uncertainty).toHaveLength(1);
    expect(state.assumptions).toHaveLength(1);
    expect(state.classified_at).toBeDefined();
    const can = canonicalise(state);
    expect(can).toContain('structure');
    expect(can).toContain('constraints');
    expect(can).toContain('uncertainty');
    expect(can).toContain('assumptions');
    const hash = await sha256(can);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('classifyToOntologyState sets classified_at', () => {
    const state = classifyToOntologyState([]);
    expect(state.classified_at).toBeDefined();
    expect(new Date(state.classified_at).getTime()).toBeLessThanOrEqual(
      Date.now() + 1000
    );
  });
});
