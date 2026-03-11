import type { FC } from 'react'
import { useSimulationClockContext } from '../sim/clock/SimulationClockContext'
import { useSimulationUiStore } from '../store/simulationStore'
import { SimulationWorkerProvider } from '../sim/worker/SimulationWorkerContext'
import { WorldScene } from '../sim/world/WorldScene'

export const MainSimulationView: FC = () => {
  const isReplayMode = useSimulationUiStore((state) => state.isReplayMode)
  const replayTick = useSimulationUiStore((state) => state.replayTick)
  const agentsById = useSimulationUiStore((state) => state.agentsById)
  const currentScenarioId = useSimulationUiStore((state) => state.currentScenarioId)
  const { tick } = useSimulationClockContext()

  const displayTick = isReplayMode ? replayTick : tick
  const displayCycle = Math.floor(displayTick / 5) * 5
  const agentCount = Object.keys(agentsById).length || 50
  const totalGovernedDecisions = displayCycle * agentCount

  const showGovernanceBanner = currentScenarioId === 'governance_failure'
  const showHostileBanner = currentScenarioId === 'adversarial_coordination_attack'
  const showRedTint = currentScenarioId === 'governance_failure'

  return (
    <div className="shell-viewport">
      {showGovernanceBanner && (
        <div className="shell-viewport-scenario-banner shell-viewport-scenario-banner--degraded">
          ⚠ GOVERNANCE DEGRADED — Policy rules disabled
        </div>
      )}
      {showHostileBanner && (
        <div className="shell-viewport-scenario-banner shell-viewport-scenario-banner--hostile">
          ⚠ HOSTILE AGENT ACTIVE — Inspect agent behaviour to identify the threat
        </div>
      )}
      {showRedTint && (
        <div
          className="shell-viewport-tint shell-viewport-tint--red"
          aria-hidden
        />
      )}
      <div className="shell-viewport-overlay">
        <span className="shell-viewport-cycle">
          Cycle {displayCycle} · {totalGovernedDecisions.toLocaleString()} decisions
        </span>
      </div>
      <SimulationWorkerProvider tick={tick}>
        <WorldScene tick={tick} />
      </SimulationWorkerProvider>
    </div>
  )
}
