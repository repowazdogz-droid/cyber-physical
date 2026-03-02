/**
 * Spec Kernel Runner
 * 
 * Runs a compiled kernel spec.
 * Integrates with KernelRunner infrastructure.
 * 
 * Version: 1.0.0
 */

import { compileKernelSpec, hashSpec, CompiledKernelFunction } from './KernelSpecCompiler';
import { KernelSpec } from './SpecTypes';
import { KernelInput } from '../kernels/core/KernelTypes';
import { KernelDecision } from '../kernels/core/KernelTypes';
import { registerSpecAdapter } from '../kernels/adapters/AdapterRegistry';
import { SpecAdapter } from './SpecAdapter';

/**
 * Compiled spec cache (in-memory, dev-grade).
 */
const compiledSpecs = new Map<string, {
  spec: KernelSpec;
  compiled: CompiledKernelFunction;
  adapterId: string;
}>();

/**
 * Compiles and registers a kernel spec.
 */
export function compileAndRegisterSpec(spec: KernelSpec): string {
  const specHash = hashSpec(spec);
  const adapterId = `spec:${specHash}`;

  // Check cache
  if (compiledSpecs.has(adapterId)) {
    return adapterId;
  }

  // Compile spec
  const compiled = compileKernelSpec(spec);

  // Register adapter
  const adapter = new SpecAdapter(adapterId, spec.kernelId);
  registerSpecAdapter(adapterId, adapter);

  // Cache
  compiledSpecs.set(adapterId, {
    spec,
    compiled,
    adapterId
  });

  return adapterId;
}

/**
 * Runs a compiled spec kernel.
 */
export function runSpecKernel(adapterId: string, input: KernelInput): KernelDecision {
  const cached = compiledSpecs.get(adapterId);
  if (!cached) {
    throw new Error(`Compiled spec not found: ${adapterId}`);
  }

  return cached.compiled(input);
}

/**
 * Gets a compiled spec by adapter ID.
 */
export function getCompiledSpec(adapterId: string): KernelSpec | undefined {
  const cached = compiledSpecs.get(adapterId);
  return cached?.spec;
}








































