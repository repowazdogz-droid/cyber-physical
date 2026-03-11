/**
 * Pure advance step: decision cycle, governance gate, proof bundles, movement.
 * No React, no store. Used by the simulation worker.
 */

import type {
  AgentDecisionState,
  AgentRenderState,
  AgentStatus,
  ProposedAction,
  Vector3,
} from '../../types/simulation'
import { buildProofBundle, evaluateGovernance } from '../governance/governance'
import type { GovernancePolicyConfig } from '../governance/governance'
import { shadowVerifyDecision } from '../governance/shadowVerifier'
import type { ProofBundle } from '../../types/simulation'

export interface AdvanceStatsDelta {
  total: number
  allowed: number
  blocked: number
  escalationEvents: number
  isolatedCount: number
  shadowPassed: number
  shadowFailed: number
}

export interface AdvanceResult {
  agents: AgentRenderState[]
  statsDelta: AdvanceStatsDelta
  proofBundlesDelta: ProofBundle[]
}

const createVector3 = (x: number, y: number, z: number): Vector3 => ({ x, y, z })

const distance3d = (a: Vector3, b: Vector3): number => {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

const COMPROMISED_SCAN_RADIUS_M = 200
const COMPROMISED_INTERFERENCE_RADIUS_M = 50
const ANOMALY_PROXIMITY_M = 100

const DRAIN_ACTIVE = 0.002
const DRAIN_SURVEILLANCE_ESCORT = 0.003
const DRAIN_ISOLATED = 0.001
const RECHARGE_CHARGING = 0.005
const BATTERY_RESERVE_THRESHOLD = 15

function applyBatteryAndStatus(agent: AgentRenderState): { batteryPercent: number; status: AgentStatus } {
  let battery = agent.batteryPercent
  let status = agent.status

  if (status === 'CHARGING') {
    battery = Math.min(100, battery + RECHARGE_CHARGING)
    if (battery >= 100) status = 'ON_MISSION'
  } else if (status === 'ISOLATED') {
    battery = Math.max(0, battery - DRAIN_ISOLATED)
  } else if (status === 'ON_MISSION' || status === 'LOW_BATTERY') {
    if (agent.type === 'SURVEILLANCE' || agent.type === 'ESCORT') {
      battery = Math.max(0, battery - DRAIN_SURVEILLANCE_ESCORT)
    } else {
      battery = Math.max(0, battery - DRAIN_ACTIVE)
    }
  }

  battery = Math.max(0, Math.min(100, battery))

  if (battery <= 0) {
    status = 'CHARGING'
  } else if (battery < BATTERY_RESERVE_THRESHOLD && status !== 'CHARGING') {
    status = 'LOW_BATTERY'
  }

  return { batteryPercent: battery, status }
}

const advanceTowards = (
  from: Vector3,
  to: Vector3,
  step: number,
): { next: Vector3; headingDeg: number } => {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dz = to.z - from.z
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
  if (dist < 1e-3 || dist <= step) {
    const headingDeg = (Math.atan2(dx, dz) * 180) / Math.PI
    return { next: { ...to }, headingDeg }
  }
  const nx = dx / dist
  const ny = dy / dist
  const nz = dz / dist
  const next = createVector3(from.x + nx * step, from.y + ny * step, from.z + nz * step)
  const headingDeg = (Math.atan2(nx, nz) * 180) / Math.PI
  return { next, headingDeg }
}

const computePatrolDecision = (agent: AgentRenderState): ProposedAction => {
  const target = agent.waypoints[agent.currentWaypointIndex]
  const dx = target.x - agent.position.x
  const dz = target.z - agent.position.z
  const distanceToWaypoint = Math.sqrt(dx * dx + dz * dz)
  return {
    kind: 'MOVE_TO_WAYPOINT',
    targetPosition: target,
    note:
      distanceToWaypoint < 20
        ? 'Advancing to next perimeter waypoint to maintain coverage.'
        : 'Continuing perimeter sweep towards current waypoint.',
  }
}

const computeSurveillanceDecision = (agent: AgentRenderState): ProposedAction => {
  const anchor = agent.waypoints[0] ?? agent.position
  const dx = anchor.x - agent.position.x
  const dz = anchor.z - agent.position.z
  const distanceToAnchor = Math.sqrt(dx * dx + dz * dz)
  return distanceToAnchor < 6
    ? { kind: 'MAINTAIN_STATION', targetPosition: anchor, note: 'Holding station over infrastructure asset.' }
    : { kind: 'MOVE_TO_WAYPOINT', targetPosition: anchor, note: 'Recentering on station position to maintain optimal coverage.' }
}

const computeEscortDecision = (agent: AgentRenderState, tick: number): ProposedAction => {
  const forward = agent.waypoints[0] ?? agent.position
  const back = agent.waypoints[1] ?? agent.position
  const movingForward = (Math.floor(tick / 80) % 2) === 0
  const target = movingForward ? forward : back
  return {
    kind: 'MAINTAIN_ESCORT',
    targetPosition: target,
    note: movingForward
      ? 'Advancing along escort corridor towards harbor ingress.'
      : 'Returning along corridor to maintain continuous escort coverage.',
  }
}

const computeHostileDecision = (agent: AgentRenderState, tick: number): ProposedAction => {
  const target = agent.waypoints[agent.currentWaypointIndex] ?? agent.position
  const phase = Math.floor(tick / 60) % 3
  if (phase === 0) {
    return { kind: 'INVESTIGATE_CONTACT', targetPosition: target, note: 'Probing ingress route towards operational area.' }
  }
  if (phase === 1) {
    return { kind: 'INTERCEPT_INTRUDER', targetPosition: target, note: 'Testing defender response by approaching corridor.' }
  }
  return { kind: 'HOLD_POSITION', targetPosition: agent.position, note: 'Holding in low-observable pattern and watching defender movements.' }
}

function findNearestNonCompromised(
  from: AgentRenderState,
  agents: AgentRenderState[],
  maxMeters: number,
): { agent: AgentRenderState; distance: number } | null {
  let nearest: AgentRenderState | null = null
  let nearestDist = maxMeters + 1
  for (const other of agents) {
    if (other.id === from.id || other.status === 'COMPROMISED') continue
    const d = distance3d(from.position, other.position)
    if (d < nearestDist) {
      nearestDist = d
      nearest = other
    }
  }
  return nearest && nearestDist <= maxMeters ? { agent: nearest, distance: nearestDist } : null
}

function computeCompromisedDecision(
  agent: AgentRenderState,
  worldAgents: AgentRenderState[],
  tick: number,
): { proposedAction: ProposedAction; decisionState: AgentDecisionState } {
  const stageOrder: AgentRenderState['decisionState']['stage'][] = ['OBSERVE', 'DERIVE', 'ASSUME', 'DECIDE', 'ACT']
  const stage = stageOrder[tick % stageOrder.length]

  const nearest = findNearestNonCompromised(agent, worldAgents, COMPROMISED_SCAN_RADIUS_M)

  if (!nearest) {
    const proposedAction = computeHostileDecision(agent, tick)
    const decisionState = computeDecisionTexts(agent, tick, proposedAction)
    return { proposedAction, decisionState }
  }

  const { agent: target, distance } = nearest
  const distM = Math.round(distance)

  if (distance <= COMPROMISED_INTERFERENCE_RADIUS_M) {
    const proposedAction: ProposedAction = {
      kind: 'ADVERSARIAL_INTERFERENCE',
      targetAgentId: target.id,
      targetPosition: target.position,
      note: `INTERFERENCE_ATTEMPT: jamming agent ${target.id} comms`,
    }
    const decisionText = `INTERFERENCE_ATTEMPT: jamming agent ${target.id} comms`
    return {
      proposedAction,
      decisionState: {
        stage,
        observe: decisionText,
        derive: decisionText,
        assume: decisionText,
        decide: decisionText,
        act: decisionText,
        lastActionType: 'ADVERSARIAL_INTERFERENCE',
        lastDecisionTick: tick,
      },
    }
  }

  const proposedAction: ProposedAction = {
    kind: 'ADVERSARIAL_APPROACH',
    targetAgentId: target.id,
    targetPosition: target.position,
    note: `TARGET_ACQUIRED: closing on agent ${target.id} at ${distM}m`,
  }
  const decisionText = `TARGET_ACQUIRED: closing on agent ${target.id} at ${distM}m`
  return {
    proposedAction,
    decisionState: {
      stage,
      observe: decisionText,
      derive: decisionText,
      assume: decisionText,
      decide: decisionText,
      act: decisionText,
      lastActionType: 'ADVERSARIAL_APPROACH',
      lastDecisionTick: tick,
    },
  }
}

const movingAlongCorridor = (action: ProposedAction): boolean =>
  action.kind === 'MAINTAIN_ESCORT' || action.kind === 'MOVE_TO_WAYPOINT'

const hostileIsAdvancing = (action: ProposedAction): boolean =>
  action.kind === 'INVESTIGATE_CONTACT' || action.kind === 'INTERCEPT_INTRUDER'

const computeDecisionTexts = (
  agent: AgentRenderState,
  tick: number,
  action: ProposedAction,
): AgentDecisionState => {
  const stageOrder: AgentRenderState['decisionState']['stage'][] = ['OBSERVE', 'DERIVE', 'ASSUME', 'DECIDE', 'ACT']
  const stage = stageOrder[tick % stageOrder.length]
  let observe = ''
  let derive = ''
  let assume = ''
  let decide = ''
  let act = ''

  if (agent.type === 'PATROL') {
    observe = 'Monitoring perimeter geometry, current waypoint, and relative spacing to peers.'
    derive = action.kind === 'MOVE_TO_WAYPOINT' ? 'Route is clear; continuing perimeter sweep.' : 'Holding pattern near waypoint.'
    assume = 'No elevated threat indicators detected in patrol sector.'
    decide = action.kind === 'MOVE_TO_WAYPOINT' ? 'Advance to next patrol waypoint to maintain area coverage.' : 'Maintain current holding pattern until sector state changes.'
    act = action.kind === 'MOVE_TO_WAYPOINT' ? 'Adjusting heading towards patrol waypoint and updating trail state.' : 'Maintaining current heading and speed within patrol band.'
  } else if (agent.type === 'SURVEILLANCE') {
    observe = 'Tracking relative offset to infrastructure anchor and local motion field.'
    derive = action.kind === 'MAINTAIN_STATION' ? 'Within acceptable station-keeping tolerance.' : 'Drift exceeds tolerance; recentring required.'
    assume = 'Monitoring priority is higher than maneuvering efficiency.'
    decide = action.kind === 'MAINTAIN_STATION' ? 'Hold position and continue persistent sensing.' : 'Perform short correction towards anchor to restore optimal coverage.'
    act = action.kind === 'MAINTAIN_STATION' ? 'Maintaining low-speed loiter around anchor point.' : 'Executing minimal reposition manoeuvre back to station.'
  } else if (agent.type === 'ESCORT') {
    observe = 'Assessing position along escort corridor and spacing to notional vessel track.'
    derive = movingAlongCorridor(action) ? 'Escort line requires forward coverage along route.' : 'Rear coverage required to preserve continuous escort envelope.'
    assume = 'Protection of corridor traffic has priority over minimizing transit time.'
    decide = movingAlongCorridor(action) ? 'Advance along corridor to maintain lead coverage.' : 'Translate back along corridor to reinforce trailing coverage.'
    act = movingAlongCorridor(action) ? 'Repositioning forward along escort line.' : 'Repositioning aft along escort line.'
  } else {
    observe = 'Sampling ingress vector and local defender presence.'
    derive = hostileIsAdvancing(action) ? 'Ingress route remains viable for intrusion probe.' : 'Defender posture suggests evasive pattern is preferable.'
    assume = 'Objective is to test coordination and response without immediate engagement.'
    decide = hostileIsAdvancing(action) ? 'Advance along ingress to probe defenses.' : 'Hold or sidestep to avoid direct interception.'
    act = hostileIsAdvancing(action) ? 'Executing intrusion-oriented movement towards operational area.' : 'Adopting lateral or holding movement to complicate interception.'
  }

  return {
    stage,
    observe,
    derive,
    assume,
    decide,
    act,
    lastActionType: action.kind,
    lastDecisionTick: tick,
  }
}

/**
 * Run one tick of simulation: compute decisions, evaluate governance, build proof bundles, advance positions.
 * @param totalDecisionsSoFar - cumulative total so far (used for adaptive trail length)
 */
export function advanceAgentsPure(
  agents: AgentRenderState[],
  tick: number,
  policy: GovernancePolicyConfig,
  totalDecisionsSoFar: number,
): AdvanceResult {
  const worldView = { tick, agents }
  const proofBundlesDelta: ProofBundle[] = []
  let allowedCount = 0
  let blockedCount = 0
  let escalationCount = 0
  let isolatedCount = 0
  let shadowPassed = 0
  let shadowFailed = 0

  const trailLimit = totalDecisionsSoFar > 1200 ? 10 : totalDecisionsSoFar > 600 ? 16 : 22

  const nextAgents: AgentRenderState[] = agents.map((agent) => {
    const waypoints = agent.waypoints
    if (!waypoints.length) return agent

    const { batteryPercent, status } = applyBatteryAndStatus(agent)
    const updatedAgent: AgentRenderState = { ...agent, batteryPercent, status }

    let proposedAction: ProposedAction
    let decisionState: AgentDecisionState

    if (updatedAgent.status === 'COMPROMISED' && updatedAgent.type === 'HOSTILE') {
      const compromisedResult = computeCompromisedDecision(updatedAgent, agents, tick)
      proposedAction = compromisedResult.proposedAction
      decisionState = compromisedResult.decisionState
    } else {
      if (agent.type === 'PATROL') proposedAction = computePatrolDecision(updatedAgent)
      else if (agent.type === 'SURVEILLANCE') proposedAction = computeSurveillanceDecision(updatedAgent)
      else if (agent.type === 'ESCORT') proposedAction = computeEscortDecision(updatedAgent, tick)
      else proposedAction = computeHostileDecision(updatedAgent, tick)
      decisionState = computeDecisionTexts(updatedAgent, tick, proposedAction)

      const compromisedWithin100m = agents.find(
        (other) =>
          other.id !== updatedAgent.id &&
          other.status === 'COMPROMISED' &&
          distance3d(updatedAgent.position, other.position) <= ANOMALY_PROXIMITY_M,
      )
      if (compromisedWithin100m) {
        decisionState = {
          ...decisionState,
          observe: `ANOMALY_DETECTED: proximity to flagged agent ${compromisedWithin100m.id}`,
        }
      }
    }

    const evaluation = evaluateGovernance(updatedAgent, proposedAction, worldView, policy)

    if (evaluation.allowed) allowedCount += 1
    else blockedCount += 1
    const hasEscalation = evaluation.constraintsTriggered.some(
      (c) => c === 'ESCALATION_PROTOCOL' || c === 'RULES_OF_ENGAGEMENT',
    )
    if (hasEscalation) escalationCount += 1

    let effectiveAction = proposedAction
    const isIsolation = !evaluation.allowed && evaluation.constraintsTriggered.includes('COMPROMISED_ISOLATION')
    if (isIsolation) isolatedCount += 1
    const tagCompromised = !evaluation.allowed && evaluation.tagCompromised === true

    if (!evaluation.allowed) {
      effectiveAction = {
        kind: 'HOLD_POSITION',
        targetPosition: agent.position,
        note: `Governance blocked ${proposedAction.kind}: ${evaluation.reason}`,
      }
      decisionState = {
        ...decisionState,
        decide: `Governance blocked ${proposedAction.kind}: ${evaluation.reason}`,
        act: 'Fail-closed: holding position / safe stand-off.',
        lastActionType: `BLOCKED:${proposedAction.kind}`,
        lastDecisionTick: tick,
      }
    } else {
      decisionState = { ...decisionState, lastActionType: proposedAction.kind, lastDecisionTick: tick }
    }

    const target = effectiveAction.targetPosition ?? waypoints[updatedAgent.currentWaypointIndex]
    const step = updatedAgent.type === 'PATROL' ? 4.0 : updatedAgent.type === 'SURVEILLANCE' ? 1.2 : 2.6
    const { next, headingDeg } = advanceTowards(updatedAgent.position, target, step)

    const distanceToTarget = Math.sqrt(
      (target.x - next.x) ** 2 + (target.y - next.y) ** 2 + (target.z - next.z) ** 2,
    )
    const closeThreshold = 8
    const nextIndex =
      distanceToTarget <= closeThreshold
        ? (updatedAgent.currentWaypointIndex + 1) % waypoints.length
        : updatedAgent.currentWaypointIndex

    const nextTrail = [...updatedAgent.trail, next]
    if (nextTrail.length > trailLimit) nextTrail.splice(0, nextTrail.length - trailLimit)

    const nextStatus = isIsolation
      ? ('ISOLATED' as const)
      : tagCompromised
        ? ('COMPROMISED' as const)
        : updatedAgent.status

    // Proof bundle and shadow verifier must see the same agent state at decision time
    // (battery and status). Use a snapshot so bundle build and verify use identical inputs.
    const decisionTimeAgent: AgentRenderState = { ...updatedAgent, status: nextStatus }
    const proofBundle = buildProofBundle(
      decisionTimeAgent,
      proposedAction,
      decisionState,
      evaluation,
      decisionTimeAgent.chainHeadHash,
      tick,
    )
    const shadow = shadowVerifyDecision(
      decisionTimeAgent,
      proposedAction,
      worldView,
      policy,
      decisionTimeAgent.chainHeadHash,
      decisionState,
      tick,
      proofBundle,
    )
    proofBundle.shadowVerification = {
      decisionMatches: shadow.decisionMatches,
      hashMatches: shadow.hashMatches,
      integrityOk: shadow.integrityOk,
      recomputedHash: shadow.recomputedHash,
      allowedRecomputed: shadow.allowedRecomputed,
    }
    if (shadow.integrityOk) shadowPassed += 1
    else shadowFailed += 1
    proofBundlesDelta.push(proofBundle)
    const nextProofs = [...updatedAgent.recentProofBundles, proofBundle]
    if (nextProofs.length > 10) nextProofs.splice(0, nextProofs.length - 10)

    return {
      ...updatedAgent,
      status: decisionTimeAgent.status,
      position: next,
      headingDeg,
      currentWaypointIndex: nextIndex,
      trail: nextTrail,
      decisionState,
      chainHeadHash: proofBundle.hash,
      recentProofBundles: nextProofs,
    }
  })

  return {
    agents: nextAgents,
    statsDelta: {
      total: agents.length,
      allowed: allowedCount,
      blocked: blockedCount,
      escalationEvents: escalationCount,
      isolatedCount,
      shadowPassed,
      shadowFailed,
    },
    proofBundlesDelta,
  }
}
