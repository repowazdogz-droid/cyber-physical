/**
 * Independent proof verifier. Validates agent decision chains using only stored
 * proof bundles. No simulation state or governance runtime. Deterministic.
 * Works on archived proof bundles loaded from JSON.
 */

import type { Agent, ProofBundle } from '../../types/simulation'
import { buildCanonicalProofPayload } from '../governance/governance'
import { sha256Hex } from '../../lib/hash/sha256'

const REQUIRED_KEYS: (keyof ProofBundle)[] = [
  'agentId',
  'tick',
  'observe',
  'derive',
  'assume',
  'decide',
  'act',
  'proposedAction',
  'allowed',
  'reason',
  'constraintsTriggered',
  'prevHash',
  'hash',
]

export interface VerifyAgentChainResult {
  valid: boolean
  brokenIndex?: number
  errors: string[]
}

function hasRequiredFields(bundle: ProofBundle): { ok: boolean; errors: string[] } {
  const errors: string[] = []
  for (const key of REQUIRED_KEYS) {
    const v = bundle[key as keyof ProofBundle]
    if (v === undefined) {
      errors.push(`Missing field: ${key}`)
    }
    if (v === null && key !== 'prevHash') {
      errors.push(`Null field not allowed: ${key}`)
    }
  }
  if (typeof bundle.hash !== 'string' || bundle.hash.length === 0) {
    errors.push('Invalid or missing hash')
  }
  if (bundle.prevHash !== null && bundle.prevHash !== undefined && typeof bundle.prevHash !== 'string') {
    errors.push('Invalid prevHash (must be string or null)')
  }
  return { ok: errors.length === 0, errors }
}

/**
 * Verify a single agent's proof chain: required fields, canonical hash match,
 * and prevHash linkage. Uses only bundle data; no simulation or governance.
 */
export function verifyAgentChain(proofBundles: ProofBundle[]): VerifyAgentChainResult {
  const errors: string[] = []
  if (proofBundles.length === 0) {
    return { valid: true, errors: [] }
  }

  for (let i = 0; i < proofBundles.length; i += 1) {
    const bundle = proofBundles[i]
    const required = hasRequiredFields(bundle)
    if (!required.ok) {
      errors.push(...required.errors.map((e) => `[${i}] ${e}`))
      return { valid: false, brokenIndex: i, errors }
    }

    const expectedPrev = i === 0 ? null : proofBundles[i - 1].hash
    if (bundle.prevHash !== expectedPrev) {
      errors.push(
        `[${i}] Chain linkage broken: prevHash ${String(bundle.prevHash)} !== previous hash ${String(expectedPrev)}`,
      )
      return { valid: false, brokenIndex: i, errors }
    }

    const canonical = buildCanonicalProofPayload({
      agentId: bundle.agentId,
      tick: bundle.tick,
      observe: bundle.observe,
      derive: bundle.derive,
      assume: bundle.assume,
      decide: bundle.decide,
      act: bundle.act,
      proposedAction: bundle.proposedAction,
      allowed: bundle.allowed,
      reason: bundle.reason,
      constraintsTriggered: bundle.constraintsTriggered,
      prevHash: bundle.prevHash,
      targetAgentId: bundle.targetAgentId,
      distanceAtBlock: bundle.distanceAtBlock,
      actionAttempted: bundle.actionAttempted,
    })
    const recomputedHash = sha256Hex(canonical)
    if (recomputedHash !== bundle.hash) {
      errors.push(`[${i}] Hash mismatch: recomputed ${recomputedHash} !== stored ${bundle.hash}`)
      return { valid: false, brokenIndex: i, errors }
    }
  }

  return { valid: true, errors: [] }
}

export interface AgentChainResult {
  agentId: string
  valid: boolean
  chainLength: number
  errors: string[]
  brokenIndex?: number
}

export interface VerifyAllAgentsResult {
  allValid: boolean
  results: AgentChainResult[]
}

/**
 * Verify all agent chains in the current run. Input is agentsById (record of
 * agents with recentProofBundles). No simulation state used.
 */
export function verifyAllAgents(agentsById: Record<string, Agent>): VerifyAllAgentsResult {
  const results: AgentChainResult[] = []
  let allValid = true
  const agents = Object.entries(agentsById)
  for (const [agentId, agent] of agents) {
    const chain = [...(agent.recentProofBundles ?? [])].sort((a, b) => a.tick - b.tick)
    const out = verifyAgentChain(chain)
    results.push({
      agentId,
      valid: out.valid,
      chainLength: chain.length,
      errors: out.errors,
      brokenIndex: out.brokenIndex,
    })
    if (!out.valid) allValid = false
  }
  return { allValid, results }
}

export interface RunProofsExportMetadata {
  runId: string | null
  scenarioId: string
  exportedAt: string
}

export interface RunProofsExport {
  runMetadata: RunProofsExportMetadata
  proofBundles: ProofBundle[]
}

/**
 * Build export payload for a run: metadata plus all proof bundles from all agents.
 * Deterministic order (agentId, then tick). For external verification.
 */
export function buildRunProofsExport(
  runId: string | null,
  scenarioId: string,
  agentsById: Record<string, Agent>,
): RunProofsExport {
  const proofBundles: ProofBundle[] = []
  const agentIds = Object.keys(agentsById).sort()
  for (const agentId of agentIds) {
    const agent = agentsById[agentId]
    const chain = [...(agent.recentProofBundles ?? [])].sort((a, b) => a.tick - b.tick)
    proofBundles.push(...chain)
  }
  return {
    runMetadata: {
      runId,
      scenarioId,
      exportedAt: new Date().toISOString(),
    },
    proofBundles,
  }
}
