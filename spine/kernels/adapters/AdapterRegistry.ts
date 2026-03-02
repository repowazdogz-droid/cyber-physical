/**
 * AdapterRegistry: Simple registry for kernel adapters.
 * Extensible for future adapters.
 */

import { IKernelAdapter } from './AdapterTypes';
import { SafeLandingAdapter } from './uav_safe_landing/SafeLandingAdapter';

/**
 * Adapter registry (in-memory, extensible).
 */
const adapters: Map<string, () => IKernelAdapter> = new Map();

// Register UAV Safe Landing adapter
adapters.set('uav_safe_landing', () => new SafeLandingAdapter());

/**
 * Gets an adapter by ID.
 * Returns undefined if not found.
 */
export function getAdapter(adapterId: string): IKernelAdapter | undefined {
  const factory = adapters.get(adapterId);
  if (!factory) {
    return undefined;
  }
  return factory();
}

/**
 * Registers a new adapter factory.
 * Useful for extending the registry with new adapters.
 */
export function registerAdapter(adapterId: string, factory: () => IKernelAdapter): void {
  adapters.set(adapterId, factory);
}

/**
 * Registers a spec-compiled adapter.
 * Adapter ID format: "spec:{hash}"
 */
export function registerSpecAdapter(adapterId: string, adapter: IKernelAdapter): void {
  if (!adapterId.startsWith('spec:')) {
    throw new Error(`Spec adapter ID must start with "spec:": ${adapterId}`);
  }
  registerAdapter(adapterId, () => adapter);
}

/**
 * Lists all registered adapter IDs.
 */
export function listAdapterIds(): string[] {
  return Array.from(adapters.keys());
}

