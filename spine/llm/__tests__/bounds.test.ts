/**
 * LLM Bounds Tests
 * 
 * Tests for output bounding and sanitization.
 */

import { boundString, boundStringArray, safeJsonParse, removeMarkdownFences } from '../LLMOutputBounds';

describe('boundString', () => {
  it('should return string unchanged if within bounds', () => {
    expect(boundString('hello', 10)).toBe('hello');
  });

  it('should truncate string exceeding bounds', () => {
    const long = 'a'.repeat(100);
    const result = boundString(long, 50);
    expect(result.length).toBe(50);
    expect(result.endsWith('...')).toBe(true);
  });

  it('should handle empty string', () => {
    expect(boundString('', 10)).toBe('');
  });

  it('should handle non-string input', () => {
    expect(boundString(null as any, 10)).toBe('');
    expect(boundString(123 as any, 10)).toBe('');
  });
});

describe('boundStringArray', () => {
  it('should bound array length', () => {
    const arr = Array(20).fill('item');
    const result = boundStringArray(arr, 10, 100);
    expect(result.length).toBe(10);
  });

  it('should bound individual string lengths', () => {
    const arr = ['short', 'a'.repeat(200), 'another'];
    const result = boundStringArray(arr, 10, 50);
    expect(result[1].length).toBe(50);
    expect(result[1].endsWith('...')).toBe(true);
  });

  it('should filter out non-strings', () => {
    const arr = ['valid', 123, null, 'also valid'];
    const result = boundStringArray(arr, 10, 100);
    expect(result).toEqual(['valid', 'also valid']);
  });

  it('should handle empty array', () => {
    expect(boundStringArray([], 10, 100)).toEqual([]);
  });
});

describe('safeJsonParse', () => {
  it('should parse valid JSON', () => {
    const result = safeJsonParse('{"key": "value"}');
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ key: 'value' });
  });

  it('should remove markdown fences', () => {
    const result = safeJsonParse('```json\n{"key": "value"}\n```');
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ key: 'value' });
  });

  it('should handle invalid JSON', () => {
    const result = safeJsonParse('not json');
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should remove boilerplate text', () => {
    const text = 'I can\'t access the repo. Here is the JSON: {"key": "value"}';
    const result = safeJsonParse(text);
    // Should still parse the JSON part (boilerplate removed, JSON remains)
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ key: 'value' });
    // The boilerplate was removed before parsing, so the parsed data should be clean
    // Check that the original text contained boilerplate (before removal)
    expect(text.toLowerCase()).toMatch(/\b(i can'?t|i cannot)\b/);
    // But the parsed result should be clean JSON
    expect(JSON.stringify(result.data)).toBe('{"key":"value"}');
  });

  it('should handle non-string input', () => {
    const result = safeJsonParse(null as any);
    expect(result.ok).toBe(false);
  });
});

describe('removeMarkdownFences', () => {
  it('should remove opening and closing fences', () => {
    const text = '```json\n{"key": "value"}\n```';
    const result = removeMarkdownFences(text);
    expect(result).toBe('{"key": "value"}');
  });

  it('should handle code fences without language', () => {
    const text = '```\ncontent\n```';
    const result = removeMarkdownFences(text);
    expect(result).toBe('content');
  });

  it('should handle text without fences', () => {
    const text = 'plain text';
    expect(removeMarkdownFences(text)).toBe('plain text');
  });
});



