/**
 * Scenario agent creation. Delegates to typed config + engine for determinism.
 * Used by worker (via instantiateScenario) and by createInitialAgents (main thread).
 */

import type { AgentRenderState, ScenarioId } from '../../types/simulation'
import { DEFAULT_SEED } from '../../lib/utils/seededRandom'
import { getScenarioConfig } from '../scenarios/scenarioConfigs'
import { instantiateScenario } from '../scenarios/scenarioEngine'

/**
 * Create initial agents for a scenario. Deterministic given scenarioId and seed.
 * Delegates to instantiateScenario(getScenarioConfig(scenarioId), seed).
 */
export function createScenarioAgents(
  scenarioId: ScenarioId,
  seed: number = DEFAULT_SEED,
): AgentRenderState[] {
  const config = getScenarioConfig(scenarioId)
  return instantiateScenario(config, seed).agents
}
