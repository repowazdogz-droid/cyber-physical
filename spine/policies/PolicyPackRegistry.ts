/**
 * Policy Pack Registry
 * 
 * Registry for policy packs. Register, retrieve, and list packs.
 * 
 * Version: 1.0.0
 */

import { PolicyPack, PolicyPackId, PolicyPackDescriptor } from './PolicyPackTypes';

/**
 * Policy pack registry (in-memory).
 */
const PACKS_REGISTRY: Map<PolicyPackId, PolicyPack> = new Map();

/**
 * Registers a policy pack.
 */
export function registerPolicyPack(pack: PolicyPack): void {
  PACKS_REGISTRY.set(pack.descriptor.id, pack);
}

/**
 * Gets a policy pack by ID.
 * Returns undefined if not found.
 */
export function getPolicyPack(id: PolicyPackId): PolicyPack | undefined {
  return PACKS_REGISTRY.get(id);
}

/**
 * Lists all registered policy packs.
 */
export function listPolicyPacks(): PolicyPackDescriptor[] {
  return Array.from(PACKS_REGISTRY.values()).map(pack => pack.descriptor);
}

/**
 * Lists policy packs by domain.
 */
export function listPolicyPacksByDomain(domain: string): PolicyPackDescriptor[] {
  return Array.from(PACKS_REGISTRY.values())
    .filter(pack => pack.descriptor.domains.includes(domain))
    .map(pack => pack.descriptor);
}








































