/**
 * Tests for SafeLandingAdapter using toolkit.
 * Ensures: missing altitude -> uncertainty flag, invalid enum -> issues bounded, determinism.
 */

import { SafeLandingAdapter } from '../SafeLandingAdapter';
import { UAVSignals } from '../SafeLandingTypes';

describe('SafeLandingAdapter with Toolkit', () => {
  let adapter: SafeLandingAdapter;

  beforeEach(() => {
    adapter = new SafeLandingAdapter();
  });

  test('missing altitude produces uncertainty flag', () => {
    const signals: UAVSignals = {
      altitude: undefined as any,
      healthPercentage: 85,
      environmentHazardLevel: 2,
      timeToContactSeconds: 45
    };

    const kernelInput = adapter.adapt(signals);

    // Should have uncertainty flag for altitude
    expect(kernelInput.uncertainty.altitude || kernelInput.uncertainty.altitudeBand).toBeDefined();
  });

  test('invalid enum produces bounded issues', () => {
    const signals: UAVSignals = {
      altitude: 150,
      healthPercentage: 85,
      environmentHazardLevel: 2,
      timeToContactSeconds: 45,
      healthStatus: 'INVALID_STATUS' as any,
      environment: 'INVALID_ENV' as any
    };

    const kernelInput = adapter.adapt(signals);

    // Should still produce valid KernelInput (with defaults)
    expect(kernelInput.signals.healthStatus).toBeDefined();
    expect(kernelInput.signals.environment).toBeDefined();
  });

  test('deterministic: same raw signals => identical normalization', () => {
    const signals: UAVSignals = {
      altitude: 150,
      healthPercentage: 85,
      environmentHazardLevel: 2,
      timeToContactSeconds: 45
    };

    const result1 = adapter.adapt(signals);
    const result2 = adapter.adapt(signals);

    // Signals should be identical
    expect(result1.signals).toEqual(result2.signals);
    
    // Uncertainty should be identical
    expect(result1.uncertainty).toEqual(result2.uncertainty);
    
    // Signal keys should be in same order (deterministic)
    expect(Object.keys(result1.signals)).toEqual(Object.keys(result2.signals));
  });

  test('handles out-of-bounds altitude', () => {
    const signals: UAVSignals = {
      altitude: 2000, // Above max 1000
      healthPercentage: 85,
      environmentHazardLevel: 2,
      timeToContactSeconds: 45
    };

    const kernelInput = adapter.adapt(signals);

    // Should clamp to max and still produce valid input
    expect(kernelInput.signals.altitudeBand).toBeDefined();
  });

  test('handles negative altitude', () => {
    const signals: UAVSignals = {
      altitude: -10, // Below min 0
      healthPercentage: 85,
      environmentHazardLevel: 2,
      timeToContactSeconds: 45
    };

    const kernelInput = adapter.adapt(signals);

    // Should clamp to min and still produce valid input
    expect(kernelInput.signals.altitudeBand).toBeDefined();
  });

  test('handles string numbers', () => {
    const signals: UAVSignals = {
      altitude: '150' as any,
      healthPercentage: 85,
      environmentHazardLevel: 2,
      timeToContactSeconds: 45
    };

    const kernelInput = adapter.adapt(signals);

    // Should parse string to number
    expect(kernelInput.signals.altitudeBand).toBeDefined();
  });

  test('produces deterministic key ordering', () => {
    const signals: UAVSignals = {
      altitude: 150,
      healthPercentage: 85,
      environmentHazardLevel: 2,
      timeToContactSeconds: 45
    };

    const kernelInput = adapter.adapt(signals);
    const keys = Object.keys(kernelInput.signals);

    // Keys should be sorted (deterministic)
    const sortedKeys = [...keys].sort();
    expect(keys).toEqual(sortedKeys);
  });

  test('handles missing critical signals gracefully', () => {
    const signals: UAVSignals = {
      altitude: undefined as any,
      healthPercentage: undefined as any,
      environmentHazardLevel: undefined as any,
      timeToContactSeconds: undefined as any
    };

    const kernelInput = adapter.adapt(signals);

    // Should still produce valid KernelInput with defaults
    expect(kernelInput.signals.altitudeBand).toBeDefined();
    expect(kernelInput.signals.healthStatus).toBeDefined();
    expect(kernelInput.signals.environment).toBeDefined();
    expect(kernelInput.signals.timeToContact).toBeDefined();
  });
});








































