/**
 * Tests for Signal Parsers.
 * Ensures: deterministic ordering, bounded outputs, no internal/system leakage.
 */

import { parseNumber, parseEnum, parseBoolean, parseString } from '../SignalParsers';

describe('Signal Parsers', () => {
  describe('parseNumber', () => {
    test('parses valid number', () => {
      const result = parseNumber(42);
      expect(result.value).toBe(42);
      expect(result.issues.length).toBe(0);
    });

    test('parses string number', () => {
      const result = parseNumber('42');
      expect(result.value).toBe(42);
      expect(result.issues.length).toBe(0);
    });

    test('enforces min bound', () => {
      const result = parseNumber(-10, { min: 0 });
      expect(result.value).toBe(0);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].severity).toBe('warn');
    });

    test('enforces max bound', () => {
      const result = parseNumber(1000, { max: 100 });
      expect(result.value).toBe(100);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].severity).toBe('warn');
    });

    test('handles NaN', () => {
      const result = parseNumber(NaN);
      expect(result.value).toBeUndefined();
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].severity).toBe('critical');
    });

    test('uses default value on failure', () => {
      const result = parseNumber('invalid', { defaultValue: 0 });
      expect(result.value).toBe(0);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    test('is deterministic', () => {
      const result1 = parseNumber(42, { min: 0, max: 100 });
      const result2 = parseNumber(42, { min: 0, max: 100 });
      expect(result1.value).toBe(result2.value);
      expect(result1.issues).toEqual(result2.issues);
    });

    test('bounds issues to max 10', () => {
      // This is implicit - parser should not generate more than 10 issues per parse
      const result = parseNumber('invalid');
      expect(result.issues.length).toBeLessThanOrEqual(10);
    });
  });

  describe('parseEnum', () => {
    test('parses exact match', () => {
      const result = parseEnum('H1', ['H1', 'H2', 'H3']);
      expect(result.value).toBe('H1');
      expect(result.issues.length).toBe(0);
    });

    test('parses case-insensitive match', () => {
      const result = parseEnum('h1', ['H1', 'H2', 'H3']);
      expect(result.value).toBe('H1');
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].severity).toBe('info');
    });

    test('handles missing value', () => {
      const result = parseEnum(null, ['H1', 'H2', 'H3']);
      expect(result.value).toBeUndefined();
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].severity).toBe('critical');
    });

    test('handles invalid value', () => {
      const result = parseEnum('INVALID', ['H1', 'H2', 'H3']);
      expect(result.value).toBeUndefined();
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].severity).toBe('critical');
    });

    test('is deterministic', () => {
      const result1 = parseEnum('H1', ['H1', 'H2', 'H3']);
      const result2 = parseEnum('H1', ['H1', 'H2', 'H3']);
      expect(result1.value).toBe(result2.value);
      expect(result1.issues).toEqual(result2.issues);
    });
  });

  describe('parseBoolean', () => {
    test('parses boolean true', () => {
      const result = parseBoolean(true);
      expect(result.value).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    test('parses boolean false', () => {
      const result = parseBoolean(false);
      expect(result.value).toBe(false);
      expect(result.issues.length).toBe(0);
    });

    test('parses string "true"', () => {
      const result = parseBoolean('true');
      expect(result.value).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    test('parses number 1 as true', () => {
      const result = parseBoolean(1);
      expect(result.value).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    test('parses number 0 as false', () => {
      const result = parseBoolean(0);
      expect(result.value).toBe(false);
      expect(result.issues.length).toBe(0);
    });

    test('handles missing value', () => {
      const result = parseBoolean(null);
      expect(result.value).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].severity).toBe('warn');
    });

    test('is deterministic', () => {
      const result1 = parseBoolean(true);
      const result2 = parseBoolean(true);
      expect(result1.value).toBe(result2.value);
      expect(result1.issues).toEqual(result2.issues);
    });
  });

  describe('parseString', () => {
    test('parses valid string', () => {
      const result = parseString('hello');
      expect(result.value).toBe('hello');
      expect(result.issues.length).toBe(0);
    });

    test('bounds string length', () => {
      const longString = 'A'.repeat(600);
      const result = parseString(longString, 500);
      expect(result.value?.length).toBe(500);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].severity).toBe('warn');
    });

    test('handles missing value', () => {
      const result = parseString(null);
      expect(result.value).toBeUndefined();
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].severity).toBe('warn');
    });

    test('is deterministic', () => {
      const result1 = parseString('hello', 100);
      const result2 = parseString('hello', 100);
      expect(result1.value).toBe(result2.value);
      expect(result1.issues).toEqual(result2.issues);
    });
  });

  describe('no internal/system leakage', () => {
    test('issue messages do not contain internal/system strings', () => {
      const result = parseNumber('invalid');
      for (const issue of result.issues) {
        const message = issue.message.toLowerCase();
        expect(message).not.toContain('internal');
        expect(message).not.toContain('system');
      }
    });
  });
});








































