/**
 * Shadow verifier: independently recomputes governance decisions and proof hashes
 * for every agent action. Does not mutate simulation state.
 */

import type { Agent, AgentDecisionState, ProofBundle, ProposedAction } from '../../types/simulation'
import type { GovernancePolicyConfig, GovernanceWorldView } from './governance'
import { evaluateGovernance, buildCanonicalProofPayload } from './governance'
import { sha256Hex } from '../../lib/hash/sha256'

export interface ShadowVerificationResult {
  allowedRecomputed: boolean
  recomputedHash: string
  decisionMatches: boolean
  hashMatches: boolean
  integrityOk: boolean
}

/**
 * Re-run governance evaluation, recompute canonical proof payload and hash,
 * compare with runtime proof bundle. prevHash linkage is correct when
 * runtimeProofBundle.prevHash === prevHash.
 */
export function shadowVerifyDecision(
  agentState: Agent,
  proposedAction: ProposedAction,
  worldState: GovernanceWorldView,
  policyRules: GovernancePolicyConfig,
  prevHash: string | null,
  decisionState: AgentDecisionState,
  tick: number,
  runtimeProofBundle: ProofBundle,
): ShadowVerificationResult {
  const evaluation = evaluateGovernance(agentState, proposedAction, worldState, policyRules)
  const allowedRecomputed = evaluation.allowed

  const canonical = buildCanonicalProofPayload({
    agentId: agentState.id,
    tick,
    observe: decisionState.observe,
    derive: decisionState.derive,
    assume: decisionState.assume,
    decide: decisionState.decide,
    act: decisionState.act,
    proposedAction,
    allowed: evaluation.allowed,
    reason: evaluation.reason,
    constraintsTriggered: evaluation.constraintsTriggered,
    prevHash,
    targetAgentId: evaluation.targetAgentId,
    distanceAtBlock: evaluation.distanceAtBlock,
    actionAttempted: evaluation.actionAttempted,
  })
  const recomputedHash = sha256Hex(canonical)

  const decisionMatches = allowedRecomputed === runtimeProofBundle.allowed
  const hashMatches = recomputedHash === runtimeProofBundle.hash
  const prevLinkageOk = runtimeProofBundle.prevHash === prevHash
  const integrityOk = decisionMatches && hashMatches && prevLinkageOk

  return {
    allowedRecomputed,
    recomputedHash,
    decisionMatches,
    hashMatches,
    integrityOk,
  }
}
