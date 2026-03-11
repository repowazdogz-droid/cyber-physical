/**
 * Lightweight memory guard: monitor proof bundles, agents, trail lengths.
 * If over limits, log warning and trim in-memory copies (does not affect audit sink or worker).
 * Used by runtime coordinator when applying STATE_UPDATE.
 */

import type { AgentRenderState } from '../types/simulation'

const MAX_TOTAL_BUNDLES = 8000
const MAX_TOTAL_TRAIL_POINTS = 40000
const MAX_AGENTS = 120
const TRIM_BUNDLES_TO = 5
const TRIM_TRAIL_TO = 12

export interface MemoryGuardResult {
  agents: AgentRenderState[]
  warned: boolean
  totalBundles: number
  totalTrailPoints: number
  agentCount: number
}

function totalProofBundles(agents: AgentRenderState[]): number {
  return agents.reduce((sum, a) => sum + (a.recentProofBundles?.length ?? 0), 0)
}

function sumTrailPoints(agents: AgentRenderState[]): number {
  return agents.reduce((sum, a) => sum + (a.trail?.length ?? 0), 0)
}

function trimAgent(agent: AgentRenderState): AgentRenderState {
  const bundles = agent.recentProofBundles ?? []
  const trail = agent.trail ?? []
  return {
    ...agent,
    recentProofBundles: bundles.length > TRIM_BUNDLES_TO ? bundles.slice(-TRIM_BUNDLES_TO) : bundles,
    trail: trail.length > TRIM_TRAIL_TO ? trail.slice(-TRIM_TRAIL_TO) : trail,
  }
}

/**
 * Check agent list against limits. If over, log warning and return trimmed copy.
 * Trimming only affects the in-memory copy passed to the store; worker and audit sink unchanged.
 */
export function checkAndTrim(agents: AgentRenderState[]): MemoryGuardResult {
  const agentCount = agents.length
  const totalBundles = totalProofBundles(agents)
  const totalTrailPoints = sumTrailPoints(agents)

  const overBundles = totalBundles > MAX_TOTAL_BUNDLES
  const overTrail = totalTrailPoints > MAX_TOTAL_TRAIL_POINTS
  const overAgents = agentCount > MAX_AGENTS
  const warned = overBundles || overTrail || overAgents

  if (warned) {
    const parts: string[] = []
    if (overBundles) parts.push(`proofBundles=${totalBundles} > ${MAX_TOTAL_BUNDLES}`)
    if (overTrail) parts.push(`trailPoints=${totalTrailPoints} > ${MAX_TOTAL_TRAIL_POINTS}`)
    if (overAgents) parts.push(`agents=${agentCount} > ${MAX_AGENTS}`)
    console.warn(`[MemoryGuard] Trimming in-memory state: ${parts.join('; ')}`)
  }

  const outAgents = warned ? agents.map(trimAgent) : agents

  return {
    agents: outAgents,
    warned,
    totalBundles,
    totalTrailPoints,
    agentCount,
  }
}
