/**
 * Gate Registry
 * 
 * Registry for domain-specific gate packs (optional).
 * Default pack registered automatically.
 * 
 * Version: 1.0.0
 */

import { GateAction, GateDecision, GateContext } from './GateTypes';

/**
 * GateRule: A single gate rule function.
 */
export type GateRule = (action: GateAction, ctx: GateContext) => GateDecision | null;

/**
 * GatePack: A collection of gate rules.
 */
export interface GatePack {
  /** Pack ID */
  id: string;
  /** Pack version */
  version: string;
  /** Pack description */
  description: string;
  /** Rules (ordered, first match wins) */
  rules: GateRule[];
}

/**
 * Gate pack registry.
 */
const gatePacks: Map<string, GatePack> = new Map();

/**
 * Registers a gate pack.
 */
export function registerGatePack(pack: GatePack): void {
  gatePacks.set(pack.id, pack);
}

/**
 * Gets a gate pack by ID.
 */
export function getGatePack(id: string): GatePack | undefined {
  return gatePacks.get(id);
}

/**
 * Lists all registered gate packs.
 */
export function listGatePacks(): GatePack[] {
  return Array.from(gatePacks.values());
}

/**
 * Gets all rules from all packs (ordered by pack registration).
 */
export function getAllRules(): GateRule[] {
  const allRules: GateRule[] = [];
  for (const pack of gatePacks.values()) {
    allRules.push(...pack.rules);
  }
  return allRules;
}








































