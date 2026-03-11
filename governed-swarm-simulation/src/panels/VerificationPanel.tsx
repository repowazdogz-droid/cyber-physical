import type { FC, FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { useSimulationUiStore } from '../store/simulationStore'
import type { Agent, ProofBundle } from '../types/simulation'
import { verifyProofChain } from '../sim/governance/governance'
import { useSimulationClockContext } from '../sim/clock/SimulationClockContext'
import {
  verifyAllAgents,
  buildRunProofsExport,
  type VerifyAllAgentsResult,
} from '../sim/verification/proofVerifier'

type HashLookupResult =
  | { found: false }
  | { found: true; agentId: string; tick: number; index: number; total: number; bundle: ProofBundle }

const getAgentChain = (agent: Agent): ProofBundle[] => {
  return [...agent.recentProofBundles].sort((a, b) => a.tick - b.tick)
}

export const VerificationPanel: FC = () => {
  const isVerificationOpen = useSimulationUiStore((s) => s.isVerificationOpen)
  const closeVerification = useSimulationUiStore((s) => s.closeVerification)
  const agentsById = useSimulationUiStore((s) => s.agentsById)
  const runId = useSimulationUiStore((s) => s.runId)
  const currentScenarioId = useSimulationUiStore((s) => s.currentScenarioId)
  const setIndependentVerificationResult = useSimulationUiStore((s) => s.setIndependentVerificationResult)

  const [independentVerifyResult, setIndependentVerifyResult] =
    useState<VerifyAllAgentsResult | null>(null)
  const { tick, running, start, stop, step } = useSimulationClockContext()

  const agentIds = useMemo(
    () => Object.keys(agentsById).sort(),
    [agentsById],
  )

  const [hashInput, setHashInput] = useState('')
  const [hashResult, setHashResult] = useState<HashLookupResult | null>(null)

  const [primaryAgentId, setPrimaryAgentId] = useState<string | undefined>(() => agentIds[0])
  const [secondaryAgentId, setSecondaryAgentId] = useState<string | undefined>(undefined)
  const [primaryIndex, setPrimaryIndex] = useState(0)
  const [secondaryIndex, setSecondaryIndex] = useState(0)

  const [copyMessage, setCopyMessage] = useState<string | null>(null)

  const primaryAgent: Agent | undefined = primaryAgentId ? agentsById[primaryAgentId] : undefined
  const secondaryAgent: Agent | undefined = secondaryAgentId
    ? agentsById[secondaryAgentId]
    : undefined

  const primaryChain = useMemo(
    () => (primaryAgent ? getAgentChain(primaryAgent) : []),
    [primaryAgent],
  )
  const secondaryChain = useMemo(
    () => (secondaryAgent ? getAgentChain(secondaryAgent) : []),
    [secondaryAgent],
  )

  const boundedPrimaryIndex =
    primaryChain.length === 0 ? 0 : Math.min(primaryIndex, primaryChain.length - 1)
  const boundedSecondaryIndex =
    secondaryChain.length === 0 ? 0 : Math.min(secondaryIndex, secondaryChain.length - 1)

  const primaryBundle = primaryChain[boundedPrimaryIndex]
  const secondaryBundle = secondaryChain[boundedSecondaryIndex]

  const compareDivergence =
    !primaryAgent || !secondaryAgent || !primaryChain.length || !secondaryChain.length
      ? null
      : (() => {
          const length = Math.min(primaryChain.length, secondaryChain.length)
          for (let i = 0; i < length; i += 1) {
            const a = primaryChain[i]
            const b = secondaryChain[i]
            if (
              a.hash !== b.hash ||
              a.allowed !== b.allowed ||
              a.tick !== b.tick ||
              a.constraintsTriggered.join(',') !== b.constraintsTriggered.join(',')
            ) {
              return { index: i, tickA: a.tick, tickB: b.tick }
            }
          }
          return null
        })()

  const handleHashSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = hashInput.trim()
    if (!trimmed) {
      setHashResult(null)
      return
    }

    let found: HashLookupResult | null = null
    for (const [agentId, agent] of Object.entries(agentsById)) {
      const chain = getAgentChain(agent)
      const idx = chain.findIndex((b) => b.hash === trimmed)
      if (idx >= 0) {
        found = {
          found: true,
          agentId,
          tick: chain[idx].tick,
          index: idx,
          total: chain.length,
          bundle: chain[idx],
        }
        break
      }
    }

    if (!found || !found.found) {
      setHashResult({ found: false })
    } else {
      setHashResult(found)
      setPrimaryAgentId(found.agentId)
      setPrimaryIndex(found.index)
    }
  }

  const handleCopyJson = async (payload: unknown) => {
    const json = JSON.stringify(payload, null, 2)
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(json)
        setCopyMessage('JSON copied to clipboard.')
      } else {
        setCopyMessage('Clipboard unavailable. Select and copy from the text view.')
      }
    } catch {
      setCopyMessage('Copy failed. Select and copy from the text view.')
    }
    window.setTimeout(() => setCopyMessage(null), 2000)
  }

  if (!isVerificationOpen) return null

  const primaryIntegrity = primaryChain.length
    ? verifyProofChain(primaryChain)
    : { ok: true }
  const secondaryIntegrity = secondaryChain.length
    ? verifyProofChain(secondaryChain)
    : { ok: true }

  return (
    <div className="verification-overlay">
      <div className="verification-modal">
        <header className="panel-header verification-header">
          <div>
            <h2 className="panel-title">Verification &amp; Replay</h2>
            <p className="panel-subtitle">
              Inspect governed decision hashes, replay agent chains over time, compare behaviors, and export proof
              bundles as raw JSON.
            </p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close verification panel"
            onClick={closeVerification}
          >
            ✕
          </button>
        </header>

        <div className="verification-grid">
          <section className="verification-column">
            <h3 className="section-title">Hash lookup</h3>
            <p className="section-subtitle">
              Paste a decision hash to locate the corresponding proof bundle and verify its position in an
              agent&apos;s chain.
            </p>
            <form onSubmit={handleHashSubmit} className="verification-form">
              <input
                className="text-input"
                type="text"
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                placeholder="Paste decision hash"
              />
              <button type="submit" className="primary-button">
                Verify hash
              </button>
            </form>
            <div className="placeholder-section" style={{ marginTop: '0.5rem' }}>
              {!hashResult && (
                <p className="placeholder-copy">
                  Hash search scans all in-memory chains (last 10 decisions per agent) and reports exact matches.
                </p>
              )}
              {hashResult && !hashResult.found && (
                <p className="placeholder-copy">Hash not found in any current agent chain.</p>
              )}
              {hashResult && hashResult.found && hashResult.bundle && (
                <div className="verification-hash-result">
                  <div className="verification-hash-row">
                    <span className="metric-label">Agent</span>
                    <span className="metric-value monospace-value">{hashResult.agentId}</span>
                  </div>
                  <div className="verification-hash-row">
                    <span className="metric-label">Tick</span>
                    <span className="metric-value">{hashResult.tick}</span>
                  </div>
                  <div className="verification-hash-row">
                    <span className="metric-label">Chain location</span>
                    <span className="metric-value">
                      {(hashResult.index ?? 0) + 1} / {hashResult.total}
                    </span>
                  </div>
                  <div className="verification-hash-row">
                    <span className="metric-label">Allowed</span>
                    <span className="metric-value">
                      {hashResult.bundle.allowed ? 'Yes' : 'Blocked'}
                    </span>
                  </div>
                  <div className="verification-hash-row">
                    <span className="metric-label">Action</span>
                    <span className="metric-value">
                      {hashResult.bundle.proposedAction.kind}
                    </span>
                  </div>
                  <div className="verification-hash-row">
                    <span className="metric-label">Reason</span>
                    <span className="metric-value">
                      {hashResult.bundle.reason || (hashResult.bundle.allowed ? 'Allowed' : 'Blocked')}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => handleCopyJson(hashResult.bundle)}
                    style={{ marginTop: '0.4rem' }}
                  >
                    Copy bundle JSON
                  </button>
                </div>
              )}
              {copyMessage && (
                <p className="placeholder-copy" style={{ marginTop: '0.4rem' }}>
                  {copyMessage}
                </p>
              )}
            </div>
          </section>

          <section className="verification-column">
            <h3 className="section-title">Chain replay &amp; comparison</h3>
            <p className="section-subtitle">
              Step through an agent&apos;s governed decisions in order or compare two agents side by side to see where
              behavior diverges.
            </p>

            {agentIds.length === 0 ? (
              <div className="placeholder-section">
                <p className="placeholder-copy">
                  No agents available yet. Let the simulation run briefly, then reopen the verification panel.
                </p>
              </div>
            ) : (
              <div className="verification-replay-grid">
                <div className="verification-replay-column">
                  <div className="verification-select-row">
                    <label className="metric-label">Primary agent</label>
                    <select
                      className="scenario-select"
                      value={primaryAgentId}
                      onChange={(e) => {
                        setPrimaryAgentId(e.target.value)
                        setPrimaryIndex(0)
                      }}
                    >
                      {agentIds.map((id) => (
                        <option key={id} value={id}>
                          {id}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="verification-integrity-row">
                    <span className="metric-label">Chain integrity</span>
                    <span className="metric-value">
                      {primaryIntegrity.ok
                        ? 'OK'
                        : `Broken at element ${primaryIntegrity.brokenIndex ?? 0}`}
                    </span>
                  </div>
                  <div className="verification-replay-controls">
                    <button
                      type="button"
                      className="ghost-button"
                      disabled={!primaryChain.length || boundedPrimaryIndex === 0}
                      onClick={() =>
                        setPrimaryIndex((prev) => Math.max(0, prev - 1))
                      }
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      disabled={
                        !primaryChain.length ||
                        boundedPrimaryIndex >= primaryChain.length - 1
                      }
                      onClick={() =>
                        setPrimaryIndex((prev) =>
                          Math.min(primaryChain.length - 1, prev + 1),
                        )
                      }
                    >
                      Next
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      disabled={!primaryChain.length}
                      onClick={() => handleCopyJson(primaryChain)}
                    >
                      Copy full chain JSON
                    </button>
                  </div>
                  <div className="verification-replay-list">
                    {primaryChain.map((bundle, idx) => (
                      <button
                        key={bundle.hash}
                        type="button"
                        className={
                          idx === boundedPrimaryIndex
                            ? 'verification-replay-item verification-replay-item--active'
                            : 'verification-replay-item'
                        }
                        onClick={() => setPrimaryIndex(idx)}
                      >
                        <span className="verification-replay-tick">t={bundle.tick}</span>
                        <span className="verification-replay-action">
                          {bundle.proposedAction.kind}
                          {!bundle.allowed ? ' · BLOCKED' : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                  {primaryBundle && (
                    <div className="verification-replay-detail">
                      <div className="verification-hash-row">
                        <span className="metric-label">Tick</span>
                        <span className="metric-value">{primaryBundle.tick}</span>
                      </div>
                      <div className="verification-hash-row">
                        <span className="metric-label">Runtime decision</span>
                        <span className="metric-value">
                          {primaryBundle.allowed ? 'Allowed' : 'Blocked'}
                        </span>
                      </div>
                      <div className="verification-hash-row">
                        <span className="metric-label">Constraints</span>
                        <span className="metric-value">
                          {primaryBundle.constraintsTriggered.join(', ') || '—'}
                        </span>
                      </div>
                      <div className="verification-hash-row">
                        <span className="metric-label">Reason</span>
                        <span className="metric-value">
                          {primaryBundle.reason ||
                            (primaryBundle.allowed ? 'Allowed' : 'Blocked')}
                        </span>
                      </div>
                      <div className="verification-hash-row">
                        <span className="metric-label">Runtime hash</span>
                        <span className="metric-value monospace-value" style={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
                          {primaryBundle.hash}
                        </span>
                      </div>
                      {primaryBundle.shadowVerification && (
                        <>
                          <div className="verification-hash-row">
                            <span className="metric-label">Recomputed decision</span>
                            <span className="metric-value">
                              {primaryBundle.shadowVerification.allowedRecomputed ? 'Allowed' : 'Blocked'}
                              {!primaryBundle.shadowVerification.decisionMatches && (
                                <span className="metric-value--warning"> (mismatch)</span>
                              )}
                            </span>
                          </div>
                          <div className="verification-hash-row">
                            <span className="metric-label">Recomputed hash</span>
                            <span className="metric-value monospace-value" style={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
                              {primaryBundle.shadowVerification.recomputedHash}
                            </span>
                          </div>
                          <div className="verification-hash-row">
                            <span className="metric-label">Shadow integrity</span>
                            <span
                              className={
                                primaryBundle.shadowVerification.integrityOk
                                  ? 'verification-value verification-value--pass'
                                  : 'verification-value verification-value--fail'
                              }
                            >
                              {primaryBundle.shadowVerification.integrityOk ? 'PASS' : 'FAIL'}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="ghost-button"
                            style={{ marginTop: '0.35rem' }}
                            onClick={() => {
                              try {
                                navigator.clipboard.writeText(primaryBundle.shadowVerification!.recomputedHash)
                                setCopyMessage('Recomputed hash copied')
                                setTimeout(() => setCopyMessage(null), 2000)
                              } catch {
                                // ignore
                              }
                            }}
                          >
                            Copy recomputed hash
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="verification-replay-column">
                  <div className="verification-select-row">
                    <label className="metric-label">Compare with (optional)</label>
                    <select
                      className="scenario-select"
                      value={secondaryAgentId ?? ''}
                      onChange={(e) => {
                        const v = e.target.value || undefined
                        setSecondaryAgentId(v)
                        setSecondaryIndex(0)
                      }}
                    >
                      <option value="">None</option>
                      {agentIds.map((id) => (
                        <option key={id} value={id}>
                          {id}
                        </option>
                      ))}
                    </select>
                  </div>

                  {secondaryAgent && (
                    <>
                      <div className="verification-integrity-row">
                        <span className="metric-label">Chain integrity</span>
                        <span className="metric-value">
                          {secondaryIntegrity.ok
                            ? 'OK'
                            : `Broken at element ${secondaryIntegrity.brokenIndex ?? 0}`}
                        </span>
                      </div>
                      <div className="verification-replay-list verification-replay-list--secondary">
                        {secondaryChain.map((bundle, idx) => (
                          <button
                            key={bundle.hash}
                            type="button"
                            className={
                              idx === boundedSecondaryIndex
                                ? 'verification-replay-item verification-replay-item--active'
                                : 'verification-replay-item'
                            }
                            onClick={() => setSecondaryIndex(idx)}
                          >
                            <span className="verification-replay-tick">t={bundle.tick}</span>
                            <span className="verification-replay-action">
                              {bundle.proposedAction.kind}
                              {!bundle.allowed ? ' · BLOCKED' : ''}
                            </span>
                          </button>
                        ))}
                      </div>
                      {secondaryBundle && (
                        <div className="verification-replay-detail">
                          <div className="verification-hash-row">
                            <span className="metric-label">Tick</span>
                            <span className="metric-value">{secondaryBundle.tick}</span>
                          </div>
                          <div className="verification-hash-row">
                            <span className="metric-label">Allowed</span>
                            <span className="metric-value">
                              {secondaryBundle.allowed ? 'Yes' : 'Blocked'}
                            </span>
                          </div>
                          <div className="verification-hash-row">
                            <span className="metric-label">Constraints</span>
                            <span className="metric-value">
                              {secondaryBundle.constraintsTriggered.join(', ') || '—'}
                            </span>
                          </div>
                          <div className="verification-hash-row">
                            <span className="metric-label">Reason</span>
                            <span className="metric-value">
                              {secondaryBundle.reason ||
                                (secondaryBundle.allowed ? 'Allowed' : 'Blocked')}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {primaryAgent && secondaryAgent && (
                    <div className="verification-divergence">
                      <div className="verification-hash-row">
                        <span className="metric-label">Divergence</span>
                        <span className="metric-value">
                          {compareDivergence
                            ? `First difference near t=${compareDivergence.tickA} vs t=${compareDivergence.tickB}`
                            : 'No divergence within recent decisions.'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="verification-independent-section">
            <h3 className="section-title">Independent verification</h3>
            <p className="section-subtitle">
              Verify all agent chains using only stored proof bundles. No simulation state. Export for
              external verification.
            </p>
            <div className="verification-independent-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  const result = verifyAllAgents(agentsById)
                  setIndependentVerifyResult(result)
                  setIndependentVerificationResult(result.allValid)
                }}
              >
                Run Independent Verification
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  const payload = buildRunProofsExport(runId, currentScenarioId, agentsById)
                  const blob = new Blob([JSON.stringify(payload, null, 2)], {
                    type: 'application/json',
                  })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `run-proofs-${runId ?? 'export'}-${Date.now()}.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                Export run proofs (JSON)
              </button>
            </div>
            {independentVerifyResult && (
              <div className="verification-independent-results">
                <div className="verification-hash-row">
                  <span className="metric-label">Total agents verified</span>
                  <span className="metric-value">{independentVerifyResult.results.length}</span>
                </div>
                <div className="verification-hash-row">
                  <span className="metric-label">Chains valid</span>
                  <span className="metric-value verification-value verification-value--pass">
                    {independentVerifyResult.results.filter((r) => r.valid).length}
                  </span>
                </div>
                <div className="verification-hash-row">
                  <span className="metric-label">Chains broken</span>
                  <span className="metric-value verification-value verification-value--fail">
                    {independentVerifyResult.results.filter((r) => !r.valid).length}
                  </span>
                </div>
                {!independentVerifyResult.allValid && (
                  <div className="verification-independent-first-failure">
                    <span className="metric-label">First failure</span>
                    {(() => {
                      const first = independentVerifyResult.results.find((r) => !r.valid)
                      if (!first) return null
                      return (
                        <span className="metric-value">
                          Agent {first.agentId}, chain index {first.brokenIndex ?? '?'}:{' '}
                          {first.errors[0] ?? 'Unknown'}
                        </span>
                      )
                    })()}
                  </div>
                )}
              </div>
            )}
          </section>

          <footer className="verification-footer">
            <h3 className="section-title">Playback</h3>
            <p className="section-subtitle">
              Pause, step, or scrub through stored proof chains. Replay uses in-memory bundles only.
            </p>
            <div className="verification-playback-controls">
              <span className="metric-label">Tick {tick}</span>
              <button
                type="button"
                className="ghost-button"
                onClick={running ? stop : start}
              >
                {running ? 'Pause' : 'Play'}
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={step}
                disabled={running}
              >
                Step forward
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}

