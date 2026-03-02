/**
 * Tests for Uncertainty Mapping.
 * Ensures: deterministic ordering, bounded outputs, generic patterns only.
 */

import { mapUncertainty } from '../UncertaintyMapping';
import { AdapterNormalizationResult } from '../SignalTypes';

describe('Uncertainty Mapping', () => {
  function createTestResult(
    normalized: Record<string, any> = {},
    issues: any[] = [],
    uncertainty: any[] = []
  ): AdapterNormalizationResult {
    return {
      normalized,
      issues,
      uncertainty
    };
  }

  test('maps missing critical signals to high uncertainty', () => {
    const result = createTestResult({});
    const mapping = mapUncertainty(result, {
      criticalSignals: ['altitude', 'health']
    });

    expect(mapping.uncertaintyFlags.length).toBe(2);
    expect(mapping.uncertaintyFlags[0].level).toBe('high');
    expect(mapping.confidenceHint).toBe('LOW');
  });

  test('maps critical parse issues to high uncertainty', () => {
    const result = createTestResult(
      { altitude: 100 },
      [
        { signalKey: 'altitude', severity: 'critical', message: 'Parse failed' },
        { signalKey: 'health', severity: 'critical', message: 'Parse failed' }
      ]
    );
    const mapping = mapUncertainty(result, {});

    expect(mapping.uncertaintyFlags.length).toBeGreaterThan(0);
    expect(mapping.uncertaintyFlags[0].level).toBe('high');
    expect(mapping.confidenceHint).toBe('LOW');
  });

  test('maps warning parse issues to medium uncertainty', () => {
    const result = createTestResult(
      { altitude: 100 },
      [
        { signalKey: 'altitude', severity: 'warn', message: 'Value out of range' }
      ]
    );
    const mapping = mapUncertainty(result, {});

    expect(mapping.uncertaintyFlags.length).toBeGreaterThan(0);
    expect(mapping.uncertaintyFlags[0].level).toBe('medium');
  });

  test('uses H-level style when requested', () => {
    const result = createTestResult({});
    const mapping = mapUncertainty(result, {
      criticalSignals: ['altitude'],
      useHLevelStyle: true
    });

    expect(['H1', 'H2', 'H3']).toContain(mapping.confidenceHint);
  });

  test('uses generic style by default', () => {
    const result = createTestResult({ altitude: 100 });
    const mapping = mapUncertainty(result, {});

    expect(['HIGH', 'MEDIUM', 'LOW']).toContain(mapping.confidenceHint);
  });

  test('bounds uncertainty flags to max 20', () => {
    const result = createTestResult(
      {},
      Array.from({ length: 30 }, (_, i) => ({
        signalKey: `signal_${i}`,
        severity: 'critical' as const,
        message: 'Parse failed'
      }))
    );
    const mapping = mapUncertainty(result, {});

    expect(mapping.uncertaintyFlags.length).toBeLessThanOrEqual(20);
  });

  test('is deterministic', () => {
    const result = createTestResult(
      { altitude: 100 },
      [
        { signalKey: 'altitude', severity: 'warn', message: 'Value out of range' }
      ]
    );
    const mapping1 = mapUncertainty(result, {});
    const mapping2 = mapUncertainty(result, {});

    expect(mapping1.confidenceHint).toBe(mapping2.confidenceHint);
    expect(mapping1.uncertaintyFlags).toEqual(mapping2.uncertaintyFlags);
  });

  test('handles conflict groups', () => {
    const result = createTestResult({
      health: 'H1',
      environment: 'E1'
    });
    const mapping = mapUncertainty(result, {
      conflictGroups: [
        {
          groupId: 'health_environment',
          signals: ['health', 'environment'],
          description: 'Health and environment conflict'
        }
      ]
    });

    // Should detect conflict (both signals present)
    expect(mapping.uncertaintyFlags.length).toBeGreaterThan(0);
  });

  test('no internal/system leakage in reasons', () => {
    const result = createTestResult({});
    const mapping = mapUncertainty(result, {
      criticalSignals: ['altitude']
    });

    for (const flag of mapping.uncertaintyFlags) {
      const reason = flag.reason.toLowerCase();
      expect(reason).not.toContain('internal');
      expect(reason).not.toContain('system');
    }
  });
});








































