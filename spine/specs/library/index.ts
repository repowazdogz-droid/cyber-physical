/**
 * Spec Library Index
 * 
 * Exports library entries with bounded descriptions.
 * Deterministic ordering, bounded to max 10 entries.
 * 
 * Version: 1.0.0
 */

import { KernelSpec } from '../SpecTypes';
import templateDecisionSquare from './template_decision_square.json';
import templateConfidenceAuthority from './template_confidence_authority.json';
import uavSafeLanding from './uav_safe_landing_v2_3.json';

/**
 * Library entry metadata.
 */
export interface SpecLibraryEntry {
  /** Entry ID (max 50 chars) */
  id: string;
  /** Title (max 100 chars) */
  title: string;
  /** Description (max 200 chars) */
  description: string;
  /** Kernel spec */
  spec: KernelSpec;
  /** Default input signals (optional) */
  defaultInput?: Record<string, unknown>;
}

/**
 * Bounds a string to max length.
 */
function boundString(text: string, maxLen: number): string {
  if (typeof text !== 'string') return String(text);
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + '...';
}

/**
 * Spec library entries.
 * Deterministic order, bounded to max 10 entries.
 */
export const SPEC_LIBRARY: SpecLibraryEntry[] = [
  {
    id: 'uav_safe_landing_v2_3',
    title: 'UAV Safe Landing Decision Square v2.3',
    description: boundString('Safe landing decision logic for UAVs based on altitude, health, environment hazard, and time to contact', 200),
    spec: uavSafeLanding as KernelSpec,
    defaultInput: {
      altitudeMeters: 150,
      healthPercentage: 85,
      environmentHazardLevel: 2,
      timeToContactSeconds: 45
    }
  },
  {
    id: 'template_decision_square',
    title: 'Decision Square Template',
    description: boundString('Domain-agnostic decision square with two axes (A/B) + overrides + disallows', 200),
    spec: templateDecisionSquare as KernelSpec,
    defaultInput: {
      axisA: 75,
      axisB: 75,
      emergency: false,
      blockSuboptimal: false
    }
  },
  {
    id: 'template_confidence_authority',
    title: 'Confidence × Authority Template',
    description: boundString('Domain-agnostic confidence × authority → outcome mapping', 200),
    spec: templateConfidenceAuthority as KernelSpec,
    defaultInput: {
      confidence: 85,
      authority: 85
    }
  }
].slice(0, 10); // Bound to max 10 entries

/**
 * Gets a library entry by ID.
 */
export function getLibraryEntry(id: string): SpecLibraryEntry | undefined {
  return SPEC_LIBRARY.find(entry => entry.id === id);
}

/**
 * Lists all library entries.
 */
export function listLibraryEntries(): SpecLibraryEntry[] {
  return SPEC_LIBRARY;
}








































