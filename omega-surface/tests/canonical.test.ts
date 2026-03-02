import { describe, it, expect } from 'vitest';
import { canonicalise } from '../src/artifact/canonical.js';

describe('canonicalise', () => {
  it('AT-SURFACE-001: produces identical output for identical input regardless of key order', () => {
    const a = { z: 1, a: 2, m: 3 };
    const b = { a: 2, m: 3, z: 1 };
    expect(canonicalise(a)).toBe(canonicalise(b));
  });

  it('AT-SURFACE-002: sha256("hello") known hash is tested in hash.test.ts', () => {
    expect(canonicalise('hello')).toBe('"hello"');
  });

  it('AT-SURFACE-015: handles nested objects, arrays, nulls, booleans, numbers, strings', () => {
    expect(canonicalise(null)).toBe('null');
    expect(canonicalise(true)).toBe('true');
    expect(canonicalise(false)).toBe('false');
    expect(canonicalise(0)).toBe('0');
    expect(canonicalise(42)).toBe('42');
    expect(canonicalise('')).toBe('""');
    expect(canonicalise([])).toBe('[]');
    expect(canonicalise({})).toBe('{}');
    expect(canonicalise([1, 2, 3])).toBe('[1,2,3]');
    expect(canonicalise({ a: 1, b: 2 })).toBe('{"a":1,"b":2}');
    expect(canonicalise({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
    expect(canonicalise({ x: null, y: [true, false] })).toBe(
      '{"x":null,"y":[true,false]}'
    );
  });

  it('handles -0 as 0', () => {
    expect(canonicalise(-0)).toBe('0');
    expect(canonicalise(0)).toBe('0');
  });

  it('omits undefined values', () => {
    const obj = { a: 1, b: undefined, c: 2 };
    expect(canonicalise(obj)).toBe('{"a":1,"c":2}');
  });

  it('handles non-finite numbers as null', () => {
    expect(canonicalise(NaN)).toBe('null');
    expect(canonicalise(Infinity)).toBe('null');
    expect(canonicalise(-Infinity)).toBe('null');
  });

  it('handles Unicode strings', () => {
    expect(canonicalise('café')).toBe(JSON.stringify('café'));
  });

  it('handles deep nesting', () => {
    const deep = { a: { b: { c: [1, { d: 2 }] } } };
    const out = canonicalise(deep);
    expect(out).toContain('"a"');
    expect(out).toContain('"b"');
    expect(out).toContain('"c"');
    expect(out).toContain('"d"');
    expect(JSON.parse(out)).toEqual(deep);
  });
});
