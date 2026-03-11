/**
 * Deterministic replay check: run same scenario twice with identical seed,
 * capture proof hashes, governance stats, first agent position at tick 50; verify match.
 */

import type { ScenarioId } from '../types/simulation'
import type { AgentRenderState } from '../types/simulation'
import type { GovernancePolicyConfig } from '../sim/governance/governance'
import { getScenarioConfig } from '../sim/scenarios/scenarioConfigs'
import { instantiateScenario } from '../sim/scenarios/scenarioEngine'
import { advanceAgentsPure } from '../sim/engine/advanceAgentsPure'

const DEFAULT_POLICY: GovernancePolicyConfig = {
  noFlyZone: true,
  minSafeDistance: true,
  escalationProtocol: true,
  batteryReserve: true,
}

function runScenarioToTick(
  scenarioId: ScenarioId,
  seed: number,
  upToTick: number,
): {
  agents: AgentRenderState[]
  governanceTotal: number
  first20Hashes: string[]
} {
  const config = getScenarioConfig(scenarioId)
  let state = instantiateScenario(config, seed)
  let agents = state.agents
  let governanceTotal = 0
  const hashes: string[] = []

  for (let tick = 0; tick <= upToTick; tick += 1) {
    const result = advanceAgentsPure(agents, tick, DEFAULT_POLICY, governanceTotal)
    agents = result.agents
    governanceTotal += result.statsDelta.total
    for (const b of result.proofBundlesDelta) {
      if (hashes.length < 20) hashes.push(b.hash)
    }
  }

  return {
    agents,
    governanceTotal,
    first20Hashes: hashes.slice(0, 20),
  }
}

export interface DeterminismResult {
  match: boolean
  scenarioId: ScenarioId
  seed: number
  tick: number
  firstAgentPositionA: { x: number; y: number; z: number } | null
  firstAgentPositionB: { x: number; y: number; z: number } | null
  governanceTotalA: number
  governanceTotalB: number
  hashMismatchIndex: number | null
  errors: string[]
}

export function verifyDeterminism(
  scenarioId: ScenarioId = 'routine_patrol',
  seed = 42,
  tick = 50,
): DeterminismResult {
  const errors: string[] = []
  const runA = runScenarioToTick(scenarioId, seed, tick)
  const runB = runScenarioToTick(scenarioId, seed, tick)

  let hashMismatchIndex: number | null = null
  for (let i = 0; i < Math.max(runA.first20Hashes.length, runB.first20Hashes.length); i += 1) {
    if (runA.first20Hashes[i] !== runB.first20Hashes[i]) {
      hashMismatchIndex = i
      errors.push(
        `Hash mismatch at index ${i}: A=${runA.first20Hashes[i] ?? 'missing'} B=${runB.first20Hashes[i] ?? 'missing'}`,
      )
      break
    }
  }

  if (runA.governanceTotal !== runB.governanceTotal) {
    errors.push(`Governance total mismatch: A=${runA.governanceTotal} B=${runB.governanceTotal}`)
  }

  const posA = runA.agents[0]?.position ?? null
  const posB = runB.agents[0]?.position ?? null
  if (posA && posB) {
    if (posA.x !== posB.x || posA.y !== posB.y || posA.z !== posB.z) {
      errors.push(
        `First agent position at tick ${tick} mismatch: A=(${posA.x},${posA.y},${posA.z}) B=(${posB.x},${posB.y},${posB.z})`,
      )
    }
  } else if (posA !== posB) {
    errors.push('First agent position missing in one run')
  }

  return {
    match: errors.length === 0,
    scenarioId,
    seed,
    tick,
    firstAgentPositionA: posA ? { ...posA } : null,
    firstAgentPositionB: posB ? { ...posB } : null,
    governanceTotalA: runA.governanceTotal,
    governanceTotalB: runB.governanceTotal,
    hashMismatchIndex,
    errors,
  }
}

export function logDeterminismResult(r: DeterminismResult): void {
  const status = r.match ? 'PASS' : 'FAIL'
  console.log(`[${status}] Determinism ${r.scenarioId} seed=${r.seed} tick=${r.tick}`)
  if (!r.match) {
    r.errors.forEach((e) => console.log(`  - ${e}`))
  }
}
