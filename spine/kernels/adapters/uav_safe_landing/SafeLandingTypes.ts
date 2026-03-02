/**
 * SafeLandingTypes: Types for UAV Safe Landing Decision Square v2.3.
 */

/**
 * Altitude band (A).
 */
export enum AltitudeBand {
  A1 = "A1", // > 50m
  A2 = "A2", // 20-50m
  A3 = "A3", // 10-20m
  A4 = "A4"  // < 10m
}

/**
 * Health status (H).
 */
export enum HealthStatus {
  H1 = "H1", // Nominal
  H2 = "H2", // Degraded
  H3 = "H3", // Critical
  H4 = "H4"  // Failed
}

/**
 * Environment (E).
 */
export enum Environment {
  E1 = "E1", // Clear
  E2 = "E2", // Obstacles
  E3 = "E3", // Weather
  E4 = "E4"  // Emergency
}

/**
 * Time to contact (TTC).
 */
export enum TimeToContact {
  T1 = "T1", // < 5s
  T2 = "T2", // 5-15s
  T3 = "T3", // 15-30s
  T4 = "T4"  // > 30s
}

/**
 * Safe Landing Outcome (S1-S4).
 */
export enum SafeLandingOutcome {
  S1 = "S1", // Continue mission
  S2 = "S2", // Prepare landing
  S3 = "S3", // Execute landing
  S4 = "S4"  // Emergency landing
}

/**
 * UAV Signals: Raw signals from UAV.
 */
export interface UAVSignals {
  /** Altitude (meters) */
  altitude: number;
  /** Health status code */
  healthStatus: string;
  /** Environment code */
  environment: string;
  /** Time to contact (seconds) */
  timeToContact: number;
  /** Optional: Additional signals */
  [key: string]: number | string | boolean | undefined;
}

/**
 * Safe Landing Input: Mapped input for kernel.
 */
export interface SafeLandingInput {
  /** Altitude band */
  altitudeBand: AltitudeBand;
  /** Health status */
  healthStatus: HealthStatus;
  /** Environment */
  environment: Environment;
  /** Time to contact */
  timeToContact: TimeToContact;
  /** Uncertainty flags */
  uncertainty: {
    altitude?: boolean;
    health?: boolean;
    environment?: boolean;
    timeToContact?: boolean;
  };
}








































