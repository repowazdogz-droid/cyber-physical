/**
 * Worker message protocol. All payloads are structured-clone-safe (plain objects/arrays).
 * Main thread owns the clock and sends TICK; worker owns simulation state and replies with state.
 */

import type { AgentRenderState, ProofBundle, ScenarioId } from '../../types/simulation'
import type { GovernancePolicyConfig } from '../governance/governance'

export interface ShadowVerificationCounts {
  passed: number
  failed: number
}

export interface GovernanceStatsSnapshot {
  total: number
  allowed: number
  blocked: number
  escalationEvents: number
  isolatedCount?: number
  shadowVerification?: ShadowVerificationCounts
}

// ---- Main → Worker ----

export interface InitScenarioPayload {
  scenarioId: ScenarioId
  seed: number
  policy: GovernancePolicyConfig
}

export interface TickPayload {
  tick: number
  policy: GovernancePolicyConfig
}

export interface ResetPayload {
  scenarioId: ScenarioId
  seed: number
}

export type MainToWorkerMessage =
  | { type: 'INIT_SCENARIO'; scenarioId: ScenarioId; seed: number; policy: GovernancePolicyConfig }
  | { type: 'TICK'; tick: number; policy: GovernancePolicyConfig }
  | { type: 'RESET'; scenarioId: ScenarioId; seed: number }
  | { type: 'REQUEST_STATE' }

// ---- Worker → Main ----

export interface StateUpdatePayload {
  tick: number
  agents: AgentRenderState[]
  governanceStats: GovernanceStatsSnapshot
  proofBundlesDelta: ProofBundle[]
}

export interface RunInitializedPayload {
  agents: AgentRenderState[]
}

export interface StateSnapshotPayload {
  agents: AgentRenderState[]
  governanceStats: GovernanceStatsSnapshot
}

export type WorkerToMainMessage =
  | { type: 'STATE_UPDATE'; tick: number; agents: AgentRenderState[]; governanceStats: GovernanceStatsSnapshot; proofBundlesDelta: ProofBundle[] }
  | { type: 'RUN_INITIALIZED'; agents: AgentRenderState[] }
  | { type: 'STATE_SNAPSHOT'; agents: AgentRenderState[]; governanceStats: GovernanceStatsSnapshot }
