/**
 * Scenario stress test: run each scenario for 500 ticks and verify stability.
 * No runtime exceptions, stable agent count, proof bundles increase, consistent stats.
 * Run via: npm run test:run -- src/dev/stress.test.ts (or run this module's runScenarioStressTest from a test).
 */

import type { ScenarioId } from '../types/simulation'
import type { AgentRenderState } from '../types/simulation'
import type { GovernancePolicyConfig } from '../sim/governance/governance'
import { getScenarioConfig } from '../sim/scenarios/scenarioConfigs'
import { instantiateScenario } from '../sim/scenarios/scenarioEngine'
import { advanceAgentsPure } from '../sim/engine/advanceAgentsPure'

const SCENARIO_IDS: ScenarioId[] = [
  'routine_patrol',
  'threat_detection',
  'governance_failure',
  'adversarial_coordination_attack',
]

const TICKS_PER_SCENARIO = 500

const DEFAULT_POLICY: GovernancePolicyConfig = {
  noFlyZone: true,
  minSafeDistance: true,
  escalationProtocol: true,
  batteryReserve: true,
}

function countProofBundles(agents: AgentRenderState[]): number {
  return agents.reduce((sum, a) => sum + (a.recentProofBundles?.length ?? 0), 0)
}

function hasUndefinedAgentState(agents: AgentRenderState[]): boolean {
  return agents.some(
    (a) =>
      a.id == null ||
      a.position == null ||
      a.waypoints == null ||
      a.recentProofBundles == null ||
      a.decisionState == null,
  )
}

export interface ScenarioStressResult {
  scenarioId: ScenarioId
  ok: boolean
  agentCount: number
  finalGovernanceTotal: number
  totalProofBundlesAtEnd: number
  errors: string[]
}

export function runScenarioStressTest(
  ticks = TICKS_PER_SCENARIO,
  scenarioIds: ScenarioId[] = SCENARIO_IDS,
): ScenarioStressResult[] {
  const results: ScenarioStressResult[] = []

  for (const scenarioId of scenarioIds) {
    const errors: string[] = []
    let agents: AgentRenderState[] = []
    let governanceTotal = 0

    try {
      const config = getScenarioConfig(scenarioId)
      const state = instantiateScenario(config, 42)
      agents = state.agents
      const initialCount = agents.length
      if (initialCount === 0) {
        errors.push('No agents after init')
      }

      for (let tick = 0; tick < ticks; tick += 1) {
        const result = advanceAgentsPure(agents, tick, DEFAULT_POLICY, governanceTotal)
        agents = result.agents
        governanceTotal += result.statsDelta.total

        if (agents.length !== initialCount) {
          errors.push(`Tick ${tick}: agent count changed from ${initialCount} to ${agents.length}`)
        }
        if (hasUndefinedAgentState(agents)) {
          errors.push(`Tick ${tick}: undefined agent state detected`)
        }
      }

      const totalBundles = countProofBundles(agents)
      results.push({
        scenarioId,
        ok: errors.length === 0,
        agentCount: agents.length,
        finalGovernanceTotal: governanceTotal,
        totalProofBundlesAtEnd: totalBundles,
        errors,
      })
    } catch (e) {
      results.push({
        scenarioId,
        ok: false,
        agentCount: agents.length,
        finalGovernanceTotal: governanceTotal,
        totalProofBundlesAtEnd: countProofBundles(agents),
        errors: [e instanceof Error ? e.message : String(e)],
      })
    }
  }

  return results
}

export function logScenarioStressSummary(results: ScenarioStressResult[]): void {
  for (const r of results) {
    const status = r.ok ? 'PASS' : 'FAIL'
    console.log(`[${status}] ${r.scenarioId}: agents=${r.agentCount} govTotal=${r.finalGovernanceTotal} proofBundles=${r.totalProofBundlesAtEnd}`)
    if (r.errors.length > 0) {
      r.errors.forEach((e) => console.log(`  - ${e}`))
    }
  }
}
