import type {
  Agent,
  AgentDecisionState,
  AgentRenderState,
  AgentType,
  ProposedAction,
  Vector3,
} from '../../types/simulation'
import { DEFAULT_SEED } from '../../lib/utils/seededRandom'
import { buildProofBundle, evaluateGovernance } from '../governance/governance'
import { useSimulationUiStore } from '../../store/simulationStore'
import { createScenarioAgents } from '../engine/scenarioAgents'

export type { AgentRenderState }

export const createInitialAgents = (): AgentRenderState[] => {
  const { currentScenarioId } = useSimulationUiStore.getState()
  return createScenarioAgents(currentScenarioId, DEFAULT_SEED)
}

const createVector3 = (x: number, y: number, z: number): Vector3 => ({ x, y, z })

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

interface PatrolObservation {
  distanceToWaypoint: number
}

interface SurveillanceObservation {
  distanceToAnchor: number
}

interface EscortObservation {
  corridorProgress: number
}

const computePatrolDecision = (
  agent: AgentRenderState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature consistency with other decision fns
  _tick: number,
): { action: ProposedAction; text: PatrolObservation } => {
  const target = agent.waypoints[agent.currentWaypointIndex]
  const dx = target.x - agent.position.x
  const dz = target.z - agent.position.z
  const distanceToWaypoint = Math.sqrt(dx * dx + dz * dz)

  const action: ProposedAction = {
    kind: 'MOVE_TO_WAYPOINT',
    targetPosition: target,
    note:
      distanceToWaypoint < 20
        ? 'Advancing to next perimeter waypoint to maintain coverage.'
        : 'Continuing perimeter sweep towards current waypoint.',
  }

  return {
    action,
    text: { distanceToWaypoint },
  }
}

const computeSurveillanceDecision = (
  agent: AgentRenderState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature consistency
  _tick: number,
): { action: ProposedAction; text: SurveillanceObservation } => {
  const anchor = agent.waypoints[0] ?? agent.position
  const dx = anchor.x - agent.position.x
  const dz = anchor.z - agent.position.z
  const distanceToAnchor = Math.sqrt(dx * dx + dz * dz)

  const action: ProposedAction =
    distanceToAnchor < 6
      ? {
          kind: 'MAINTAIN_STATION',
          targetPosition: anchor,
          note: 'Holding station over infrastructure asset.',
        }
      : {
          kind: 'MOVE_TO_WAYPOINT',
          targetPosition: anchor,
          note: 'Recentering on station position to maintain optimal coverage.',
        }

  return {
    action,
    text: { distanceToAnchor },
  }
}

const computeEscortDecision = (
  agent: AgentRenderState,
  tick: number,
): { action: ProposedAction; text: EscortObservation } => {
  const forward = agent.waypoints[0] ?? agent.position
  const back = agent.waypoints[1] ?? agent.position
  const spanX = forward.x - back.x
  const spanZ = forward.z - back.z
  const spanSq = spanX * spanX + spanZ * spanZ || 1

  const t =
    ((agent.position.x - back.x) * spanX + (agent.position.z - back.z) * spanZ) /
    spanSq
  const corridorProgress = Math.min(1, Math.max(0, t))

  const movingForward = (Math.floor(tick / 80) % 2) === 0
  const target = movingForward ? forward : back

  const action: ProposedAction = {
    kind: 'MAINTAIN_ESCORT',
    targetPosition: target,
    note: movingForward
      ? 'Advancing along escort corridor towards harbor ingress.'
      : 'Returning along corridor to maintain continuous escort coverage.',
  }

  return {
    action,
    text: { corridorProgress },
  }
}

const computeHostileDecision = (
  agent: AgentRenderState,
  tick: number,
): ProposedAction => {
  const target = agent.waypoints[agent.currentWaypointIndex] ?? agent.position
  const phase = Math.floor(tick / 60) % 3

  if (phase === 0) {
    return {
      kind: 'INVESTIGATE_CONTACT',
      targetPosition: target,
      note: 'Probing ingress route towards operational area.',
    }
  }

  if (phase === 1) {
    return {
      kind: 'INTERCEPT_INTRUDER',
      targetPosition: target,
      note: 'Testing defender response by approaching corridor.',
    }
  }

  return {
    kind: 'HOLD_POSITION',
    targetPosition: agent.position,
    note: 'Holding in low-observable pattern and watching defender movements.',
  }
}

const computeDecisionTexts = (
  agent: AgentRenderState,
  tick: number,
  action: ProposedAction,
): AgentDecisionState => {
  const stageOrder: AgentRenderState['decisionState']['stage'][] = [
    'OBSERVE',
    'DERIVE',
    'ASSUME',
    'DECIDE',
    'ACT',
  ]
  const stageIndex = tick % stageOrder.length
  const stage = stageOrder[stageIndex]

  let observe = ''
  let derive = ''
  let assume = ''
  let decide = ''
  let act = ''

  if (agent.type === 'PATROL') {
    observe = 'Monitoring perimeter geometry, current waypoint, and relative spacing to peers.'
    derive =
      action.kind === 'MOVE_TO_WAYPOINT'
        ? 'Route is clear; continuing perimeter sweep.'
        : 'Holding pattern near waypoint.'
    assume = 'No elevated threat indicators detected in patrol sector.'
    decide =
      action.kind === 'MOVE_TO_WAYPOINT'
        ? 'Advance to next patrol waypoint to maintain area coverage.'
        : 'Maintain current holding pattern until sector state changes.'
    act =
      action.kind === 'MOVE_TO_WAYPOINT'
        ? 'Adjusting heading towards patrol waypoint and updating trail state.'
        : 'Maintaining current heading and speed within patrol band.'
  } else if (agent.type === 'SURVEILLANCE') {
    observe = 'Tracking relative offset to infrastructure anchor and local motion field.'
    derive =
      action.kind === 'MAINTAIN_STATION'
        ? 'Within acceptable station-keeping tolerance.'
        : 'Drift exceeds tolerance; recentring required.'
    assume = 'Monitoring priority is higher than maneuvering efficiency.'
    decide =
      action.kind === 'MAINTAIN_STATION'
        ? 'Hold position and continue persistent sensing.'
        : 'Perform short correction towards anchor to restore optimal coverage.'
    act =
      action.kind === 'MAINTAIN_STATION'
        ? 'Maintaining low-speed loiter around anchor point.'
        : 'Executing minimal reposition manoeuvre back to station.'
  } else if (agent.type === 'ESCORT') {
    observe = 'Assessing position along escort corridor and spacing to notional vessel track.'
    derive = movingAlongCorridor(action)
      ? 'Escort line requires forward coverage along route.'
      : 'Rear coverage required to preserve continuous escort envelope.'
    assume = 'Protection of corridor traffic has priority over minimizing transit time.'
    decide = movingAlongCorridor(action)
      ? 'Advance along corridor to maintain lead coverage.'
      : 'Translate back along corridor to reinforce trailing coverage.'
    act = movingAlongCorridor(action)
      ? 'Repositioning forward along escort line.'
      : 'Repositioning aft along escort line.'
  } else {
    observe = 'Sampling ingress vector and local defender presence.'
    derive = hostileIsAdvancing(action)
      ? 'Ingress route remains viable for intrusion probe.'
      : 'Defender posture suggests evasive pattern is preferable.'
    assume = 'Objective is to test coordination and response without immediate engagement.'
    decide = hostileIsAdvancing(action)
      ? 'Advance along ingress to probe defenses.'
      : 'Hold or sidestep to avoid direct interception.'
    act = hostileIsAdvancing(action)
      ? 'Executing intrusion-oriented movement towards operational area.'
      : 'Adopting lateral or holding movement to complicate interception.'
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

const movingAlongCorridor = (action: ProposedAction): boolean => {
  return action.kind === 'MAINTAIN_ESCORT' || action.kind === 'MOVE_TO_WAYPOINT'
}

const hostileIsAdvancing = (action: ProposedAction): boolean => {
  return action.kind === 'INVESTIGATE_CONTACT' || action.kind === 'INTERCEPT_INTRUDER'
}

export const advanceAgents = (
  agents: AgentRenderState[],
  tick: number,
): AgentRenderState[] => {
  const { policy, registerGovernanceOutcome, governanceStats } =
    useSimulationUiStore.getState()

  return agents.map((agent) => {
    const waypoints = agent.waypoints
    if (!waypoints.length) return agent

    let proposedAction: ProposedAction

    if (agent.type === 'PATROL') {
      proposedAction = computePatrolDecision(agent, tick).action
    } else if (agent.type === 'SURVEILLANCE') {
      proposedAction = computeSurveillanceDecision(agent, tick).action
    } else if (agent.type === 'ESCORT') {
      proposedAction = computeEscortDecision(agent, tick).action
    } else {
      proposedAction = computeHostileDecision(agent, tick)
    }

    let decisionState: AgentDecisionState = computeDecisionTexts(agent, tick, proposedAction)

    const worldViewAgents: Agent[] = agents
    const evaluation = evaluateGovernance(
      agent,
      proposedAction,
      {
        tick,
        agents: worldViewAgents,
      },
      policy,
    )

    registerGovernanceOutcome({
      agentId: agent.id,
      tick,
      allowed: evaluation.allowed,
      constraintsTriggered: evaluation.constraintsTriggered,
    })

    let effectiveAction: ProposedAction = proposedAction

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
      decisionState = {
        ...decisionState,
        lastActionType: proposedAction.kind,
        lastDecisionTick: tick,
      }
    }

    const target =
      effectiveAction.targetPosition ?? waypoints[agent.currentWaypointIndex]

    const step =
      agent.type === 'PATROL' ? 4.0 : agent.type === 'SURVEILLANCE' ? 1.2 : 2.6

    const { next, headingDeg } = advanceTowards(agent.position, target, step)

    const distanceToTarget = Math.sqrt(
      (target.x - next.x) ** 2 + (target.y - next.y) ** 2 + (target.z - next.z) ** 2,
    )
    const closeThreshold = 8
    const nextIndex =
      distanceToTarget <= closeThreshold
        ? (agent.currentWaypointIndex + 1) % waypoints.length
        : agent.currentWaypointIndex

    const nextTrail = [...agent.trail, next]
    const totalDecisions = governanceStats.total
    const trailLimit =
      totalDecisions > 1200 ? 10 : totalDecisions > 600 ? 16 : 22
    if (nextTrail.length > trailLimit) {
      nextTrail.splice(0, nextTrail.length - trailLimit)
    }

    const proofBundle = buildProofBundle(
      agent,
      proposedAction,
      decisionState,
      evaluation,
      agent.chainHeadHash,
      tick,
    )

    const nextProofs = [...agent.recentProofBundles, proofBundle]
    if (nextProofs.length > 10) {
      nextProofs.splice(0, nextProofs.length - 10)
    }

    return {
      ...agent,
      position: next,
      headingDeg,
      currentWaypointIndex: nextIndex,
      trail: nextTrail,
      decisionState,
      chainHeadHash: proofBundle.hash,
      recentProofBundles: nextProofs,
    }
  })
}

export const getAgentColor = (type: AgentType): string => {
  switch (type) {
    case 'PATROL':
      return '#4ea6ff'
    case 'SURVEILLANCE':
      return '#f3b34c'
    case 'ESCORT':
      return '#4de3c4'
    case 'HOSTILE':
      return '#ff4b6a'
    default:
      return '#ffffff'
  }
}

