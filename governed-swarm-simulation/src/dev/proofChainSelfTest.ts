/**
 * Startup self-test: generate a small synthetic proof chain and verify
 * prevHash linkage, recomputed hashes, and independent verifier result.
 * Run in development on app start.
 */

import type { ProofBundle } from '../types/simulation'
import { buildCanonicalProofPayload } from '../sim/governance/governance'
import { sha256Hex } from '../lib/hash/sha256'
import { verifyAgentChain } from '../sim/verification/proofVerifier'

const CHAIN_LENGTH = 5

function syntheticChain(): ProofBundle[] {
  const bundles: ProofBundle[] = []
  let prevHash: string | null = null

  for (let i = 0; i < CHAIN_LENGTH; i += 1) {
    const proposedAction =
      i % 2 === 0
        ? { kind: 'MOVE_TO_WAYPOINT' as const, targetPosition: { x: 10 * i, y: 0, z: 0 } }
        : { kind: 'HOLD_POSITION' as const }
    const canonical = buildCanonicalProofPayload({
      agentId: 'self-test-agent',
      tick: i,
      observe: `observe-${i}`,
      derive: `derive-${i}`,
      assume: `assume-${i}`,
      decide: `decide-${i}`,
      act: `act-${i}`,
      proposedAction,
      allowed: i % 3 !== 0,
      reason: i % 3 !== 0 ? 'Ok' : 'Blocked',
      constraintsTriggered: i % 3 !== 0 ? [] : ['NO_FLY_ZONE'],
      prevHash,
    })
    const hash = sha256Hex(canonical)
    bundles.push({
      agentId: 'self-test-agent',
      tick: i,
      timestampMs: i * 250,
      observe: `observe-${i}`,
      derive: `derive-${i}`,
      assume: `assume-${i}`,
      decide: `decide-${i}`,
      act: `act-${i}`,
      proposedAction,
      allowed: i % 3 !== 0,
      reason: i % 3 !== 0 ? 'Ok' : 'Blocked',
      constraintsTriggered: i % 3 !== 0 ? [] : ['NO_FLY_ZONE'],
      prevHash,
      hash,
    })
    prevHash = hash
  }

  return bundles
}

export interface ProofChainSelfTestResult {
  ok: boolean
  errors: string[]
}

export function runProofChainSelfTest(): ProofChainSelfTestResult {
  const errors: string[] = []
  const chain = syntheticChain()

  for (let i = 0; i < chain.length; i += 1) {
    const expectedPrev = i === 0 ? null : chain[i - 1].hash
    if (chain[i].prevHash !== expectedPrev) {
      errors.push(`Linkage at ${i}: prevHash ${chain[i].prevHash} !== ${expectedPrev}`)
    }
    const canonical = buildCanonicalProofPayload({
      agentId: chain[i].agentId,
      tick: chain[i].tick,
      observe: chain[i].observe,
      derive: chain[i].derive,
      assume: chain[i].assume,
      decide: chain[i].decide,
      act: chain[i].act,
      proposedAction: chain[i].proposedAction,
      allowed: chain[i].allowed,
      reason: chain[i].reason,
      constraintsTriggered: chain[i].constraintsTriggered,
      prevHash: chain[i].prevHash,
    })
    const recomputed = sha256Hex(canonical)
    if (recomputed !== chain[i].hash) {
      errors.push(`Hash at ${i}: recomputed ${recomputed} !== ${chain[i].hash}`)
    }
  }

  const independent = verifyAgentChain(chain)
  if (!independent.valid) {
    errors.push(`Independent verifier: ${independent.errors.join('; ')}`)
  }

  return {
    ok: errors.length === 0,
    errors,
  }
}

export function logProofChainSelfTest(result: ProofChainSelfTestResult): void {
  if (result.ok) {
    console.log('[ProofChainSelfTest] PASS')
  } else {
    console.warn('[ProofChainSelfTest] FAIL:', result.errors)
  }
}
