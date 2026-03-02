/**
 * SafeLandingAdapter: Adapter that maps UAV signals to KernelInput.
 * Uses adapter toolkit for standardized parsing, normalization, and uncertainty mapping.
 */

import { IKernelAdapter, AdapterMetadata, CalibrationProfile } from '../AdapterTypes';
import { KernelInput, KernelResult } from '../../core/KernelTypes';
import { SafeLandingKernel } from './SafeLandingKernel';
import {
  UAVSignals,
  SafeLandingInput,
  AltitudeBand,
  HealthStatus,
  Environment,
  TimeToContact
} from './SafeLandingTypes';
import { parseNumber, parseEnum } from '../toolkit/SignalParsers';
import { mergeIssues, stableSortIssues } from '../toolkit/Normalization';
import { mapUncertainty } from '../toolkit/UncertaintyMapping';
import { validateAdapterOutput } from '../toolkit/AdapterConformance';
import { AdapterNormalizationResult, SignalValue, UncertaintyFlag } from '../toolkit/SignalTypes';

/**
 * SafeLandingAdapter: Maps UAV signals to kernel input.
 */
export class SafeLandingAdapter implements IKernelAdapter {
  private kernel: SafeLandingKernel;
  private calibrationProfile?: CalibrationProfile;
  private lastNormalizationResult?: AdapterNormalizationResult;
  private lastUncertaintyMapping?: { confidenceHint: string; uncertaintyFlags: UncertaintyFlag[] };

  constructor(calibrationProfile?: CalibrationProfile) {
    this.kernel = new SafeLandingKernel();
    this.calibrationProfile = calibrationProfile;
  }

  /**
   * Gets last adapter diagnostics (normalization result + uncertainty mapping).
   */
  getLastDiagnostics(): {
    issues: any[];
    uncertaintyFlags: any[];
    confidenceHint?: string;
  } | undefined {
    if (!this.lastNormalizationResult || !this.lastUncertaintyMapping) {
      return undefined;
    }
    return {
      issues: this.lastNormalizationResult.issues,
      uncertaintyFlags: this.lastUncertaintyMapping.uncertaintyFlags,
      confidenceHint: this.lastUncertaintyMapping.confidenceHint
    };
  }

  /**
   * Adapts UAV signals to KernelInput using toolkit.
   */
  adapt(signals: UAVSignals): KernelInput {
    const normalized: Record<string, SignalValue> = {};
    const allIssues: any[] = [];

    // Parse altitude (meters) with bounds
    const altitudeResult = parseNumber(signals.altitude, { min: 0, max: 1000 });
    let altitudeBand: AltitudeBand | undefined;
    if (altitudeResult.value !== undefined) {
      altitudeBand = this.mapAltitude(altitudeResult.value);
      normalized.altitudeBand = altitudeBand;
    } else {
      // Default to A2 if parsing failed
      altitudeBand = AltitudeBand.A2;
      normalized.altitudeBand = altitudeBand;
    }
    allIssues.push(...altitudeResult.issues.map(issue => ({ ...issue, signalKey: 'altitude' })));

    // Parse health status enum
    const healthStatusResult = parseEnum(signals.healthStatus, ['H1', 'H2', 'H3', 'H4', 'NOMINAL', 'DEGRADED', 'CRITICAL', 'FAILED', 'UNKNOWN']);
    let healthStatus: HealthStatus | undefined;
    if (healthStatusResult.value !== undefined && healthStatusResult.value !== 'UNKNOWN') {
      healthStatus = this.mapHealthStatus(healthStatusResult.value);
      normalized.healthStatus = healthStatus;
    } else {
      // If UNKNOWN or parsing failed, default to H2 but mark as uncertain
      healthStatus = HealthStatus.H2;
      normalized.healthStatus = healthStatus;
      // Add parse issue for UNKNOWN status
      if (signals.healthStatus === 'UNKNOWN' || !healthStatusResult.value) {
        allIssues.push({
          severity: 'warn',
          message: `Unknown or missing health status: ${signals.healthStatus || 'undefined'}`,
          signalKey: 'healthStatus'
        });
      }
    }
    allIssues.push(...healthStatusResult.issues.map(issue => ({ ...issue, signalKey: 'healthStatus' })));

    // Parse environment enum
    const environmentResult = parseEnum(signals.environment, ['E1', 'E2', 'E3', 'E4', 'CLEAR', 'OBSTACLES', 'WEATHER', 'EMERGENCY']);
    let environment: Environment | undefined;
    if (environmentResult.value !== undefined) {
      environment = this.mapEnvironment(environmentResult.value);
      normalized.environment = environment;
    } else {
      // Default to E1 if parsing failed
      environment = Environment.E1;
      normalized.environment = environment;
    }
    allIssues.push(...environmentResult.issues.map(issue => ({ ...issue, signalKey: 'environment' })));

    // Parse time to contact (seconds) with bounds
    const timeToContactResult = parseNumber(signals.timeToContact, { min: 0, max: 300 });
    let timeToContact: TimeToContact | undefined;
    if (timeToContactResult.value !== undefined) {
      timeToContact = this.mapTimeToContact(timeToContactResult.value);
      normalized.timeToContact = timeToContact;
    } else {
      // Default to T4 if parsing failed
      timeToContact = TimeToContact.T4;
      normalized.timeToContact = timeToContact;
    }
    allIssues.push(...timeToContactResult.issues.map(issue => ({ ...issue, signalKey: 'timeToContact' })));

    // Build normalization result
    const normalizationResult: AdapterNormalizationResult = {
      normalized,
      issues: mergeIssues(allIssues, [], 20), // Max 20 issues
      uncertainty: []
    };

    // Map uncertainty
    const uncertaintyMapping = mapUncertainty(normalizationResult, {
      criticalSignals: ['altitudeBand', 'healthStatus', 'environment', 'timeToContact'],
      useHLevelStyle: true // Use H1/H2/H3 style
    });
    const { uncertaintyFlags } = uncertaintyMapping;

    // Store for diagnostics
    this.lastNormalizationResult = normalizationResult;
    this.lastUncertaintyMapping = uncertaintyMapping;

    // Build uncertainty record
    const uncertainty: Record<string, boolean> = {};
    for (const flag of uncertaintyFlags) {
      uncertainty[flag.signalKey] = true;
      // Also map common signal keys to shorter names for backward compatibility
      if (flag.signalKey === 'healthStatus') {
        uncertainty['health'] = true;
      }
      if (flag.signalKey === 'altitudeBand' || flag.signalKey === 'altitude') {
        uncertainty['altitude'] = true;
      }
    }

    // Build KernelInput with deterministic key ordering
    const sortedSignals: Record<string, number | string | boolean> = {};
    const sortedKeys = Object.keys(normalized).sort();
    for (const key of sortedKeys) {
      const value = normalized[key];
      if (value !== null && value !== undefined) {
        sortedSignals[key] = value as number | string | boolean;
      }
    }

    const kernelInput: KernelInput = {
      timestamp: new Date().toISOString(),
      signals: sortedSignals,
      uncertainty,
      overrides: {
        environment: environment as string,
        timeToContact: timeToContact as string
      }
    };

    // Validate conformance (throws in dev/test)
    validateAdapterOutput('uav_safe_landing', 'safe_landing_decision_square_v2_3', kernelInput, {
      throwOnError: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
    });

    return kernelInput;
  }

  /**
   * Runs kernel with adapted input.
   */
  run(input: KernelInput): KernelResult {
    // Convert to SafeLandingInput
    const safeLandingInput: SafeLandingInput = {
      altitudeBand: input.signals['altitudeBand'] as AltitudeBand,
      healthStatus: input.signals['healthStatus'] as HealthStatus,
      environment: input.signals['environment'] as Environment,
      timeToContact: input.signals['timeToContact'] as TimeToContact,
      uncertainty: {
        altitude: input.uncertainty['altitude'] || false,
        health: input.uncertainty['health'] || false,
        environment: input.uncertainty['environment'] || false,
        timeToContact: input.uncertainty['timeToContact'] || false
      }
    };

    return this.kernel.run(safeLandingInput);
  }

  /**
   * Gets adapter metadata.
   */
  getMetadata(): AdapterMetadata {
    return {
      name: 'UAV Safe Landing Adapter',
      version: '2.3',
      domain: 'UAV',
      supportedSignals: ['altitude', 'healthStatus', 'environment', 'timeToContact'],
      calibrationProfile: this.calibrationProfile
    };
  }

  /**
   * Maps altitude (meters) to band.
   */
  private mapAltitude(altitude: number): AltitudeBand {
    if (altitude > 50) return AltitudeBand.A1;
    if (altitude >= 20) return AltitudeBand.A2;
    if (altitude >= 10) return AltitudeBand.A3;
    return AltitudeBand.A4;
  }

  /**
   * Maps health status string to enum.
   */
  private mapHealthStatus(status: string): HealthStatus {
    switch (status.toUpperCase()) {
      case 'H1':
      case 'NOMINAL':
        return HealthStatus.H1;
      case 'H2':
      case 'DEGRADED':
        return HealthStatus.H2;
      case 'H3':
      case 'CRITICAL':
        return HealthStatus.H3;
      case 'H4':
      case 'FAILED':
        return HealthStatus.H4;
      default:
        return HealthStatus.H2; // Default to degraded if unknown
    }
  }

  /**
   * Maps environment string to enum.
   */
  private mapEnvironment(env: string): Environment {
    switch (env.toUpperCase()) {
      case 'E1':
      case 'CLEAR':
        return Environment.E1;
      case 'E2':
      case 'OBSTACLES':
        return Environment.E2;
      case 'E3':
      case 'WEATHER':
        return Environment.E3;
      case 'E4':
      case 'EMERGENCY':
        return Environment.E4;
      default:
        return Environment.E1; // Default to clear if unknown
    }
  }

  /**
   * Maps time to contact (seconds) to enum.
   */
  private mapTimeToContact(ttc: number): TimeToContact {
    if (ttc < 5) return TimeToContact.T1;
    if (ttc < 15) return TimeToContact.T2;
    if (ttc < 30) return TimeToContact.T3;
    return TimeToContact.T4;
  }
}

