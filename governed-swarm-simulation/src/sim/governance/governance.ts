import type {
  Agent,
  AgentDecisionState,
  PolicyRuleId,
  ProofBundle,
  ProposedAction,
} from '../../types/simulation'
import type { Vector3 } from '../../types/simulation'
import { NO_GO_ZONES } from '../world/worldConfig'
import { sha256Hex } from '../../lib/hash/sha256'

export interface GovernanceWorldView {
  tick: number
  agents: Agent[]
}

export interface GovernancePolicyConfig {
  noFlyZone: boolean
  minSafeDistance: boolean
  escalationProtocol: boolean
  batteryReserve: boolean
}

export interface GovernanceEvaluation {
  allowed: boolean
  reason: string
  constraintsTriggered: PolicyRuleId[]
  /** Set when blocked for MIN_DISTANCE_VIOLATION or HOSTILE_ACTION_BLOCKED. */
  targetAgentId?: string
  distanceAtBlock?: number
  actionAttempted?: string
  /** Set when blocked for HOSTILE_ACTION_BLOCKED; caller should set agent status to COMPROMISED. */
  tagCompromised?: boolean
}

export interface GovernanceResult extends GovernanceEvaluation {
  proofBundle: ProofBundle
}

const MIN_SAFE_DISTANCE_METERS = 14
const BATTERY_RESERVE_PERCENT = 15

const isInsideNoGoZone = (position: Vector3): boolean => {
  return NO_GO_ZONES.some((zone) => {
    const [cx, cy, cz] = zone.center
    const [sx, sy, sz] = zone.size
    const minX = cx - sx / 2
    const maxX = cx + sx / 2
    const minY = cy - sy / 2
    const maxY = cy + sy / 2
    const minZ = cz - sz / 2
    const maxZ = cz + sz / 2
    return (
      position.x >= minX &&
      position.x <= maxX &&
      position.y >= minY &&
      position.y <= maxY &&
      position.z >= minZ &&
      position.z <= maxZ
    )
  })
}

const distance3d = (a: Vector3, b: Vector3): number => {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

const ADVERSARIAL_APPROACH_BLOCK_METERS = 50

export const evaluateGovernance = (
  agent: Agent,
  proposedAction: ProposedAction,
  world: GovernanceWorldView,
  policy: GovernancePolicyConfig,
): GovernanceEvaluation => {
  const constraintsTriggered: PolicyRuleId[] = []
  let blockTargetAgentId: string | undefined
  let blockDistance: number | undefined
  let blockActionAttempted: string | undefined
  let tagCompromised = false

  if (proposedAction.kind === 'ADVERSARIAL_INTERFERENCE') {
    constraintsTriggered.push('HOSTILE_ACTION_BLOCKED')
    tagCompromised = true
    blockActionAttempted = 'ADVERSARIAL_INTERFERENCE'
    if (proposedAction.targetAgentId) {
      blockTargetAgentId = proposedAction.targetAgentId
      const target = world.agents.find((a) => a.id === proposedAction.targetAgentId)
      if (target) blockDistance = distance3d(agent.position, target.position)
    }
  }

  if (proposedAction.kind === 'ADVERSARIAL_APPROACH') {
    let nearestDist = Infinity
    let nearestId: string | undefined
    for (const other of world.agents) {
      if (other.id === agent.id) continue
      const d = distance3d(agent.position, other.position)
      if (d < nearestDist) {
        nearestDist = d
        nearestId = other.id
      }
    }
    if (nearestDist < ADVERSARIAL_APPROACH_BLOCK_METERS) {
      constraintsTriggered.push('MIN_DISTANCE_VIOLATION')
      blockTargetAgentId = nearestId
      blockDistance = nearestDist
      blockActionAttempted = 'ADVERSARIAL_APPROACH'
    }
  }

  const candidatePosition = proposedAction.targetPosition ?? agent.position

  if (policy.noFlyZone && isInsideNoGoZone(candidatePosition)) {
    constraintsTriggered.push('NO_FLY_ZONE')
  }

  const isMovementAction =
    proposedAction.kind === 'MOVE_TO_WAYPOINT' ||
    proposedAction.kind === 'MAINTAIN_ESCORT' ||
    proposedAction.kind === 'MAINTAIN_STATION' ||
    proposedAction.kind === 'INTERCEPT_INTRUDER' ||
    proposedAction.kind === 'INVESTIGATE_CONTACT' ||
    proposedAction.kind === 'RETURN_TO_BASE'

  if (policy.minSafeDistance && isMovementAction) {
    for (const other of world.agents) {
      if (other.id === agent.id) continue
      const d = distance3d(candidatePosition, other.position)
      if (d < MIN_SAFE_DISTANCE_METERS) {
        constraintsTriggered.push('MIN_SAFE_DISTANCE')
        break
      }
    }
  }

  if (
    policy.batteryReserve &&
    agent.batteryPercent < BATTERY_RESERVE_PERCENT &&
    proposedAction.kind !== 'RETURN_TO_BASE'
  ) {
    constraintsTriggered.push('BATTERY_RESERVE')
  }

  if (policy.escalationProtocol) {
    if (
      proposedAction.kind === 'INTERCEPT_INTRUDER' ||
      proposedAction.kind === 'WARN_INTRUDER' ||
      proposedAction.kind === 'INVESTIGATE_CONTACT'
    ) {
      constraintsTriggered.push('ESCALATION_PROTOCOL')
      constraintsTriggered.push('RULES_OF_ENGAGEMENT')
    }
  }

  if (agent.status === 'COMPROMISED') {
    constraintsTriggered.push('COORDINATION_INTEGRITY', 'COMPROMISED_ISOLATION')
  }

  const blockingConstraints: PolicyRuleId[] = [
    'MIN_DISTANCE_VIOLATION',
    'HOSTILE_ACTION_BLOCKED',
    'NO_FLY_ZONE',
    'MIN_SAFE_DISTANCE',
    'BATTERY_RESERVE',
    'COMPROMISED_ISOLATION',
  ]

  const hasBlocking = constraintsTriggered.some((c) => blockingConstraints.includes(c))

  let allowed = true
  let reason = 'All policy checks passed.'

  if (hasBlocking) {
    allowed = false
    const first = constraintsTriggered.find((c) => blockingConstraints.includes(c))
    if (first === 'MIN_DISTANCE_VIOLATION') {
      reason = 'MIN_DISTANCE_VIOLATION'
    } else if (first === 'HOSTILE_ACTION_BLOCKED') {
      reason = 'HOSTILE_ACTION_BLOCKED'
    } else if (first === 'NO_FLY_ZONE') {
      reason = 'Proposed action would enter a designated no-fly volume.'
    } else if (first === 'MIN_SAFE_DISTANCE') {
      reason = 'Proposed action would violate minimum safe separation between agents.'
    } else if (first === 'BATTERY_RESERVE') {
      reason = 'BATTERY_RESERVE_CRITICAL'
    } else if (first === 'COMPROMISED_ISOLATION') {
      reason = 'coordination integrity violation'
    }
  }

  return {
    allowed,
    reason,
    constraintsTriggered,
    ...(blockTargetAgentId !== undefined && { targetAgentId: blockTargetAgentId }),
    ...(blockDistance !== undefined && { distanceAtBlock: blockDistance }),
    ...(blockActionAttempted !== undefined && { actionAttempted: blockActionAttempted }),
    ...(tagCompromised && { tagCompromised: true }),
  }
}

export const buildCanonicalProofPayload = (input: {
  agentId: string
  tick: number
  observe: string
  derive: string
  assume: string
  decide: string
  act: string
  proposedAction: ProposedAction
  allowed: boolean
  reason: string
  constraintsTriggered: PolicyRuleId[]
  prevHash: string | null
  targetAgentId?: string
  distanceAtBlock?: number
  actionAttempted?: string
}): string => {
  const canonical: Record<string, unknown> = {
    agentId: input.agentId,
    tick: input.tick,
    observe: input.observe,
    derive: input.derive,
    assume: input.assume,
    decide: input.decide,
    act: input.act,
    proposedAction: input.proposedAction,
    allowed: input.allowed,
    reason: input.reason,
    constraintsTriggered: input.constraintsTriggered,
    prevHash: input.prevHash,
  }
  if (input.targetAgentId !== undefined) canonical.targetAgentId = input.targetAgentId
  if (input.distanceAtBlock !== undefined) canonical.distanceAtBlock = input.distanceAtBlock
  if (input.actionAttempted !== undefined) canonical.actionAttempted = input.actionAttempted

  return JSON.stringify(canonical)
}

export const buildProofBundle = (
  agent: Agent,
  proposedAction: ProposedAction,
  decisionState: AgentDecisionState,
  evaluation: GovernanceEvaluation,
  prevHash: string | null,
  tick: number,
): ProofBundle => {
  const canonical = buildCanonicalProofPayload({
    agentId: agent.id,
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

  const hash = sha256Hex(canonical)

  const timestampMs = tick * 250

  const bundle: ProofBundle = {
    agentId: agent.id,
    tick,
    timestampMs,
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
    hash,
  }
  if (evaluation.targetAgentId !== undefined) bundle.targetAgentId = evaluation.targetAgentId
  if (evaluation.distanceAtBlock !== undefined) bundle.distanceAtBlock = evaluation.distanceAtBlock
  if (evaluation.actionAttempted !== undefined) bundle.actionAttempted = evaluation.actionAttempted
  return bundle
}

export interface ChainVerificationResult {
  ok: boolean
  brokenIndex?: number
}

export const verifyProofChain = (bundles: ProofBundle[]): ChainVerificationResult => {
  if (bundles.length === 0) {
    return { ok: true }
  }

  for (let i = 0; i < bundles.length; i += 1) {
    const current = bundles[i]
    const expectedPrev = i === 0 ? null : bundles[i - 1].hash

    if (current.prevHash !== expectedPrev) {
      return { ok: false, brokenIndex: i }
    }

    const canonical = buildCanonicalProofPayload({
      agentId: current.agentId,
      tick: current.tick,
      observe: current.observe,
      derive: current.derive,
      assume: current.assume,
      decide: current.decide,
      act: current.act,
      proposedAction: current.proposedAction,
      allowed: current.allowed,
      reason: current.reason,
      constraintsTriggered: current.constraintsTriggered,
      prevHash: current.prevHash,
      targetAgentId: current.targetAgentId,
      distanceAtBlock: current.distanceAtBlock,
      actionAttempted: current.actionAttempted,
    })

    const recomputedHash = sha256Hex(canonical)
    if (recomputedHash !== current.hash) {
      return { ok: false, brokenIndex: i }
    }
  }

  return { ok: true }
}

