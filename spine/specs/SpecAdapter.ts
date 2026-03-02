/**
 * Spec Adapter
 * 
 * Adapter implementation for compiled kernel specs.
 * Maps signals directly (no transformation needed for spec-based kernels).
 * 
 * Version: 1.0.0
 */

import { IKernelAdapter, AdapterMetadata } from '../kernels/adapters/AdapterTypes';
import { KernelInput, KernelResult } from '../kernels/core/KernelTypes';
import { runSpecKernel } from './SpecKernelRunner';

/**
 * Spec-based adapter (pass-through signals).
 */
export class SpecAdapter implements IKernelAdapter {
  constructor(
    private adapterId: string,
    private kernelId: string
  ) {}

  getMetadata(): AdapterMetadata {
    return {
      name: `Spec Adapter (${this.kernelId})`,
      version: '1.0.0',
      domain: 'spec',
      supportedSignals: [] // Spec adapters accept any signals
    };
  }

  adapt(signals: unknown): KernelInput {
    // Pass through signals as-is (spec kernels work directly with signals)
    const rawSignals = signals as Record<string, unknown>;
    const normalized: Record<string, number | string | boolean> = {};

    for (const [key, value] of Object.entries(rawSignals || {})) {
      if (value !== null && value !== undefined) {
        if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
          normalized[key] = value;
        }
      }
    }

    return {
      timestamp: new Date().toISOString(),
      signals: normalized,
      uncertainty: {},
      adapterId: this.adapterId
    };
  }

  run(input: KernelInput): KernelResult {
    // Run the compiled spec kernel
    const decision = runSpecKernel(this.adapterId, input);

    // Build minimal trace (TraceBuilder would be used in full implementation)
    return {
      decision,
      trace: {
        traceId: `trace_${Date.now()}`,
        inputHash: JSON.stringify(input.signals),
        nodes: [],
        nodeCount: 0,
        claims: [],
        version: '1.0.0'
      },
      timestamp: input.timestamp
    };
  }
}

