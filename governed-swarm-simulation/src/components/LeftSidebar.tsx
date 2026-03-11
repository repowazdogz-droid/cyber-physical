import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useSimulationUiStore } from '../store/simulationStore'
import { useSimulationClockContext } from '../sim/clock/SimulationClockContext'
import { useSuspicionScores } from '../context/SuspicionContext'

function roleColor(type: string): string {
  switch (type) {
    case 'PATROL':
      return '#4ade80'
    case 'SURVEILLANCE':
      return '#60a5fa'
    case 'ESCORT':
      return '#a78bfa'
    case 'HOSTILE':
      return '#f87171'
    default:
      return '#6b7280'
  }
}

function statusBadge(status: string): string {
  switch (status) {
    case 'ON_MISSION':
      return 'On mission'
    case 'LOW_BATTERY':
      return 'Low battery'
    case 'CHARGING':
      return 'Recharging'
    case 'ISOLATED':
      return 'ISOLATED'
    case 'COMPROMISED':
      return 'COMPROMISED'
    default:
      return status
  }
}

export const LeftSidebar: FC<{ collapsed: boolean; onToggle: () => void }> = ({ collapsed, onToggle }) => {
  const { tick } = useSimulationClockContext()
  const governanceStats = useSimulationUiStore((s) => s.governanceStats)
  const [throttledStats, setThrottledStats] = useState(governanceStats)
  const [lastThrottleTick, setLastThrottleTick] = useState(0)
  const integrityOk = useSimulationUiStore((s) => s.integrityOk)
  const independentVerificationResult = useSimulationUiStore((s) => s.independentVerificationResult)
  const shadowFailed = useSimulationUiStore((s) => s.governanceStats.shadowVerification?.failed ?? 0)
  const policy = useSimulationUiStore((s) => s.policy)
  const togglePolicy = useSimulationUiStore((s) => s.togglePolicy)
  const agentsById = useSimulationUiStore((s) => s.agentsById)
  const currentScenarioId = useSimulationUiStore((s) => s.currentScenarioId)
  const selectedAgentId = useSimulationUiStore((s) => s.selectedAgentId)
  const selectAgent = useSimulationUiStore((s) => s.selectAgent)
  const openVerification = useSimulationUiStore((s) => s.openVerification)
  const suspicionScores = useSuspicionScores()
  const showSuspicion = currentScenarioId === 'adversarial_coordination_attack'

  useEffect(() => {
    const bucket = Math.floor(tick / 10)
    const lastBucket = Math.floor(lastThrottleTick / 10)
    if (bucket > lastBucket || lastThrottleTick === 0) {
      setThrottledStats(governanceStats)
      setLastThrottleTick(tick)
    }
  }, [tick, governanceStats, lastThrottleTick])

  const [section1Open, setSection1Open] = useState(true)
  const [section2Open, setSection2Open] = useState(true)
  const [section3Open, setSection3Open] = useState(true)
  const [section4Open, setSection4Open] = useState(true)

  if (collapsed) {
    return (
      <aside className="shell-sidebar shell-sidebar--collapsed">
        <button
          type="button"
          className="shell-sidebar-toggle"
          onClick={onToggle}
          aria-label="Expand sidebar"
        >
          &#x2192;
        </button>
      </aside>
    )
  }

  const agents = Object.values(agentsById)

  return (
    <aside className="shell-sidebar">
      <button
        type="button"
        className="shell-sidebar-toggle"
        onClick={onToggle}
        aria-label="Collapse sidebar"
      >
        &#x2190;
      </button>
      <div className="shell-sidebar-content">
        <section className="shell-sidebar-section">
          <button
            type="button"
            className="shell-sidebar-section-head"
            onClick={() => setSection1Open((o) => !o)}
          >
            <span>SYSTEM STATUS</span>
            <span className="shell-chevron">{section1Open ? '\u25BC' : '\u25B6'}</span>
          </button>
          {section1Open && (
            <div className="shell-sidebar-section-body">
              <div className="shell-stat-row">
                <span>Decisions governed</span>
                <span>{throttledStats.total}</span>
              </div>
              <div className="shell-stat-row shell-stat-row--green">
                <span>Approved</span>
                <span>{throttledStats.allowed}</span>
              </div>
              <div className="shell-stat-row shell-stat-row--red">
                <span>Blocked</span>
                <span>{throttledStats.blocked}</span>
              </div>
            </div>
          )}
        </section>
        <section className="shell-sidebar-section">
          <button
            type="button"
            className="shell-sidebar-section-head"
            onClick={() => setSection2Open((o) => !o)}
          >
            <span>GOVERNANCE HEALTH</span>
            <span className="shell-chevron">{section2Open ? '\u25BC' : '\u25B6'}</span>
          </button>
          {section2Open && (
            <div className="shell-sidebar-section-body">
              <div className="shell-verification-row">
                <span>Live policy gate</span>
                <span className="shell-badge shell-badge--pass">&#x2713;</span>
              </div>
              <div className="shell-verification-row">
                <span>Shadow recheck</span>
                <span className={shadowFailed === 0 ? 'shell-badge shell-badge--pass' : 'shell-badge shell-badge--fail'}>
                  {shadowFailed === 0 ? '\u2713' : '\u2717'}
                </span>
              </div>
              <div className="shell-verification-row">
                <span>Proof chain</span>
                <span className={integrityOk ? 'shell-badge shell-badge--pass' : 'shell-badge shell-badge--fail'}>
                  {integrityOk ? '\u2713' : '\u2717'}
                </span>
              </div>
              <div className="shell-verification-row">
                <span>Full audit</span>
                <span
                  className={
                    independentVerificationResult === null
                      ? 'shell-badge shell-badge--pending'
                      : independentVerificationResult
                        ? 'shell-badge shell-badge--pass'
                        : 'shell-badge shell-badge--fail'
                  }
                >
                  {independentVerificationResult === null ? '\u2014' : independentVerificationResult ? '\u2713' : '\u2717'}
                </span>
              </div>
              <button type="button" className="shell-sidebar-link" onClick={openVerification}>
                Open Verification Panel
              </button>
            </div>
          )}
        </section>
        <section className="shell-sidebar-section">
          <button
            type="button"
            className="shell-sidebar-section-head"
            onClick={() => setSection3Open((o) => !o)}
          >
            <span>POLICY RULES</span>
            <span className="shell-chevron">{section3Open ? '\u25BC' : '\u25B6'}</span>
          </button>
          {section3Open && (
            <div className="shell-sidebar-section-body">
              <label className="shell-policy-row">
                <input type="checkbox" checked={policy.noFlyZone} onChange={() => togglePolicy('noFlyZone')} />
                <span>No-fly zones</span>
              </label>
              <label className="shell-policy-row">
                <input type="checkbox" checked={policy.minSafeDistance} onChange={() => togglePolicy('minSafeDistance')} />
                <span>Min safe distance</span>
              </label>
              <label className="shell-policy-row">
                <input type="checkbox" checked={policy.escalationProtocol} onChange={() => togglePolicy('escalationProtocol')} />
                <span>Escalation protocol</span>
              </label>
              <label className="shell-policy-row">
                <input type="checkbox" checked={policy.batteryReserve} onChange={() => togglePolicy('batteryReserve')} />
                <span>Battery reserve</span>
              </label>
            </div>
          )}
        </section>
        <section className="shell-sidebar-section">
          <button
            type="button"
            className="shell-sidebar-section-head"
            onClick={() => setSection4Open((o) => !o)}
          >
            <span>AGENTS</span>
            <span className="shell-chevron">{section4Open ? '\u25BC' : '\u25B6'}</span>
          </button>
          {section4Open && (
            <div className="shell-sidebar-section-body shell-agents-list">
              {agents.map((agent) => {
                const suspicion = showSuspicion ? (suspicionScores[agent.id] ?? 0) : 0
                const suspicionPct = Math.min(100, suspicion)
                return (
                  <button
                    key={agent.id}
                    type="button"
                    className={`shell-agent-row ${selectedAgentId === agent.id ? 'shell-agent-row--selected' : ''} ${agent.status === 'COMPROMISED' ? 'shell-agent-row--compromised' : ''}`}
                    onClick={() => selectAgent(agent.id)}
                  >
                    <span
                      className="shell-agent-dot"
                      style={{ background: roleColor(agent.type) }}
                      aria-hidden
                    />
                    <span className="shell-agent-id">{agent.id}</span>
                    <span className="shell-agent-status">{statusBadge(agent.status)}</span>
                    {showSuspicion && (
                      <span className="shell-agent-suspicion-wrap" aria-hidden>
                        <span
                          className="shell-agent-suspicion-bar"
                          style={{
                            width: `${suspicionPct}%`,
                            background: suspicionPct < 50 ? '#F59E0B' : '#FF3B30',
                          }}
                        />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </aside>
  )
}
