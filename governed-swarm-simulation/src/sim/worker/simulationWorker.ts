/**
 * Simulation worker. Owns agent state, advance step, governance stats, proof chain.
 * Does not import React, Three.js, or R3F. Main thread owns the clock and sends TICK.
 */

import type { MainToWorkerMessage, WorkerToMainMessage } from './messages'
import type { GovernanceStatsSnapshot } from './messages'
import type { AgentRenderState } from '../../types/simulation'
import { getScenarioConfig } from '../scenarios/scenarioConfigs'
import { instantiateScenario } from '../scenarios/scenarioEngine'
import { advanceAgentsPure } from '../engine/advanceAgentsPure'

let agents: AgentRenderState[] = []
let governanceStats: GovernanceStatsSnapshot = {
  total: 0,
  allowed: 0,
  blocked: 0,
  escalationEvents: 0,
  isolatedCount: 0,
  shadowVerification: { passed: 0, failed: 0 },
}
let policy = {
  noFlyZone: true,
  minSafeDistance: true,
  escalationProtocol: true,
  batteryReserve: true,
}

function postToMain(msg: WorkerToMainMessage): void {
  self.postMessage(msg)
}

function handleInitScenario(msg: Extract<MainToWorkerMessage, { type: 'INIT_SCENARIO' }>): void {
  const config = getScenarioConfig(msg.scenarioId)
  const state = instantiateScenario(config, msg.seed)
  agents = state.agents
  policy = msg.policy
  governanceStats = {
    total: 0,
    allowed: 0,
    blocked: 0,
    escalationEvents: 0,
    isolatedCount: 0,
    shadowVerification: { passed: 0, failed: 0 },
  }
  postToMain({ type: 'RUN_INITIALIZED', agents })
}

function handleReset(msg: Extract<MainToWorkerMessage, { type: 'RESET' }>): void {
  const config = getScenarioConfig(msg.scenarioId)
  const state = instantiateScenario(config, msg.seed)
  agents = state.agents
  governanceStats = {
    total: 0,
    allowed: 0,
    blocked: 0,
    escalationEvents: 0,
    isolatedCount: 0,
    shadowVerification: { passed: 0, failed: 0 },
  }
  postToMain({ type: 'RUN_INITIALIZED', agents })
}

function handleTick(msg: Extract<MainToWorkerMessage, { type: 'TICK' }>): void {
  policy = msg.policy
  const result = advanceAgentsPure(agents, msg.tick, policy, governanceStats.total)
  agents = result.agents
  const sv = governanceStats.shadowVerification ?? { passed: 0, failed: 0 }
  governanceStats = {
    total: governanceStats.total + result.statsDelta.total,
    allowed: governanceStats.allowed + result.statsDelta.allowed,
    blocked: governanceStats.blocked + result.statsDelta.blocked,
    escalationEvents: governanceStats.escalationEvents + result.statsDelta.escalationEvents,
    isolatedCount: (governanceStats.isolatedCount ?? 0) + result.statsDelta.isolatedCount,
    shadowVerification: {
      passed: sv.passed + result.statsDelta.shadowPassed,
      failed: sv.failed + result.statsDelta.shadowFailed,
    },
  }
  postToMain({
    type: 'STATE_UPDATE',
    tick: msg.tick,
    agents,
    governanceStats,
    proofBundlesDelta: result.proofBundlesDelta,
  })
}

function handleRequestState(): void {
  postToMain({ type: 'STATE_SNAPSHOT', agents, governanceStats })
}

self.onmessage = (event: MessageEvent<MainToWorkerMessage>) => {
  const msg = event.data
  switch (msg.type) {
    case 'INIT_SCENARIO':
      handleInitScenario(msg)
      break
    case 'TICK':
      handleTick(msg)
      break
    case 'RESET':
      handleReset(msg)
      break
    case 'REQUEST_STATE':
      handleRequestState()
      break
    default:
      break
  }
}
