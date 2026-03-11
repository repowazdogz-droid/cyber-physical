import type { FC } from 'react'
import { useEffect, useRef } from 'react'
import { useSimulationUiStore } from '../store/simulationStore'
import { useSimulationClockContext } from '../sim/clock/SimulationClockContext'
import { buildFreezeFrameCopy } from '../utils/freezeFrameCopy'

const FREEZE_FRAME_THROTTLE_TICKS = 15

export const FreezeFrameDetector: FC = () => {
  const agentsById = useSimulationUiStore((s) => s.agentsById)
  const currentScenarioId = useSimulationUiStore((s) => s.currentScenarioId)
  const scenarioRunId = useSimulationUiStore((s) => s.scenarioRunId)
  const setFreezeFrame = useSimulationUiStore((s) => s.setFreezeFrame)
  const { tick } = useSimulationClockContext()

  const lastBundleCountByAgent = useRef<Record<string, number>>({})
  const lastFreezeFrameTick = useRef<number>(-999)
  const hasSeenBlockThisScenario = useRef(false)
  const lastScenarioRunId = useRef<number>(-1)

  useEffect(() => {
    if (scenarioRunId !== lastScenarioRunId.current) {
      lastScenarioRunId.current = scenarioRunId
      hasSeenBlockThisScenario.current = false
      lastBundleCountByAgent.current = {}
    }
  }, [scenarioRunId])

  useEffect(() => {
    for (const agent of Object.values(agentsById)) {
      const bundles = agent.recentProofBundles ?? []
      const count = bundles.length
      const prevCount = lastBundleCountByAgent.current[agent.id] ?? 0
      lastBundleCountByAgent.current[agent.id] = count

      if (count <= prevCount) continue
      const lastBundle = bundles[bundles.length - 1]
      if (!lastBundle || lastBundle.allowed) continue

      const isSignificant =
        agent.status === 'COMPROMISED' ||
        agent.status === 'ISOLATED' ||
        currentScenarioId === 'adversarial_coordination_attack' ||
        !hasSeenBlockThisScenario.current

      if (!isSignificant) continue
      if (tick - lastFreezeFrameTick.current < FREEZE_FRAME_THROTTLE_TICKS) continue

      hasSeenBlockThisScenario.current = true
      lastFreezeFrameTick.current = tick

      const { actionDescription, policyReason, agentRole } = buildFreezeFrameCopy(
        agent.id,
        agent.type,
        lastBundle,
      )
      setFreezeFrame({
        agentId: agent.id,
        agentRole,
        actionDescription,
        policyReason,
        bundle: lastBundle,
      })
      break
    }
  }, [agentsById, currentScenarioId, tick, setFreezeFrame])

  return null
}
