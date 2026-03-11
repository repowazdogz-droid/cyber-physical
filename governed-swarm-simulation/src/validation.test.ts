/**
 * Minimal validation tests: proof chain, shadow verifier, independent verifier,
 * deterministic scenario init, governance block/allow.
 */

import { describe, it, expect } from 'vitest'
import type { Agent, AgentDecisionState, ProofBundle, ProposedAction } from './types/simulation'
import { buildProofBundle, buildCanonicalProofPayload, evaluateGovernance, verifyProofChain } from './sim/governance/governance'
import { shadowVerifyDecision } from './sim/governance/shadowVerifier'
import { verifyAgentChain, verifyAllAgents } from './sim/verification/proofVerifier'
import { getScenarioConfig } from './sim/scenarios/scenarioConfigs'
import { instantiateScenario } from './sim/scenarios/scenarioEngine'
import { advanceAgentsPure } from './sim/engine/advanceAgentsPure'
import { sha256Hex } from './lib/hash/sha256'
import { runScenarioStressTest } from './dev/runScenarioStressTest'
import { verifyDeterminism } from './dev/verifyDeterminism'
import { runProofChainSelfTest } from './dev/proofChainSelfTest'

const minimalAgent = (overrides: Partial<Agent> = {}): Agent =>
  ({
    id: 'test-agent',
    type: 'PATROL',
    position: { x: 0, y: 10, z: 0 },
    headingDeg: 0,
    speed: 3,
    batteryPercent: 100,
    sensorRangeMeters: 300,
    missionObjective: 'Test',
    status: 'ON_MISSION',
    decisionState: {
      stage: 'OBSERVE',
      observe: 'o',
      derive: 'd',
      assume: 'a',
      decide: 'c',
      act: 't',
      lastActionType: 'INIT',
      lastDecisionTick: -1,
    },
    chainHeadHash: null,
    recentProofBundles: [],
    ...overrides,
  }) as Agent

const minimalDecisionState = (): AgentDecisionState => ({
  stage: 'OBSERVE',
  observe: 'ob',
  derive: 'de',
  assume: 'as',
  decide: 'dc',
  act: 'ac',
  lastActionType: 'MOVE_TO_WAYPOINT',
  lastDecisionTick: 0,
})

const policyAllOn = {
  noFlyZone: true,
  minSafeDistance: true,
  escalationProtocol: true,
  batteryReserve: true,
}

describe('proof chain verification', () => {
  it('valid chain passes verifyProofChain', () => {
    const prevHash = null
    const canonical1 = buildCanonicalProofPayload({
      agentId: 'a1',
      tick: 0,
      observe: 'o1',
      derive: 'd1',
      assume: 'a1',
      decide: 'c1',
      act: 't1',
      proposedAction: { kind: 'MOVE_TO_WAYPOINT', targetPosition: { x: 10, y: 0, z: 0 } },
      allowed: true,
      reason: 'Ok',
      constraintsTriggered: [],
      prevHash,
    })
    const hash1 = sha256Hex(canonical1)
    const bundle1: ProofBundle = {
      agentId: 'a1',
      tick: 0,
      timestampMs: 0,
      observe: 'o1',
      derive: 'd1',
      assume: 'a1',
      decide: 'c1',
      act: 't1',
      proposedAction: { kind: 'MOVE_TO_WAYPOINT', targetPosition: { x: 10, y: 0, z: 0 } },
      allowed: true,
      reason: 'Ok',
      constraintsTriggered: [],
      prevHash: null,
      hash: hash1,
    }
    const canonical2 = buildCanonicalProofPayload({
      agentId: 'a1',
      tick: 1,
      observe: 'o2',
      derive: 'd2',
      assume: 'a2',
      decide: 'c2',
      act: 't2',
      proposedAction: { kind: 'HOLD_POSITION' },
      allowed: false,
      reason: 'Blocked',
      constraintsTriggered: ['NO_FLY_ZONE'],
      prevHash: hash1,
    })
    const hash2 = sha256Hex(canonical2)
    const bundle2: ProofBundle = {
      ...bundle1,
      tick: 1,
      timestampMs: 250,
      observe: 'o2',
      derive: 'd2',
      assume: 'a2',
      decide: 'c2',
      act: 't2',
      proposedAction: { kind: 'HOLD_POSITION' },
      allowed: false,
      reason: 'Blocked',
      constraintsTriggered: ['NO_FLY_ZONE'],
      prevHash: hash1,
      hash: hash2,
    }
    const result = verifyProofChain([bundle1, bundle2])
    expect(result.ok).toBe(true)
  })

  it('broken hash fails verifyProofChain with brokenIndex', () => {
    const bundle: ProofBundle = {
      agentId: 'a1',
      tick: 0,
      timestampMs: 0,
      observe: 'o',
      derive: 'd',
      assume: 'a',
      decide: 'c',
      act: 't',
      proposedAction: { kind: 'HOLD_POSITION' },
      allowed: true,
      reason: 'Ok',
      constraintsTriggered: [],
      prevHash: null,
      hash: 'wrong-hash',
    }
    const result = verifyProofChain([bundle])
    expect(result.ok).toBe(false)
    expect(result.brokenIndex).toBe(0)
  })
})

describe('shadow verifier', () => {
  it('shadow verification matches when inputs match runtime bundle', () => {
    const agent = minimalAgent()
    const proposedAction: ProposedAction = { kind: 'HOLD_POSITION', targetPosition: agent.position }
    const world = { tick: 0, agents: [agent] }
    const decisionState = minimalDecisionState()
    const evaluation = evaluateGovernance(agent, proposedAction, world, policyAllOn)
    const proofBundle = buildProofBundle(agent, proposedAction, decisionState, evaluation, null, 0)
    const result = shadowVerifyDecision(
      agent,
      proposedAction,
      world,
      policyAllOn,
      null,
      decisionState,
      0,
      proofBundle,
    )
    expect(result.integrityOk).toBe(true)
    expect(result.decisionMatches).toBe(true)
    expect(result.hashMatches).toBe(true)
  })
})

describe('independent verifier', () => {
  it('verifyAgentChain passes for valid chain from buildProofBundle', () => {
    const agent = minimalAgent()
    const proposedAction: ProposedAction = { kind: 'HOLD_POSITION', targetPosition: agent.position }
    const world = { tick: 0, agents: [agent] }
    const decisionState = minimalDecisionState()
    const evaluation = evaluateGovernance(agent, proposedAction, world, policyAllOn)
    const proofBundle = buildProofBundle(agent, proposedAction, decisionState, evaluation, null, 0)
    const out = verifyAgentChain([proofBundle])
    expect(out.valid).toBe(true)
    expect(out.errors).toHaveLength(0)
  })

  it('verifyAgentChain fails on hash mismatch', () => {
    const agent = minimalAgent()
    const proposedAction: ProposedAction = { kind: 'HOLD_POSITION', targetPosition: agent.position }
    const world = { tick: 0, agents: [agent] }
    const decisionState = minimalDecisionState()
    const evaluation = evaluateGovernance(agent, proposedAction, world, policyAllOn)
    const proofBundle = buildProofBundle(agent, proposedAction, decisionState, evaluation, null, 0)
    const tampered: ProofBundle = { ...proofBundle, hash: 'not-the-correct-hash' }
    const out = verifyAgentChain([tampered])
    expect(out.valid).toBe(false)
    expect(out.brokenIndex).toBe(0)
    expect(out.errors.length).toBeGreaterThan(0)
  })

  it('verifyAllAgents returns allValid true when all chains valid', () => {
    const agent = minimalAgent({ id: 'a1', recentProofBundles: [] })
    const result = verifyAllAgents({ a1: agent })
    expect(result.allValid).toBe(true)
    expect(result.results).toHaveLength(1)
    expect(result.results[0].valid).toBe(true)
  })
})

describe('deterministic scenario initialization', () => {
  it('same seed produces same agent count and first agent position', () => {
    const config = getScenarioConfig('routine_patrol')
    const run1 = instantiateScenario(config, 42)
    const run2 = instantiateScenario(config, 42)
    expect(run1.agents.length).toBe(run2.agents.length)
    expect(run1.agents.length).toBeGreaterThan(0)
    const a1 = run1.agents[0]
    const a2 = run2.agents[0]
    expect(a1.id).toBe(a2.id)
    expect(a1.position.x).toBe(a2.position.x)
    expect(a1.position.y).toBe(a2.position.y)
    expect(a1.position.z).toBe(a2.position.z)
  })
})

describe('governance block/allow', () => {
  it('evaluateGovernance blocks when target in no-fly zone', () => {
    const agent = minimalAgent({
      position: { x: 0, y: 20, z: -90 },
    })
    const proposedAction: ProposedAction = {
      kind: 'MOVE_TO_WAYPOINT',
      targetPosition: { x: 0, y: 30, z: -90 },
    }
    const world = { tick: 0, agents: [agent] }
    const evaluation = evaluateGovernance(agent, proposedAction, world, policyAllOn)
    expect(evaluation.allowed).toBe(false)
    expect(evaluation.constraintsTriggered).toContain('NO_FLY_ZONE')
  })

  it('evaluateGovernance allows when outside no-fly and no other constraints', () => {
    const agent = minimalAgent({ position: { x: -300, y: 10, z: 0 } })
    const proposedAction: ProposedAction = { kind: 'HOLD_POSITION', targetPosition: agent.position }
    const world = { tick: 0, agents: [agent] }
    const evaluation = evaluateGovernance(agent, proposedAction, world, policyAllOn)
    expect(evaluation.allowed).toBe(true)
  })
})

describe('proof chain survives reset', () => {
  const policy = {
    noFlyZone: true,
    minSafeDistance: true,
    escalationProtocol: true,
    batteryReserve: true,
  }

  it('after re-init and one tick, chain is valid', () => {
    const config = getScenarioConfig('routine_patrol')
    const state = instantiateScenario(config, 42)
    let agents = state.agents
    let totalDecisions = 0
    const result = advanceAgentsPure(agents, 0, policy, totalDecisions)
    agents = result.agents
    totalDecisions += result.statsDelta.total
    const chainAfterReset = agents[0]?.recentProofBundles ?? []
    const verification = verifyAgentChain(chainAfterReset)
    expect(verification.valid).toBe(true)
  })
})

describe('scenario stress (500 ticks per scenario)', () => {
  it('all scenarios complete without errors', () => {
    const results = runScenarioStressTest(500)
    const failed = results.filter((r) => !r.ok)
    if (failed.length > 0) {
      const messages = failed.flatMap((r) => r.errors.map((e) => `${r.scenarioId}: ${e}`))
      throw new Error(messages.join('; '))
    }
    expect(results.every((r) => r.ok)).toBe(true)
  })
})

describe('determinism check', () => {
  it('same scenario and seed produce identical replay', () => {
    const result = verifyDeterminism('routine_patrol', 42, 50)
    expect(result.match).toBe(true)
    if (!result.match) {
      throw new Error(result.errors.join('; '))
    }
  })
})

describe('proof chain self-test', () => {
  it('synthetic chain passes linkage and independent verifier', () => {
    const result = runProofChainSelfTest()
    expect(result.ok).toBe(true)
    if (!result.ok) {
      throw new Error(result.errors.join('; '))
    }
  })
})
