/**
 * Tests for SafeLandingAdapter.
 */

import { SafeLandingAdapter } from '../SafeLandingAdapter';
import { UAVSignals } from '../SafeLandingTypes';
import { AltitudeBand, HealthStatus, Environment, TimeToContact } from '../SafeLandingTypes';

describe('SafeLandingAdapter', () => {
  let adapter: SafeLandingAdapter;

  beforeEach(() => {
    adapter = new SafeLandingAdapter();
  });

  describe('Signal Mapping', () => {
    test('maps altitude to bands correctly', () => {
      const signals: UAVSignals = {
        altitude: 75,
        healthStatus: 'H1',
        environment: 'E1',
        timeToContact: 20
      };

      const input = adapter.adapt(signals);
      expect(input.signals['altitudeBand']).toBe(AltitudeBand.A1);
    });

    test('maps health status correctly', () => {
      const signals: UAVSignals = {
        altitude: 30,
        healthStatus: 'CRITICAL',
        environment: 'E1',
        timeToContact: 20
      };

      const input = adapter.adapt(signals);
      expect(input.signals['healthStatus']).toBe(HealthStatus.H3);
    });

    test('maps environment correctly', () => {
      const signals: UAVSignals = {
        altitude: 30,
        healthStatus: 'H1',
        environment: 'WEATHER',
        timeToContact: 20
      };

      const input = adapter.adapt(signals);
      expect(input.signals['environment']).toBe(Environment.E3);
    });

    test('maps time to contact correctly', () => {
      const signals: UAVSignals = {
        altitude: 30,
        healthStatus: 'H1',
        environment: 'E1',
        timeToContact: 3
      };

      const input = adapter.adapt(signals);
      expect(input.signals['timeToContact']).toBe(TimeToContact.T1);
    });
  });

  describe('Uncertainty Detection', () => {
    test('detects invalid altitude as uncertain', () => {
      const signals: UAVSignals = {
        altitude: -10,
        healthStatus: 'H1',
        environment: 'E1',
        timeToContact: 20
      };

      const input = adapter.adapt(signals);
      expect(input.uncertainty['altitude']).toBe(true);
    });

    test('detects unknown health status as uncertain', () => {
      const signals: UAVSignals = {
        altitude: 30,
        healthStatus: 'UNKNOWN',
        environment: 'E1',
        timeToContact: 20
      };

      const input = adapter.adapt(signals);
      expect(input.uncertainty['health']).toBe(true);
    });
  });

  describe('Adapter Metadata', () => {
    test('returns correct metadata', () => {
      const metadata = adapter.getMetadata();
      expect(metadata.name).toBe('UAV Safe Landing Adapter');
      expect(metadata.version).toBe('2.3');
      expect(metadata.domain).toBe('UAV');
      expect(metadata.supportedSignals).toContain('altitude');
    });
  });
});








































