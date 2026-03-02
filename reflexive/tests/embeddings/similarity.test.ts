import { describe, it, expect } from 'vitest';
import { cosineSim } from '../../src/embeddings/similarity.js';

describe('cosineSim', () => {
  it('returns 1.0 for identical vectors', () => {
    const vec = [0.6, 0.8, 0.0];
    const result = cosineSim(vec, vec);
    expect(result).toBeCloseTo(1.0, 5);
  });

  it('returns ~0.0 for orthogonal vectors', () => {
    const a = [1, 0, 0];
    const b = [0, 1, 0];
    const result = cosineSim(a, b);
    expect(result).toBeCloseTo(0.0, 5);
  });

  it('returns -1.0 for opposite vectors', () => {
    const a = [0.6, 0.8];
    const b = [-0.6, -0.8];
    const result = cosineSim(a, b);
    expect(result).toBeCloseTo(-1.0, 5);
  });

  it('throws error for dimension mismatch', () => {
    const a = [1, 2, 3];
    const b = [1, 2];
    expect(() => cosineSim(a, b)).toThrow('dimension mismatch');
  });

  it('computes known values correctly', () => {
    // [0.6, 0.8] · [0.8, 0.6] = 0.48 + 0.48 = 0.96
    const a = [0.6, 0.8];
    const b = [0.8, 0.6];
    const result = cosineSim(a, b);
    expect(result).toBeCloseTo(0.96, 5);
  });
});
