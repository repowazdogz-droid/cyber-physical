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
      return 'Patrol move to waypoint'
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
      return 'Approach agent'
    case 'ADVERSARIAL_INTERFERENCE':
      return 'Interference'
    default:
      return kind
  }
}

function bundleReasonToShortLabel(reason: string): string {
  const r = reason.toUpperCase()
  if (r.includes('NO_FLY') || r.includes('NO-FLY')) return 'No-fly zone'
  if (r.includes('MIN_SAFE_DISTANCE') || r.includes('MINIMUM SAFE')) return 'Min distance violated'
  if (r.includes('MIN_DISTANCE_VIOLATION')) return 'Min distance violated'
  if (r.includes('HOSTILE_ACTION')) return 'Hostile action blocked'
  if (r.includes('BATTERY')) return 'Battery reserve'
  if (r.includes('COORDINATION') || r.includes('COMPROMISED')) return 'Compromised isolation'
  return reason || 'Policy violation'
}

export const RightPanel: FC = () => {
  const selectedAgentId = useSimulationUiStore((s) => s.selectedAgentId)
  const agentsById = useSimulationUiStore((s) => s.agentsById)
  const selectAgent = useSimulationUiStore((s) => s.selectAgent)
  const { tick } = useSimulationClockContext()
  const tickRef = useRef(tick)
  const agentsByIdRef = useRef(agentsById)
  tickRef.current = tick
  agentsByIdRef.current = agentsById

  const [frozenAgent, setFrozenAgent] = useState<AgentRenderState | null>(null)
  const [snapshotTick, setSnapshotTick] = useState(0)
  const [decisionOpen, setDecisionOpen] = useState(true)
  const [proofOpen, setProofOpen] = useState(false)
  const openProofRecordForAgentId = useSimulationUiStore((s) => s.openProofRecordForAgentId)
  const setOpenProofRecordForAgentId = useSimulationUiStore((s) => s.setOpenProofRecordForAgentId)

  useEffect(() => {
    const byId = agentsByIdRef.current
    if (selectedAgentId && byId[selectedAgentId]) {
      setFrozenAgent(JSON.parse(JSON.stringify(byId[selectedAgentId])) as AgentRenderState)
      setSnapshotTick(tickRef.current)
    } else {
      setFrozenAgent(null)
    }
  }, [selectedAgentId])

  useEffect(() => {
    if (openProofRecordForAgentId && selectedAgentId === openProofRecordForAgentId) {
      setProofOpen(true)
      setOpenProofRecordForAgentId(null)
    }
  }, [openProofRecordForAgentId, selectedAgentId, setOpenProofRecordForAgentId])

  const refreshSnapshot = () => {
    if (selectedAgentId && agentsById[selectedAgentId]) {
      setFrozenAgent(JSON.parse(JSON.stringify(agentsById[selectedAgentId])) as AgentRenderState)
      setSnapshotTick(tick)
    }
  }

  const agent = frozenAgent
  const agentChainOk = useMemo(
    () => (agent?.recentProofBundles ? verifyProofChain(agent.recentProofBundles).ok : true),
    [agent],
  )
  const lastBundleBlocked =
    agent?.recentProofBundles?.length &&
    !agent.recentProofBundles[agent.recentProofBundles.length - 1].allowed

  if (!selectedAgentId || !agent) return null

  const cyclesAgo = Math.max(0, tick - snapshotTick)
  const stalenessText =
    cyclesAgo <= 5
      ? 'Live'
      : cyclesAgo <= 20
        ? `Snapshot — ${cyclesAgo} cycles ago`
        : `Snapshot — ${cyclesAgo} cycles ago — click Refresh to update`
  const stalenessClass =
    cyclesAgo <= 5 ? 'shell-staleness--live' : cyclesAgo <= 20 ? 'shell-staleness--amber' : 'shell-staleness--grey'

  return (
    <div className="shell-right-panel">
      <button
        type="button"
        className="shell-right-panel-close"
        onClick={() => selectAgent(null)}
        aria-label="Close panel"
      >
        &#x2715;
      </button>
      <div className="shell-right-panel-inner">
        <section className="shell-right-section">
          <h3 className="shell-right-section-title">IDENTITY</h3>
          <div className="shell-right-identity">
            <div className="shell-right-identity-row">
              <span className="shell-right-label">Agent ID</span>
              <span className="shell-right-value">
                {agent.id}
                <span className={`shell-staleness ${stalenessClass}`}>{stalenessText}</span>
              </span>
            </div>
            <div className="shell-right-identity-row">
              <span className="shell-right-label">Role</span>
              <span className="shell-right-value">{roleLabel(agent.type)}</span>
            </div>
            <div className="shell-right-identity-row">
              <span className="shell-right-label">Status</span>
              <span className="shell-right-value">{statusLabel(agent.status)}</span>
            </div>
            <div className="shell-right-identity-row">
              <span className="shell-right-label">Battery level</span>
              <span className="shell-right-value">{Math.round(agent.batteryPercent)}%</span>
            </div>
            <button type="button" className="shell-refresh-btn" onClick={refreshSnapshot}>
              Refresh snapshot
            </button>
          </div>
        </section>

        <section className="shell-right-section">
          <button
            type="button"
            className="shell-right-section-head"
            onClick={() => setDecisionOpen((o) => !o)}
          >
            <span>LATEST DECISION</span>
            <span className="shell-chevron">{decisionOpen ? '\u25BC' : '\u25B6'}</span>
          </button>
          {decisionOpen && (
            <div className="shell-right-section-body">
              <div className="shell-decision-rows">
                <div className={`shell-decision-row ${agent.decisionState.stage === 'OBSERVE' ? 'shell-decision-row--current' : ''}`}>
                  <span className="shell-decision-name">OBSERVE</span>
                  <span className="shell-decision-text">{agent.decisionState.observe}</span>
                </div>
                <div className={`shell-decision-row ${agent.decisionState.stage === 'DERIVE' ? 'shell-decision-row--current' : ''}`}>
                  <span className="shell-decision-name">DERIVE</span>
                  <span className="shell-decision-text">{agent.decisionState.derive}</span>
                </div>
                <div className={`shell-decision-row ${agent.decisionState.stage === 'ASSUME' ? 'shell-decision-row--current' : ''}`}>
                  <span className="shell-decision-name">ASSUME</span>
                  <span className="shell-decision-text">{agent.decisionState.assume}</span>
                </div>
                <div className={`shell-decision-row ${lastBundleBlocked ? 'shell-decision-row--blocked' : ''} ${agent.decisionState.stage === 'DECIDE' ? 'shell-decision-row--current' : ''}`}>
                  <span className="shell-decision-name">DECIDE</span>
                  <span className="shell-decision-text">{agent.decisionState.decide}</span>
                  <span className={lastBundleBlocked ? 'shell-decision-badge shell-decision-badge--blocked' : 'shell-decision-badge shell-decision-badge--approved'}>
                    {lastBundleBlocked ? '\u2717 Blocked by governance' : '\u2713 Approved by governance'}
                  </span>
                </div>
                <div className={`shell-decision-row ${lastBundleBlocked ? 'shell-decision-row--blocked' : ''} ${agent.decisionState.stage === 'ACT' ? 'shell-decision-row--current' : ''}`}>
                  <span className="shell-decision-name">ACT</span>
                  <span className="shell-decision-text">{agent.decisionState.act}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="shell-right-section">
          <button
            type="button"
            className="shell-right-section-head"
            onClick={() => setProofOpen((o) => !o)}
          >
            <span>PROOF RECORD</span>
            <span className="shell-chevron">{proofOpen ? '\u25BC' : '\u25B6'}</span>
          </button>
          {proofOpen && (
            <div className="shell-right-section-body">
              {!agentChainOk && (
                <div className="shell-proof-warning" role="alert">
                  &#x26A0; Chain integrity issue detected.
                </div>
              )}
              {agentChainOk && agent.recentProofBundles.length > 0 && (
                <p className="shell-proof-ok">&#x2713; All {agent.recentProofBundles.length} proof bundles verified — chain intact</p>
              )}
              {agent.recentProofBundles.length > 0 && (() => {
                const total = agent.recentProofBundles.length
                const approved = agent.recentProofBundles.filter((b) => b.allowed).length
                const blocked = total - approved
                const lastBlocked = [...agent.recentProofBundles].reverse().find((b) => !b.allowed)
                const summaryBlock = lastBlocked
                  ? ` The most recent block was because: ${bundleReasonToShortLabel(lastBlocked.reason)}.`
                  : ''
                const summary = `This agent has made ${total} decisions. ${approved} were approved. ${blocked} were blocked.${summaryBlock}`
                return <p className="shell-proof-summary">{summary}</p>
              })()}
              <div className="shell-proof-receipt-list">
                {agent.recentProofBundles
                  .slice(-10)
                  .reverse()
                  .map((bundle) => {
                    const actionShort = actionKindToShortLabel(bundle.proposedAction.kind)
                    const hashTrunc = `${bundle.hash.slice(0, 12)}…`
                    if (bundle.allowed) {
                      return (
                        <div key={bundle.hash} className="shell-receipt-card shell-receipt-card--approved">
                          <div className="shell-receipt-header">
                            <span className="shell-receipt-status">&#x2713; APPROVED</span>
                            <span className="shell-receipt-cycle">Cycle {bundle.tick}</span>
                          </div>
                          <div className="shell-receipt-action">{actionShort}</div>
                          <div className="shell-receipt-detail">All policies satisfied</div>
                          <div className="shell-receipt-hash">{hashTrunc}</div>
                        </div>
                      )
                    }
                    return (
                      <div key={bundle.hash} className="shell-receipt-card shell-receipt-card--blocked">
                        <div className="shell-receipt-header">
                          <span className="shell-receipt-status">&#x2717; BLOCKED</span>
                          <span className="shell-receipt-cycle">Cycle {bundle.tick}</span>
                        </div>
                        <div className="shell-receipt-action">Attempted: {actionShort.toLowerCase()}</div>
                        <div className="shell-receipt-detail">Reason: {bundleReasonToShortLabel(bundle.reason)}</div>
                        <div className="shell-receipt-hash">{hashTrunc}</div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
