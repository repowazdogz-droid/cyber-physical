export type AgentType = 'PATROL' | 'SURVEILLANCE' | 'ESCORT' | 'HOSTILE'

export type AgentDecisionCycleStage = 'OBSERVE' | 'DERIVE' | 'ASSUME' | 'DECIDE' | 'ACT'

export type AgentStatus = 'IDLE' | 'ON_MISSION' | 'RETURNING' | 'COMPROMISED' | 'ISOLATED' | 'DISABLED' | 'LOW_BATTERY' | 'CHARGING'

export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface AgentDecisionState {
  stage: AgentDecisionCycleStage
  observe: string
  derive: string
  assume: string
  decide: string
  act: string
  lastActionType: string
  lastDecisionTick: number
}

export interface ProposedAction {
  kind:
    | 'MOVE_TO_WAYPOINT'
    | 'HOLD_POSITION'
    | 'MAINTAIN_STATION'
    | 'MAINTAIN_ESCORT'
    | 'INVESTIGATE_CONTACT'
    | 'WARN_INTRUDER'
    | 'INTERCEPT_INTRUDER'
    | 'RETURN_TO_BASE'
    | 'ADVERSARIAL_APPROACH'
    | 'ADVERSARIAL_INTERFERENCE'
  targetPosition?: Vector3
  targetHeadingDeg?: number
  targetSpeed?: number
  targetAgentId?: string
  channel?: 'WARNING' | 'HANDOFF' | 'DETECT_THREAT' | 'REQUEST_SUPPORT'
  note?: string
}

export interface Agent {
  id: string
  type: AgentType
  position: Vector3
  headingDeg: number
  speed: number
  batteryPercent: number
  sensorRangeMeters: number
  missionObjective: string
  status: AgentStatus
  decisionState: AgentDecisionState
  chainHeadHash: string | null
  recentProofBundles: ProofBundle[]
}

/** Agent plus render-only fields (waypoints, trail). Used by sim engine and worker. */
export interface AgentRenderState extends Agent {
  waypoints: Vector3[]
  currentWaypointIndex: number
  trail: Vector3[]
}

export type PolicyRuleId =
  | 'NO_FLY_ZONE'
  | 'MIN_SAFE_DISTANCE'
  | 'BATTERY_RESERVE'
  | 'ESCALATION_PROTOCOL'
  | 'RULES_OF_ENGAGEMENT'
  | 'COORDINATION_INTEGRITY'
  | 'COMPROMISED_ISOLATION'
  | 'MIN_DISTANCE_VIOLATION'
  | 'HOSTILE_ACTION_BLOCKED'

export interface PolicyRule {
  id: PolicyRuleId
  label: string
  description: string
  enabled: boolean
}

export interface WorldWeatherState {
  windKts: number
  visibilityKm: number
  seaState: 'CALM' | 'MODERATE' | 'ROUGH'
}

export interface WorldState {
  tick: number
  seed: number
  timeOfDay: 'DAY' | 'NIGHT'
  weather: WorldWeatherState
}

export interface ShadowVerificationAttachment {
  decisionMatches: boolean
  hashMatches: boolean
  integrityOk: boolean
  recomputedHash: string
  /** Shadow-recomputed allow/block result for display. */
  allowedRecomputed: boolean
}

export interface ProofBundle {
  agentId: string
  tick: number
  timestampMs: number
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
  hash: string
  /** Set by shadow verifier when integrated in worker/engine. */
  shadowVerification?: ShadowVerificationAttachment
  /** Present when blocked for adversarial action (MIN_DISTANCE_VIOLATION or HOSTILE_ACTION_BLOCKED). */
  targetAgentId?: string
  distanceAtBlock?: number
  actionAttempted?: string
}

export interface AgentStateSnapshot {
  id: string
  position: [number, number, number]
  status: string
  battery: number
  action: string
  decisionText: string
  governanceResult: 'ALLOWED' | 'BLOCKED'
  blockReason?: string
  targetAgentId?: string
  distance?: number
}

export interface RunSnapshot {
  tick: number
  agentStates: AgentStateSnapshot[]
  timestamp: number
}

export type ScenarioId =
  | 'routine_patrol'
  | 'threat_detection'
  | 'governance_failure'
  | 'adversarial_coordination_attack'

export interface ScenarioDefinition {
  id: ScenarioId
  label: string
  description: string
}

export interface VerificationResult {
  ok: boolean
  reason?: string
  proofBundles: ProofBundle[]
}

export type GovernanceEventType =
  | 'DECISION_ALLOWED'
  | 'DECISION_BLOCKED'
  | 'RULE_TOGGLED'
  | 'AGENT_COMPROMISED_DETECTED'
  | 'CHAIN_VERIFIED'

export interface GovernanceEvent {
  id: string
  type: GovernanceEventType
  agentId?: string
  tick: number
  timestampMs: number
  details: string
}

