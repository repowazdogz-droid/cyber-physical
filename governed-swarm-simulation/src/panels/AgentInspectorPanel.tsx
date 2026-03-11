import type { FC } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSimulationUiStore } from '../store/simulationStore'
import { verifyProofChain } from '../sim/governance/governance'
import type { ProposedAction } from '../types/simulation'
import type { AgentRenderState } from '../types/simulation'
import { useSimulationClockContext } from '../sim/clock/SimulationClockContext'

function roleLabel(type: string): string {
  switch (type) {
    case 'PATROL':
      return 'Patrol drone'
    case 'SURVEILLANCE':
      return 'Surveillance drone'
    case 'ESCORT':
      return 'Escort drone'
    case 'HOSTILE':
      return 'Unknown/hostile agent'
    default:
      return type
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'ON_MISSION':
      return 'On mission'
    case 'LOW_BATTERY':
      return 'Low battery — returning to base'
    case 'CHARGING':
      return 'Recharging'
    case 'ISOLATED':
      return 'ISOLATED — governance lockdown'
    case 'COMPROMISED':
      return 'COMPROMISED — flagged by system'
    default:
      return status
  }
}

function actionKindToShortLabel(kind: ProposedAction['kind']): string {
  switch (kind) {
    case 'MOVE_TO_WAYPOINT':
      return 'Patrol move'
    case 'MAINTAIN_STATION':
      return 'Hold station'
    case 'MAINTAIN_ESCORT':
      return 'Escort'
    case 'RETURN_TO_BASE':
      return 'Return to base'
    case 'INTERCEPT_INTRUDER':
      return 'Intercept'
    case 'INVESTIGATE_CONTACT':
      return 'Investigate'
    case 'WARN_INTRUDER':
      return 'Warn'
    case 'HOLD_POSITION':
      return 'Hold position'
    case 'ADVERSARIAL_APPROACH':
      return 'Approach'
    case 'ADVERSARIAL_INTERFERENCE':
      return 'Interference'
    default:
      return kind
  }
}

export const AgentInspectorPanel: FC = () => {
  const selectedAgentId = useSimulationUiStore((s) => s.selectedAgentId)
  const agentsById = useSimulationUiStore((s) => s.agentsById)
  const setSelectedProofBundle = useSimulationUiStore((s) => s.setSelectedProofBundle)
  const isReplayMode = useSimulationUiStore((s) => s.isReplayMode)
  const replayTick = useSimulationUiStore((s) => s.replayTick)
  const getSnapshotAt = useSimulationUiStore((s) => s.getSnapshotAt)
  const { tick } = useSimulationClockContext()
  const tickRef = useRef(tick)
  const agentsByIdRef = useRef(agentsById)
  tickRef.current = tick
  agentsByIdRef.current = agentsById

  const [frozenAgent, setFrozenAgent] = useState<AgentRenderState | null>(null)
  const [snapshotTick, setSnapshotTick] = useState(0)

  useEffect(() => {
    const byId = agentsByIdRef.current
    if (selectedAgentId && byId[selectedAgentId]) {
      setFrozenAgent(JSON.parse(JSON.stringify(byId[selectedAgentId])) as AgentRenderState)
      setSnapshotTick(tickRef.current)
    } else {
      setFrozenAgent(null)
    }
  }, [selectedAgentId])

  const refreshSnapshot = () => {
    if (selectedAgentId && agentsById[selectedAgentId]) {
      setFrozenAgent(JSON.parse(JSON.stringify(agentsById[selectedAgentId])) as AgentRenderState)
      setSnapshotTick(tick)
    }
  }

  const agent = frozenAgent
  const replaySnapshot = useMemo(
    () => isReplayMode && selectedAgentId ? getSnapshotAt(replayTick) : undefined,
    [isReplayMode, selectedAgentId, replayTick, getSnapshotAt]
  )
  const replayAgentState = replaySnapshot?.agentStates.find((a) => a.id === selectedAgentId)

  const agentShadowOk = useMemo(() => {
    if (!agent?.recentProofBundles?.length) return true
    return agent.recentProofBundles.every(
      (b) => !b.shadowVerification || b.shadowVerification.integrityOk,
    )
  }, [agent])
  const agentChainOk = useMemo(
    () => (agent?.recentProofBundles ? verifyProofChain(agent.recentProofBundles).ok : true),
    [agent],
  )
  const lastBundleBlocked =
    agent?.recentProofBundles?.length &&
    !agent.recentProofBundles[agent.recentProofBundles.length - 1].allowed

  return (
    <div className="panel-body">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Agent Reasoning</h2>
          <p className="panel-subtitle">
            Every action this agent takes must be approved by the governance system before it executes. Here is its latest decision.
          </p>
        </div>
        {selectedAgentId && agent && (
          <button
            type="button"
            className="ghost-button ghost-button--small"
            onClick={refreshSnapshot}
          >
            Refresh snapshot
          </button>
        )}
      </div>

      {!selectedAgentId || !agent ? (
        <div className="placeholder-section">
          <p className="placeholder-copy">
            Click any coloured dot in the simulation to see its live decision chain: what it observed, what it assumed, what it decided, and whether governance allowed or blocked the action.
          </p>
        </div>
      ) : (
        <div className="inspector-grid">
          {replayAgentState != null && (
            <section className="inspector-section inspector-replay-section">
              <h3 className="section-title">Replay at tick {replayTick}</h3>
              <p className="section-subtitle">Decision and governance result from stored snapshot.</p>
              <div className="decision-text-block">
                <div className="decision-line">
                  <span className="decision-label">Decision text</span>
                  <span className="decision-text">{replayAgentState.decisionText}</span>
                </div>
                <div className="inspector-row">
                  <div>
                    <div className="metric-label">Action</div>
                    <div className="metric-value">{replayAgentState.action}</div>
                  </div>
                  <div>
                    <div className="metric-label">Governance</div>
                    <div
                      className={
                        replayAgentState.governanceResult === 'BLOCKED'
                          ? 'metric-value metric-value--blocked'
                          : 'metric-value'
                      }
                    >
                      {replayAgentState.governanceResult}
                    </div>
                  </div>
                </div>
                {replayAgentState.blockReason != null && (
                  <div className="inspector-row">
                    <div>
                      <div className="metric-label">Block reason</div>
                      <div className="metric-value metric-value--warning">{replayAgentState.blockReason}</div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
          <section className="inspector-section">
            <h3 className="section-title">Identity &amp; Status</h3>
            <p className="section-subtitle">
              Role, mission objective, and current high-level status for the selected agent.
            </p>
            <div className="inspector-row">
              <div>
                <div className="metric-label">Agent ID</div>
                <div className="metric-value inspector-agent-id-row">
                  {agent.id}
                  {(() => {
                    const cyclesAgo = Math.max(0, tick - snapshotTick)
                    if (cyclesAgo <= 5) {
                      return <span className="inspector-staleness inspector-staleness--live">Live</span>
                    }
                    if (cyclesAgo <= 20) {
                      return (
                        <span className="inspector-staleness inspector-staleness--amber">
                          Snapshot — {cyclesAgo} cycles ago
                        </span>
                      )
                    }
                    return (
                      <span className="inspector-staleness inspector-staleness--grey">
                        Snapshot — {cyclesAgo} cycles ago — click Refresh to update
                      </span>
                    )
                  })()}
                </div>
              </div>
              <div>
                <div className="metric-label">Role</div>
                <div className="metric-value">{roleLabel(agent.type)}</div>
              </div>
            </div>
            <div className="inspector-row">
              <div>
                <div className="metric-label">Current status</div>
                <div className="metric-value">{statusLabel(agent.status)}</div>
              </div>
              <div>
                <div className="metric-label">Battery level</div>
                <div className="metric-value">{Math.round(agent.batteryPercent)}%</div>
              </div>
            </div>
            {agent.status === 'ISOLATED' && (
              <div className="inspector-row inspector-isolation-reason">
                <div>
                  <div className="metric-label">Isolation reason</div>
                  <div className="metric-value metric-value--warning">
                    coordination integrity violation
                  </div>
                </div>
              </div>
            )}
            <div className="inspector-row">
              <div>
                <div className="metric-label">Speed</div>
                <div className="metric-value">{agent.speed.toFixed(1)} m/s</div>
              </div>
              <div>
                <div className="metric-label">Sensor range</div>
                <div className="metric-value">{Math.round(agent.sensorRangeMeters)} m</div>
              </div>
            </div>
            <p className="placeholder-copy" style={{ marginTop: '0.5rem' }}>
              Mission: {agent.missionObjective}
            </p>

            <div className="verification-indicators verification-indicators--compact">
              <div className="verification-indicators-row">
                <div className="verification-indicator">
                  <span className="verification-label">Live policy gate (decisions checked in real time)</span>
                  <span className="verification-pill verification-pill--pass">&#x2713; PASS</span>
                </div>
                <div className="verification-indicator">
                  <span className="verification-label">Independent recheck (every decision recomputed separately)</span>
                  <span
                    className={
                      agentShadowOk
                        ? 'verification-pill verification-pill--pass'
                        : 'verification-pill verification-pill--fail'
                    }
                  >
                    {agentShadowOk ? '\u2713 PASS' : '\u2717 FAIL'}
                  </span>
                </div>
                <div className="verification-indicator">
                  <span className="verification-label">Proof chain (tamper-evident audit trail)</span>
                  <span
                    className={
                      agentChainOk
                        ? 'verification-pill verification-pill--pass'
                        : 'verification-pill verification-pill--fail'
                    }
                  >
                    {agentChainOk ? '\u2713 PASS' : '\u2717 FAIL'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="inspector-section">
            <h3 className="section-title">What did this agent just decide?</h3>
            <p className="section-subtitle">
              The agent works through 5 steps before every action. The governance gate checks the final decision before anything happens.
            </p>
            <div className="inspector-row">
              <div>
                <div className="metric-label">Stage</div>
                <div className="metric-value">{agent.decisionState.stage}</div>
              </div>
              <div>
                <div className="metric-label">Last action</div>
                <div className="metric-value">{agent.decisionState.lastActionType}</div>
              </div>
            </div>
            <div className="inspector-row">
              <div>
                <div className="metric-label">Last decision tick</div>
                <div className="metric-value">{agent.decisionState.lastDecisionTick}</div>
              </div>
            </div>
            <div className="decision-chain">
              <div
                className={`decision-chain-step ${agent.decisionState.stage === 'OBSERVE' ? 'decision-chain-step--current' : ''}`}
              >
                <span className="decision-chain-step-label">OBSERVE — what does it see?</span>
                <span className="decision-chain-step-content">{agent.decisionState.observe}</span>
              </div>
              <div
                className={`decision-chain-step ${agent.decisionState.stage === 'DERIVE' ? 'decision-chain-step--current' : ''}`}
              >
                <span className="decision-chain-step-label">DERIVE — what does that mean?</span>
                <span className="decision-chain-step-content">{agent.decisionState.derive}</span>
              </div>
              <div
                className={`decision-chain-step ${agent.decisionState.stage === 'ASSUME' ? 'decision-chain-step--current' : ''}`}
              >
                <span className="decision-chain-step-label">ASSUME — what is it taking for granted?</span>
                <span className="decision-chain-step-content">{agent.decisionState.assume}</span>
              </div>
              <div
                className={`decision-chain-step ${lastBundleBlocked ? 'decision-chain-step--blocked' : ''} ${agent.decisionState.stage === 'DECIDE' ? 'decision-chain-step--current' : ''}`}
              >
                <span className="decision-chain-step-label">DECIDE — what does it want to do?</span>
                <span className="decision-chain-step-content">{agent.decisionState.decide}</span>
                <span
                  className={lastBundleBlocked ? 'governance-badge governance-badge--blocked' : 'governance-badge governance-badge--approved'}
                >
                  {lastBundleBlocked ? '\u2717 Blocked by governance' : '\u2713 Approved by governance'}
                </span>
              </div>
              <div
                className={`decision-chain-step ${lastBundleBlocked ? 'decision-chain-step--blocked' : ''} ${agent.decisionState.stage === 'ACT' ? 'decision-chain-step--current' : ''}`}
              >
                <span className="decision-chain-step-label">ACT — what actually happened?</span>
                <span className="decision-chain-step-content">{agent.decisionState.act}</span>
              </div>
            </div>
          </section>

          <section className="inspector-section">
            <h3 className="section-title">Decision history — tamper-evident record</h3>
            <p className="section-subtitle">
              Every decision is cryptographically recorded. If anything is altered, the chain breaks and the system flags it immediately.
            </p>
            {!agentChainOk && (
              <div className="inspector-chain-warning" role="alert">
                &#x26A0; Chain integrity issue detected. One or more proof bundles in this window may have been altered or corrupted.
              </div>
            )}
            {agentChainOk && agent.recentProofBundles.length > 0 && (
              <p className="inspector-chain-ok">
                &#x2713; All {agent.recentProofBundles.length} proof bundles verified — chain intact
              </p>
            )}
            <div className="inspector-row">
              <div>
                <div className="metric-label">Latest proof hash</div>
                <div className="metric-value hash-string">
                  {agent.chainHeadHash ? agent.chainHeadHash.slice(0, 12) + '…' : '—'}
                </div>
              </div>
              <div>
                <div className="metric-label">Last {agent.recentProofBundles.length} decisions recorded</div>
                <div className="metric-value">{agent.recentProofBundles.length}</div>
              </div>
            </div>
            {agent.recentProofBundles.length > 0 && (
              <div className="governance-proof-list">
                {agent.recentProofBundles
                  .slice(-5)
                  .reverse()
                  .map((bundle) => {
                    const actionShort = actionKindToShortLabel(bundle.proposedAction.kind)
                    const line = bundle.allowed
                      ? `Cycle ${bundle.tick} \u00B7 ${actionShort} \u00B7 \u2713 Approved`
                      : `Cycle ${bundle.tick} \u00B7 ${actionShort} \u00B7 \u2717 Blocked — ${bundle.reason || 'Governance blocked'}`
                    return (
                      <button
                        key={bundle.hash}
                        type="button"
                        className="governance-proof-row governance-proof-row--clickable"
                        onClick={() => setSelectedProofBundle(bundle)}
                      >
                        <div className="governance-proof-main">
                          <span className="governance-proof-tick">{bundle.tick}</span>
                          <span className="governance-proof-action">{line}</span>
                        </div>
                      </button>
                    )
                  })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

