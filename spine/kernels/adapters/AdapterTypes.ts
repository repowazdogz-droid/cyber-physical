/**
 * AdapterTypes: Adapter interface for domain-specific kernels.
 */

import { KernelInput, KernelResult } from '../core/KernelTypes';

/**
 * IKernelAdapter: Interface for domain-specific adapters.
 */
export interface IKernelAdapter {
  /**
   * Adapts domain signals to KernelInput.
   */
  adapt(signals: unknown): KernelInput;

  /**
   * Runs kernel with adapted input.
   */
  run(input: KernelInput): KernelResult;

  /**
   * Gets adapter metadata.
   */
  getMetadata(): AdapterMetadata;
}

/**
 * AdapterMetadata: Metadata about adapter.
 */
export interface AdapterMetadata {
  /** Adapter name */
  name: string;
  /** Adapter version */
  version: string;
  /** Domain */
  domain: string;
  /** Supported signal keys */
  supportedSignals: string[];
  /** Calibration profile (if applicable) */
  calibrationProfile?: CalibrationProfile;
}

/**
 * CalibrationProfile: Calibration data for adapter.
 */
export interface CalibrationProfile {
  /** Calibration timestamp */
  calibratedAt: string;
  /** Calibration parameters */
  parameters: Record<string, number | string | boolean>;
  /** Calibration confidence */
  confidence: "Low" | "Medium" | "High";
}








































