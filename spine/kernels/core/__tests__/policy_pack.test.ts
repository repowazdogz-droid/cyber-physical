/**
 * Tests for Policy Pack.
 * Ensures: determinism, bounded output, no Date.now usage in decision logic.
 */

import {
  biasTowardHarderOutcome,
  treatAmbiguityAsWorst,
  disallowOutcomes,
  overrideOutcomeWhen,
  timeBoxOutcome,
  boundedText,
  safeLabel
} from '../PolicyPack';

describe('Policy Pack', () => {
  describe('biasTowardHarderOutcome', () => {
    test('biases to next harder outcome', () => {
      const order = ['S1', 'S2', 'S3', 'S4'];
      const result = biasTowardHarderOutcome(order, 'S2');
      expect(result).toBe('S3');
    });

    test('stays at hardest if already at end', () => {
      const order = ['S1', 'S2', 'S3', 'S4'];
      const result = biasTowardHarderOutcome(order, 'S4');
      expect(result).toBe('S4');
    });

    test('defaults to hardest if outcome not in order', () => {
      const order = ['S1', 'S2', 'S3', 'S4'];
      const result = biasTowardHarderOutcome(order, 'UNKNOWN');
      expect(result).toBe('S4');
    });

    test('is deterministic', () => {
      const order = ['S1', 'S2', 'S3', 'S4'];
      const result1 = biasTowardHarderOutcome(order, 'S2');
      const result2 = biasTowardHarderOutcome(order, 'S2');
      expect(result1).toBe(result2);
    });
  });

  describe('treatAmbiguityAsWorst', () => {
    test('returns input unchanged if no ambiguity', () => {
      const input = {
        altitudeBand: 'A1',
        uncertainty: { altitudeBand: false }
      };
      const result = treatAmbiguityAsWorst(
        { authorityKey: 'altitudeBand' },
        input
      );
      expect(result).toEqual(input);
    });

    test('is deterministic', () => {
      const input = {
        altitudeBand: 'A1',
        uncertainty: { altitudeBand: false }
      };
      const result1 = treatAmbiguityAsWorst(
        { authorityKey: 'altitudeBand' },
        input
      );
      const result2 = treatAmbiguityAsWorst(
        { authorityKey: 'altitudeBand' },
        input
      );
      expect(result1).toEqual(result2);
    });
  });

  describe('disallowOutcomes', () => {
    test('returns disallow info if outcome is disallowed', () => {
      const checker = disallowOutcomes(['S4'], 'Safety violation');
      const result = checker('S4');
      expect(result).toEqual({ disallowed: true, reason: 'Safety violation' });
    });

    test('returns null if outcome is allowed', () => {
      const checker = disallowOutcomes(['S4'], 'Safety violation');
      const result = checker('S1');
      expect(result).toBeNull();
    });

    test('is deterministic', () => {
      const checker = disallowOutcomes(['S4'], 'Safety violation');
      const result1 = checker('S4');
      const result2 = checker('S4');
      expect(result1).toEqual(result2);
    });
  });

  describe('overrideOutcomeWhen', () => {
    test('returns override info if predicate is true', () => {
      const checker = overrideOutcomeWhen(
        (input: { value: number }) => input.value > 100,
        'S4',
        'Value too high'
      );
      const result = checker({ value: 150 });
      expect(result).toEqual({
        override: true,
        outcome: 'S4',
        reason: 'Value too high'
      });
    });

    test('returns null if predicate is false', () => {
      const checker = overrideOutcomeWhen(
        (input: { value: number }) => input.value > 100,
        'S4',
        'Value too high'
      );
      const result = checker({ value: 50 });
      expect(result).toBeNull();
    });

    test('is deterministic', () => {
      const checker = overrideOutcomeWhen(
        (input: { value: number }) => input.value > 100,
        'S4',
        'Value too high'
      );
      const result1 = checker({ value: 150 });
      const result2 = checker({ value: 150 });
      expect(result1).toEqual(result2);
    });
  });

  describe('timeBoxOutcome', () => {
    test('returns time box metadata', () => {
      const result = timeBoxOutcome('S1', 5000, 'Max duration');
      expect(result.outcomeId).toBe('S1');
      expect(result.maxDurationMs).toBe(5000);
      expect(result.reason).toBe('Max duration');
      expect(result.timestamp).toBeDefined();
    });

    test('timestamp is ISO string (for logging only)', () => {
      const result = timeBoxOutcome('S1', 5000, 'Max duration');
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('boundedText', () => {
    test('returns text unchanged if within bounds', () => {
      const result = boundedText('Short text', 100);
      expect(result).toBe('Short text');
    });

    test('truncates and adds ellipsis if over bounds', () => {
      const longText = 'A'.repeat(200);
      const result = boundedText(longText, 100);
      expect(result.length).toBe(100);
      expect(result).toContain('...');
    });

    test('is deterministic', () => {
      const text = 'Test text';
      const result1 = boundedText(text, 100);
      const result2 = boundedText(text, 100);
      expect(result1).toBe(result2);
    });
  });

  describe('safeLabel', () => {
    test('strips internal/system strings', () => {
      const result = safeLabel('Internal system check');
      expect(result.toLowerCase()).not.toContain('internal');
      expect(result.toLowerCase()).not.toContain('system');
    });

    test('trims and normalizes whitespace', () => {
      const result = safeLabel('  Multiple   spaces  ');
      expect(result).not.toContain('  ');
      expect(result.trim()).toBe(result);
    });

    test('bounds to 100 chars', () => {
      const longText = 'A'.repeat(200);
      const result = safeLabel(longText);
      expect(result.length).toBeLessThanOrEqual(100);
    });

    test('is deterministic', () => {
      const text = 'Internal system test';
      const result1 = safeLabel(text);
      const result2 = safeLabel(text);
      expect(result1).toBe(result2);
    });
  });
});








































