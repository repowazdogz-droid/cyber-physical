/**
 * Pretty JSON Helper Tests
 */

function prettyJson(obj: any): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return '';
  }
}

describe('prettyJson', () => {
  it('should format object with 2-space indentation', () => {
    const obj = { a: 1, b: 2 };
    const result = prettyJson(obj);
    expect(result).toContain('  '); // 2 spaces
    expect(result).toContain('"a"');
    expect(result).toContain('"b"');
  });

  it('should handle nested objects', () => {
    const obj = { a: { b: { c: 1 } } };
    const result = prettyJson(obj);
    expect(result).toContain('"a"');
    expect(result).toContain('"b"');
    expect(result).toContain('"c"');
  });

  it('should return empty string on error', () => {
    const circular: any = {};
    circular.self = circular;
    const result = prettyJson(circular);
    expect(result).toBe('');
  });

  it('should handle arrays', () => {
    const obj = { items: [1, 2, 3] };
    const result = prettyJson(obj);
    expect(result).toContain('[');
    expect(result).toContain(']');
  });
});







































