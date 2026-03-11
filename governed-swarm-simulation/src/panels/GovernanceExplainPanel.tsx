import type { FC } from 'react'
import { useSimulationUiStore } from '../store/simulationStore'

export const GovernanceExplainPanel: FC = () => {
  const selectedProofBundle = useSimulationUiStore((s) => s.selectedProofBundle)
  const setSelectedProofBundle = useSimulationUiStore((s) => s.setSelectedProofBundle)

  if (!selectedProofBundle) return null

  const bundle = selectedProofBundle

  const copyJson = () => {
    try {
      navigator.clipboard.writeText(JSON.stringify(bundle, null, 2))
    } catch {
      // ignore
    }
  }

  const copyHash = () => {
    try {
      navigator.clipboard.writeText(bundle.hash)
    } catch {
      // ignore
    }
  }

  return (
    <div
      className="governance-explain-overlay"
      role="dialog"
      aria-label="Governance decision explanation"
    >
      <div className="governance-explain-panel">
        <div className="panel-header">
          <h2 className="panel-title">Governance decision</h2>
          <button
            type="button"
            className="ghost-button"
            onClick={() => setSelectedProofBundle(null)}
            aria-label="Close"
          >
            Close
          </button>
        </div>
        <div className="governance-explain-grid">
          <div className="decision-line">
            <span className="decision-label">OBSERVE</span>
            <span className="decision-text">{bundle.observe}</span>
          </div>
          <div className="decision-line">
            <span className="decision-label">DERIVE</span>
            <span className="decision-text">{bundle.derive}</span>
          </div>
          <div className="decision-line">
            <span className="decision-label">ASSUME</span>
            <span className="decision-text">{bundle.assume}</span>
          </div>
          <div className="decision-line">
            <span className="decision-label">DECIDE</span>
            <span className="decision-text">{bundle.decide}</span>
          </div>
          <div className="decision-line">
            <span className="decision-label">ACT</span>
            <span className="decision-text">{bundle.act}</span>
          </div>
          <div className="decision-line">
            <span className="decision-label">Action</span>
            <span className="decision-text">{bundle.proposedAction.kind}</span>
          </div>
          <div className="decision-line">
            <span className="decision-label">Governance result</span>
            <span className="decision-text">{bundle.allowed ? 'Allowed' : 'Blocked'}</span>
          </div>
          <div className="decision-line">
            <span className="decision-label">Policy rules triggered</span>
            <span className="decision-text">
              {bundle.constraintsTriggered.length ? bundle.constraintsTriggered.join(', ') : '—'}
            </span>
          </div>
          <div className="decision-line">
            <span className="decision-label">Reason</span>
            <span className="decision-text">{bundle.reason ?? '—'}</span>
          </div>
          <div className="decision-line">
            <span className="decision-label">Runtime hash</span>
            <span className="metric-value monospace-value" style={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
              {bundle.hash}
            </span>
          </div>
          {bundle.shadowVerification && (
            <>
              <div className="decision-line">
                <span className="decision-label">Runtime decision</span>
                <span className="decision-text">{bundle.allowed ? 'Allowed' : 'Blocked'}</span>
              </div>
              <div className="decision-line">
                <span className="decision-label">Recomputed decision</span>
                <span className="decision-text">
                  {bundle.shadowVerification.allowedRecomputed ? 'Allowed' : 'Blocked'}
                  {!bundle.shadowVerification.decisionMatches && (
                    <span className="metric-value--warning"> (mismatch)</span>
                  )}
                </span>
              </div>
              <div className="decision-line">
                <span className="decision-label">Shadow: recomputed hash</span>
                <span className="metric-value monospace-value" style={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
                  {bundle.shadowVerification.recomputedHash}
                </span>
              </div>
              <div className="decision-line">
                <span className="decision-label">Shadow integrity</span>
                <span
                  className={
                    bundle.shadowVerification.integrityOk
                      ? 'verification-value verification-value--pass'
                      : 'verification-value verification-value--fail'
                  }
                >
                  {bundle.shadowVerification.integrityOk ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </>
          )}
        </div>
        <div className="governance-explain-actions">
          <button type="button" className="ghost-button" onClick={copyJson}>
            Copy bundle JSON
          </button>
          <button type="button" className="ghost-button" onClick={copyHash}>
            Copy hash
          </button>
          {bundle.shadowVerification?.recomputedHash && (
            <button
              type="button"
              className="ghost-button"
              onClick={() => {
                try {
                  navigator.clipboard.writeText(bundle.shadowVerification!.recomputedHash)
                } catch {
                  // ignore
                }
              }}
            >
              Copy recomputed hash
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
