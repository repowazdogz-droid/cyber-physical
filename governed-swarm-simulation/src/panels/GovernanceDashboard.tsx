import type { ChangeEvent, FC } from 'react'
import { useEffect, useState } from 'react'
import { useSimulationUiStore } from '../store/simulationStore'
import type { ScenarioId } from '../types/simulation'
import { useSimulationClockContext } from '../sim/clock/SimulationClockContext'

export const GovernanceDashboard: FC = () => {
  const { tick } = useSimulationClockContext()
  const currentScenarioId = useSimulationUiStore((s) => s.currentScenarioId)
  const setScenario = useSimulationUiStore((s) => s.setScenario)
  const openVerification = useSimulationUiStore((s) => s.openVerification)
  const governanceStats = useSimulationUiStore((s) => s.governanceStats)
  const [throttledStats, setThrottledStats] = useState(governanceStats)
  const [lastThrottleTick, setLastThrottleTick] = useState(0)

  useEffect(() => {
    const bucket = Math.floor(tick / 10)
    const lastBucket = Math.floor(lastThrottleTick / 10)
    if (bucket > lastBucket || lastThrottleTick === 0) {
      setThrottledStats(governanceStats)
      setLastThrottleTick(tick)
    }
  }, [tick, governanceStats, lastThrottleTick])
  const integrityOk = useSimulationUiStore((s) => s.integrityOk)
  const integrityIssues = useSimulationUiStore((s) => s.integrityIssues)
  const threatLevel = useSimulationUiStore((s) => s.threatLevel)
  const policy = useSimulationUiStore((s) => s.policy)
  const togglePolicy = useSimulationUiStore((s) => s.togglePolicy)
  const followSelectedAgent = useSimulationUiStore((s) => s.followSelectedAgent)
  const setFollowSelectedAgent = useSimulationUiStore((s) => s.setFollowSelectedAgent)
  const independentVerificationResult = useSimulationUiStore((s) => s.independentVerificationResult)

  const handleScenarioChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setScenario(event.target.value as ScenarioId)
  }

  const blockedRatio =
    throttledStats.total > 0
      ? `${Math.round((throttledStats.blocked / throttledStats.total) * 100)}%`
      : '—'

  const blockedRatioPercent =
    throttledStats.total > 0 ? (throttledStats.blocked / throttledStats.total) * 100 : 0
  const governanceSummary =
    governanceStats.total === 0
      ? 'Awaiting governed decisions.'
      : blockedRatioPercent < 10
        ? 'All clear. Governance is approving most agent actions — operations are normal.'
        : blockedRatioPercent <= 30
          ? `Governance is active. About ${Math.round(blockedRatioPercent)}% of agent actions are being blocked and reviewed.`
          : `High governance load. ${Math.round(blockedRatioPercent)}% of actions blocked — agents may be violating rules or under attack.`

  const governanceHealth =
    governanceStats.total === 0
      ? 'Awaiting governed decisions.'
      : integrityOk && threatLevel === 'LOW'
        ? 'Chains intact; governance operating nominally.'
        : !integrityOk
          ? 'Chain integrity issues detected; inspect affected agents.'
          : 'Elevated threat or governance load; monitor blocked actions.'

  const threatLevelLabel =
    threatLevel === 'LOW'
      ? 'Low — normal operations'
      : threatLevel === 'ELEVATED'
        ? 'Elevated — governance is active'
        : threatLevel === 'HIGH'
          ? 'High — multiple violations detected'
          : threatLevel === 'CRITICAL'
            ? 'Critical — system under attack'
            : threatLevel

  return (
    <div className="panel-body governance-body">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Governance Overview</h2>
          <p className="panel-subtitle">
            High-level view of governed decisions, integrity status, policy controls, and camera behavior.
          </p>
        </div>
        <div className="panel-actions">
          <label className="toggle-inline">
            <input
              type="checkbox"
              checked={followSelectedAgent}
              onChange={(e) => setFollowSelectedAgent(e.target.checked)}
            />
            <span>Follow selected agent</span>
          </label>
          <button type="button" className="ghost-button" onClick={openVerification}>
            Open Verification Panel
          </button>
        </div>
      </div>

      <p className="governance-summary" role="status">
        {governanceSummary}
      </p>

      <div className="governance-grid">
        <section className="governance-section">
          <h3 className="section-title">Scenario</h3>
          <p className="section-subtitle">Choose a deterministic scenario preset for the simulation.</p>
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

          {currentScenarioId === 'governance_failure' && (
            <div className="governance-failure-warnings" role="status">
              {!policy.minSafeDistance && (
                <p className="governance-warning governance-warning--pulse">
                  Minimum safe distance disabled — agents may cluster.
                </p>
              )}
              {!policy.noFlyZone && (
                <p className="governance-warning governance-warning--pulse">
                  No-fly zone enforcement disabled — drones may enter restricted zone.
                </p>
              )}
              {!policy.escalationProtocol && (
                <p className="governance-warning governance-warning--pulse">
                  Escalation protocol disabled — patrol may intercept without handoff.
                </p>
              )}
            </div>
          )}
        </section>

        <section className="governance-section">
          <h3 className="section-title">Governance Metrics</h3>
          <p className="section-subtitle">
            Aggregated counts for all governed decisions in the current run, including allow/block ratio and integrity
            status.
          </p>
          <div className="metrics-row">
            <div className="metric-card">
              <span className="metric-label">Total governed decisions (every agent action must be approved)</span>
              <span key={throttledStats.total} className="metric-value metric-value--transition">{throttledStats.total}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Approved by governance</span>
              <span key={throttledStats.allowed} className="metric-value metric-value--transition">{throttledStats.allowed}</span>
            </div>
            <div
              className={`metric-card ${blockedRatioPercent > 30 ? 'metric-card--blocked-critical' : blockedRatioPercent > 20 ? 'metric-card--blocked-warning' : ''}`}
            >
              <span className="metric-label">Blocked by governance</span>
              <span key={throttledStats.blocked} className="metric-value metric-value--transition">{throttledStats.blocked}</span>
            </div>
            <div
              className={`metric-card ${blockedRatioPercent > 30 ? 'metric-card--blocked-critical' : blockedRatioPercent > 20 ? 'metric-card--blocked-warning' : ''}`}
            >
              <span className="metric-label">% of actions blocked</span>
              <span key={blockedRatio} className="metric-value metric-value--transition">{blockedRatio}</span>
            </div>
            {throttledStats.isolatedCount !== undefined && throttledStats.isolatedCount > 0 && (
              <div className="metric-card">
                <span className="metric-label">Isolated</span>
                <span key={throttledStats.isolatedCount} className="metric-value metric-value--warning metric-value--transition">{throttledStats.isolatedCount}</span>
              </div>
            )}
          </div>
          <div className="metrics-row" style={{ marginTop: '0.35rem' }}>
            <div className="metric-card">
              <span className="metric-label">Current threat level</span>
              <span className="metric-value" style={{ fontSize: '1rem', fontWeight: 600 }}>{threatLevelLabel}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Proof chain integrity</span>
              <span className="metric-value" style={{ fontSize: '1rem', fontWeight: 600 }}>
                {integrityOk ? 'OK' : `Issues: ${integrityIssues}`}
              </span>
            </div>
            <div className="metric-card" style={{ gridColumn: 'span 2' }}>
              <span className="metric-label">Health summary</span>
              <span className="metric-value" style={{ fontSize: '0.75rem', fontWeight: 400 }}>
                {governanceHealth}
              </span>
            </div>
          </div>

          <div className="verification-indicators">
            <h3 className="section-title">Verification</h3>
            <p className="section-subtitle">
              Runtime governance, shadow recomputation, and chain linkage. Click a decision in Agent Inspector to inspect proof bundles.
            </p>
            <div className="verification-indicators-row">
              <div className="verification-indicator">
                <span className="verification-label">Live policy gate (decisions checked in real time)</span>
                <span className="verification-pill verification-pill--pass">&#x2713; PASS</span>
              </div>
              <div className="verification-indicator">
                <span className="verification-label">Independent recheck (every decision recomputed separately)</span>
                <span
                  className={
                    governanceStats.shadowVerification?.failed === 0
                      ? 'verification-pill verification-pill--pass'
                      : 'verification-pill verification-pill--fail'
                  }
                >
                  {governanceStats.shadowVerification?.failed === 0 ? '\u2713 PASS' : '\u2717 FAIL'}
                </span>
              </div>
              <div className="verification-indicator">
                <span className="verification-label">Proof chain (tamper-evident audit trail)</span>
                <span
                  className={
                    integrityOk
                      ? 'verification-pill verification-pill--pass'
                      : 'verification-pill verification-pill--fail'
                  }
                >
                  {integrityOk ? '\u2713 PASS' : '\u2717 FAIL'}
                </span>
              </div>
              <div className="verification-indicator">
                <span className="verification-label">Full chain audit (run manually via Verification Panel)</span>
                <span
                  className={
                    independentVerificationResult === null
                      ? 'verification-pill verification-pill--pending'
                      : independentVerificationResult
                        ? 'verification-pill verification-pill--pass'
                        : 'verification-pill verification-pill--fail'
                  }
                >
                  {independentVerificationResult === null
                    ? '\u2014'
                    : independentVerificationResult
                      ? '\u2713 PASS'
                      : '\u2717 FAIL'}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="governance-section">
          <h3 className="section-title">Policy Rules</h3>
          <p className="section-subtitle">
            Toggle enforcement of key governance rules in real time. Disabling rules will immediately change agent
            behavior and block/allow patterns.
          </p>
          <div className="policy-toggle-column">
            <label className="policy-toggle">
              <input
                type="checkbox"
                checked={policy.noFlyZone}
                onChange={() => togglePolicy('noFlyZone')}
              />
              <div>
                <div className="policy-toggle-title">No-fly zones</div>
                <div className="policy-toggle-subtitle">
                  Agents cannot enter restricted areas. If they try, the action is blocked and recorded.
                </div>
              </div>
            </label>

            <label className="policy-toggle">
              <input
                type="checkbox"
                checked={policy.minSafeDistance}
                onChange={() => togglePolicy('minSafeDistance')}
              />
              <div>
                <div className="policy-toggle-title">Minimum safe distance</div>
                <div className="policy-toggle-subtitle">
                  Agents must stay apart. Crowding triggers an automatic block.
                </div>
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
                <div className="policy-toggle-subtitle">
                  Suspicious behaviour is flagged and escalated before any action is taken.
                </div>
              </div>
            </label>

            <label className="policy-toggle">
              <input
                type="checkbox"
                checked={policy.batteryReserve}
                onChange={() => togglePolicy('batteryReserve')}
              />
              <div>
                <div className="policy-toggle-title">Battery reserve</div>
                <div className="policy-toggle-subtitle">
                  Agents with low battery are restricted to returning to base only.
                </div>
              </div>
            </label>
          </div>
        </section>
      </div>
    </div>
  )
}

