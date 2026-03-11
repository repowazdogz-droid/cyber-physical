import type { ChangeEvent, FC } from 'react'
import { useSimulationUiStore } from '../store/simulationStore'
import type { ScenarioId } from '../types/simulation'
import type { SimulationSpeed } from '../store/simulationStore'

const SPEED_OPTIONS: { value: SimulationSpeed; label: string }[] = [
  { value: 0.5, label: '0.5×' },
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
]

export const OperatorControlPanel: FC = () => {
  const currentScenarioId = useSimulationUiStore((s) => s.currentScenarioId)
  const setScenario = useSimulationUiStore((s) => s.setScenario)
  const simulationSpeed = useSimulationUiStore((s) => s.simulationSpeed)
  const setSimulationSpeed = useSimulationUiStore((s) => s.setSimulationSpeed)
  const policy = useSimulationUiStore((s) => s.policy)
  const togglePolicy = useSimulationUiStore((s) => s.togglePolicy)
  const runId = useSimulationUiStore((s) => s.runId)
  const governanceStats = useSimulationUiStore((s) => s.governanceStats)
  const resetDemo = useSimulationUiStore((s) => s.resetDemo)
  const workerUnresponsive = useSimulationUiStore((s) => s.workerUnresponsive)

  const handleScenarioChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setScenario(e.target.value as ScenarioId)
  }

  const handleSpeedChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSimulationSpeed(Number(e.target.value) as SimulationSpeed)
  }

  return (
    <div className="panel-body operator-control-body">
      {workerUnresponsive && (
        <div className="governance-warning governance-warning--pulse" style={{ marginBottom: '0.75rem' }}>
          Worker did not respond. Demo may be locked. Use &quot;Reset demo (same seed)&quot; to recover.
        </div>
      )}
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Controls</h2>
          <p className="panel-subtitle">
            Scenario, simulation speed, and policy rules. Changes are forwarded to the runtime; simulation state is not modified directly from the UI.
          </p>
        </div>
      </div>

      <div className="governance-grid">
        <section className="governance-section">
          <h3 className="section-title">Run &amp; scenario</h3>
          <div className="metrics-row">
            <div className="metric">
              <span className="metric-label">Run ID</span>
              <span className="metric-value monospace-value" style={{ fontSize: '0.7rem' }}>
                {runId ?? '—'}
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">Scenario</span>
              <span className="metric-value">{currentScenarioId}</span>
            </div>
          </div>
          <select
            className="scenario-select"
            value={currentScenarioId}
            onChange={handleScenarioChange}
            aria-label="Select scenario"
          >
            <option value="routine_patrol">Routine Patrol</option>
            <option value="threat_detection">Threat Detection</option>
            <option value="governance_failure">Governance Failure Demo</option>
            <option value="adversarial_coordination_attack">Adversarial Coordination Attack</option>
          </select>
          <button type="button" className="ghost-button" style={{ marginTop: '0.5rem' }} onClick={resetDemo}>
            Reset demo (same seed)
          </button>
        </section>

        <section className="governance-section">
          <h3 className="section-title">Simulation speed</h3>
          <select
            className="scenario-select"
            value={simulationSpeed}
            onChange={handleSpeedChange}
            aria-label="Simulation speed"
          >
            {SPEED_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </section>

        <section className="governance-section">
          <h3 className="section-title">Governance metrics</h3>
          <div className="metrics-row">
            <div className="metric">
              <span className="metric-label">Total decisions</span>
              <span className="metric-value">{governanceStats.total}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Blocked</span>
              <span className="metric-value">{governanceStats.blocked}</span>
            </div>
            {governanceStats.isolatedCount !== undefined && governanceStats.isolatedCount > 0 && (
              <div className="metric">
                <span className="metric-label">Isolated</span>
                <span className="metric-value">{governanceStats.isolatedCount}</span>
              </div>
            )}
          </div>
        </section>

        <section className="governance-section">
          <h3 className="section-title">Active policy rules</h3>
          <div className="policy-toggle-column">
            <label className="policy-toggle">
              <input
                type="checkbox"
                checked={policy.minSafeDistance}
                onChange={() => togglePolicy('minSafeDistance')}
              />
              <div>
                <div className="policy-toggle-title">Minimum safe distance</div>
              </div>
            </label>
            <label className="policy-toggle">
              <input
                type="checkbox"
                checked={policy.noFlyZone}
                onChange={() => togglePolicy('noFlyZone')}
              />
              <div>
                <div className="policy-toggle-title">No-fly zone enforcement</div>
              </div>
            </label>
            <label className="policy-toggle">
              <input
                type="checkbox"
                checked={policy.escalationProtocol}
                onChange={() => togglePolicy('escalationProtocol')}
              />
              <div>
                <div className="policy-toggle-title">Escalation protocol</div>
              </div>
            </label>
            <label className="policy-toggle">
              <input
                type="checkbox"
                checked={policy.batteryReserve}
                onChange={() => togglePolicy('batteryReserve')}
              />
              <div>
                <div className="policy-toggle-title">Battery reserve threshold</div>
              </div>
            </label>
          </div>
        </section>
      </div>
    </div>
  )
}
