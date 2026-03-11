import type { FC } from 'react'
import { useEffect } from 'react'
import { useSimulationUiStore } from '../store/simulationStore'

const FREEZE_FRAME_DURATION_MS = 4000

export const FreezeFrameCard: FC = () => {
  const freezeFramePayload = useSimulationUiStore((s) => s.freezeFramePayload)
  const setFreezeFrame = useSimulationUiStore((s) => s.setFreezeFrame)
  const selectAgent = useSimulationUiStore((s) => s.selectAgent)
  const setOpenProofRecordForAgentId = useSimulationUiStore((s) => s.setOpenProofRecordForAgentId)

  useEffect(() => {
    if (!freezeFramePayload) return
    const t = setTimeout(() => setFreezeFrame(null), FREEZE_FRAME_DURATION_MS)
    return () => clearTimeout(t)
  }, [freezeFramePayload, setFreezeFrame])

  if (!freezeFramePayload) return null

  const handleSeeProof = () => {
    selectAgent(freezeFramePayload.agentId)
    setOpenProofRecordForAgentId(freezeFramePayload.agentId)
    setFreezeFrame(null)
  }

  const handleContinue = () => {
    setFreezeFrame(null)
  }

  return (
    <div className="freeze-frame-overlay" role="dialog" aria-label="Governance block">
      <div className="freeze-frame-card">
        <h3 className="freeze-frame-title">&#x26A0; GOVERNANCE BLOCK</h3>
        <p className="freeze-frame-agent">
          {freezeFramePayload.agentId} ({freezeFramePayload.agentRole})
        </p>
        <p className="freeze-frame-body">
          Agent {freezeFramePayload.agentId} ({freezeFramePayload.agentRole}) attempted to{' '}
          {freezeFramePayload.actionDescription}. This was blocked because {freezeFramePayload.policyReason}
        </p>
        <div className="freeze-frame-actions">
          <button type="button" className="freeze-frame-btn freeze-frame-btn--ghost" onClick={handleSeeProof}>
            See proof record
          </button>
          <button type="button" className="freeze-frame-btn freeze-frame-btn--primary" onClick={handleContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
