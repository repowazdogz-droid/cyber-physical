/**
 * Tests for Adapter Conformance.
 * Ensures: bounds enforcement, deterministic validation.
 */

import { validateAdapterOutput } from '../AdapterConformance';
import { KernelInput } from '../../../core/KernelTypes';

describe('Adapter Conformance', () => {
  function createTestInput(
    signals: Record<string, number | string | boolean> = {},
    uncertainty: Record<string, boolean> = {}
  ): KernelInput {
    return {
      timestamp: '2024-01-01T00:00:00Z',
      signals,
      uncertainty,
      overrides: {}
    };
  }

  test('validates max signals bound', () => {
    const signals: Record<string, number> = {};
    for (let i = 0; i < 60; i++) {
      signals[`signal_${i}`] = i;
    }

    const input = createTestInput(signals);
    const issues = validateAdapterOutput('test_adapter', 'test_kernel', input);

    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].severity).toBe('critical');
    expect(issues[0].message).toContain('exceeds maximum');
  });

  test('validates no undefined values', () => {
    const input = createTestInput({
      signal1: 42,
      signal2: undefined as any
    });

    const issues = validateAdapterOutput('test_adapter', 'test_kernel', input);

    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].severity).toBe('critical');
    expect(issues[0].message).toContain('undefined');
  });

  test('validates string bounds', () => {
    const longString = 'A'.repeat(600);
    const input = createTestInput({
      signal1: longString
    });

    const issues = validateAdapterOutput('test_adapter', 'test_kernel', input, {
      maxStringLength: 500
    });

    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].severity).toBe('warn');
    expect(issues[0].message).toContain('exceeds maximum');
  });

  test('validates deterministic key ordering', () => {
    const input = createTestInput({
      z_signal: 1,
      a_signal: 2,
      m_signal: 3
    });

    const issues = validateAdapterOutput('test_adapter', 'test_kernel', input);

    // Should have info issue about non-deterministic ordering
    const orderingIssue = issues.find(i => i.message.includes('deterministic order'));
    expect(orderingIssue).toBeDefined();
    expect(orderingIssue?.severity).toBe('info');
  });

  test('throws on error in dev/test mode', () => {
    const input = createTestInput({
      signal1: undefined as any
    });

    expect(() => {
      validateAdapterOutput('test_adapter', 'test_kernel', input, {
        throwOnError: true
      });
    }).toThrow();
  });

  test('does not throw by default', () => {
    const input = createTestInput({
      signal1: undefined as any
    });

    expect(() => {
      validateAdapterOutput('test_adapter', 'test_kernel', input);
    }).not.toThrow();
  });

  test('validates uncertainty flags bound', () => {
    const uncertainty: Record<string, boolean> = {};
    for (let i = 0; i < 60; i++) {
      uncertainty[`flag_${i}`] = true;
    }

    const input = createTestInput({}, uncertainty);
    const issues = validateAdapterOutput('test_adapter', 'test_kernel', input);

    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(i => i.message.includes('Uncertainty flags'))).toBe(true);
  });

  test('is deterministic', () => {
    const input = createTestInput({
      signal1: 42,
      signal2: 'hello'
    });

    const issues1 = validateAdapterOutput('test_adapter', 'test_kernel', input);
    const issues2 = validateAdapterOutput('test_adapter', 'test_kernel', input);

    expect(issues1).toEqual(issues2);
  });
});








































