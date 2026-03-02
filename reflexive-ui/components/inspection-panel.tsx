'use client'

import type { DemoPackResponse } from '@/lib/api'

type SelectedNode = 
  | { type: 'lens'; id: string; lens: string }
  | { type: 'claim'; id: string; claimId: string }
  | { type: 'evidence'; id: string; evidenceId: string }
  | { type: 'convergence'; id: string; themeId: string }
  | { type: 'divergence'; id: string; themeId: string }
  | null

interface InspectionPanelProps {
  analysis: DemoPackResponse
  selectedNode: SelectedNode
  onClose: () => void
}

export function InspectionPanel({
  analysis,
  selectedNode,
  onClose,
}: InspectionPanelProps) {
  if (!selectedNode) {
    return (
      <div className="h-full flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-muted text-sm mb-2">No selection</div>
          <div className="text-xs text-muted/60">
            Click a node in the graph to inspect
          </div>
        </div>
      </div>
    )
  }

  const lensArtifacts = analysis.artifacts?.lens_artifacts || []
  const claimArtifacts = analysis.artifacts?.claim_artifacts || []
  const evidenceArtifacts = analysis.artifacts?.evidence_artifacts || {}
  const synthesis = analysis.synthesis || {}

  if (selectedNode.type === 'lens') {
    const lens = lensArtifacts.find((l: any) => l.lens === selectedNode.lens)
    const claims = claimArtifacts.filter((c: any) => c.lens === selectedNode.lens)

    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="font-mono text-[10px] text-muted uppercase tracking-wider">
            INSPECTION
          </div>
          <button
            onClick={onClose}
            className="text-xs text-muted hover:text-foreground"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          <div>
            <div className="text-sm font-semibold text-foreground mb-1">
              {selectedNode.lens}
            </div>
            <div className="text-xs text-muted">Lens</div>
          </div>

          {lens && (
            <>
              <div>
                <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-2">
                  STATUS
                </div>
                <div className="text-xs text-foreground">
                  {lens.status === 'ok' ? 'Completed' : 'Failed'}
                </div>
              </div>

              {lens.duration_ms && (
                <div>
                  <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-2">
                    LATENCY
                  </div>
                  <div className="text-xs text-foreground font-mono">
                    {lens.duration_ms}ms
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-2">
              CLAIMS ({claims.length})
            </div>
            <div className="space-y-2">
              {claims.slice(0, 10).map((claim: any) => (
                <div
                  key={claim.claim_id}
                  className="px-2 py-1.5 border border-border rounded text-xs text-foreground leading-relaxed"
                >
                  {claim.text}
                </div>
              ))}
              {claims.length > 10 && (
                <div className="text-xs text-muted">
                  +{claims.length - 10} more
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (selectedNode.type === 'claim') {
    const claim = claimArtifacts.find((c: any) => c.claim_id === selectedNode.claimId)
    const evidenceLinks = (evidenceArtifacts.links || []).filter(
      (link: any) => link.claim_id === selectedNode.claimId
    )
    const evidenceItems = evidenceArtifacts.items || []
    const evidenceMap = new Map(evidenceItems.map((item: any) => [item.id, item]))

    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="font-mono text-[10px] text-muted uppercase tracking-wider">
            INSPECTION
          </div>
          <button
            onClick={onClose}
            className="text-xs text-muted hover:text-foreground"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {claim ? (
            <>
              <div>
                <div className="text-sm font-semibold text-foreground mb-2 leading-relaxed">
                  {claim.text}
                </div>
                <div className="text-xs text-muted">Claim</div>
              </div>

              <div>
                <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-2">
                  PROVENANCE
                </div>
                <div className="text-xs text-foreground space-y-1">
                  <div>Lens: {claim.lens}</div>
                  {claim.about_entity && (
                    <div>Entity: {claim.about_entity}</div>
                  )}
                  {claim.provenance?.lens_raw_ref && (
                    <div className="font-mono text-[10px] text-muted/60 mt-2">
                      Ref: {claim.provenance.lens_raw_ref.substring(0, 40)}...
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-2">
                  INFERENCE TYPE
                </div>
                <div className="flex flex-wrap gap-2">
                  {claim.category && (
                    <div className="px-2 py-1 bg-gray-100 rounded text-xs text-foreground font-mono">
                      {claim.category}
                    </div>
                  )}
                  {claim.polarity && (
                    <div className="px-2 py-1 bg-gray-100 rounded text-xs text-foreground font-mono">
                      {claim.polarity}
                    </div>
                  )}
                </div>
              </div>

              {claim.evidence_basis && (
                <div>
                  <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-2">
                    EVIDENCE BASIS
                  </div>
                  <div className="text-xs text-foreground leading-relaxed">
                    {claim.evidence_basis}
                  </div>
                </div>
              )}

              <div>
                <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-2">
                  EVIDENCE LINKS ({evidenceLinks.length})
                </div>
                <div className="space-y-2">
                  {evidenceLinks.map((link: any) => {
                    const evidence = evidenceMap.get(link.evidence_item_id) as any
                    if (!evidence) return null
                    return (
                      <div
                        key={link.evidence_item_id}
                        className="px-2 py-1.5 border border-border rounded text-xs"
                      >
                        <div className="font-mono text-[10px] text-muted mb-1">
                          {evidence?.source_type || 'unknown'}
                        </div>
                        <div className="text-foreground leading-relaxed">
                          {evidence?.content_text || ''}
                        </div>
                        <div className="mt-1 text-[10px] text-muted">
                          Support: {link.support_type}
                        </div>
                      </div>
                    )
                  })}
                  {evidenceLinks.length === 0 && (
                    <div className="text-xs text-muted">No evidence linked</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-xs text-muted">Claim not found</div>
          )}
        </div>
      </div>
    )
  }

  if (selectedNode.type === 'evidence') {
    const evidenceItems = evidenceArtifacts.items || []
    const evidence = evidenceItems.find((e: any) => e.id === selectedNode.evidenceId)
    const claimLinks = (evidenceArtifacts.links || []).filter(
      (link: any) => link.evidence_item_id === selectedNode.evidenceId
    )
    const claimMap = new Map(claimArtifacts.map((c: any) => [c.claim_id, c]))

    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="font-mono text-[10px] text-muted uppercase tracking-wider">
            INSPECTION
          </div>
          <button
            onClick={onClose}
            className="text-xs text-muted hover:text-foreground"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {evidence ? (
            <>
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">
                  {evidence.source_type}
                </div>
                <div className="text-xs text-muted">Evidence Item</div>
              </div>

              <div>
                <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-2">
                  CONTENT
                </div>
                <div className="text-xs text-foreground leading-relaxed">
                  {evidence.content_text}
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-2">
                  METADATA
                </div>
                <div className="text-xs text-foreground space-y-1">
                  <div>As of: {evidence.as_of || 'N/A'}</div>
                  <div>Stale: {evidence.possibly_stale ? 'Yes' : 'No'}</div>
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-2">
                  LINKED CLAIMS ({claimLinks.length})
                </div>
                <div className="space-y-2">
                  {claimLinks.map((link: any) => {
                    const claim = claimMap.get(link.claim_id) as any
                    if (!claim) return null
                    return (
                      <div
                        key={link.claim_id}
                        className="px-2 py-1.5 border border-border rounded text-xs"
                      >
                        <div className="text-foreground leading-relaxed mb-1">
                          {claim?.text || ''}
                        </div>
                        <div className="text-[10px] text-muted">
                          Support: {link.support_type}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-xs text-muted">Evidence not found</div>
          )}
        </div>
      </div>
    )
  }

  if (selectedNode.type === 'convergence') {
    const convergencePoints = synthesis.convergence_points || []
    const convergence = convergencePoints.find(
      (c: any) => c.theme_id === selectedNode.themeId
    )
    const supportingClaimIds = convergence?.supporting_claims || []
    const supportingClaims = claimArtifacts.filter((c: any) =>
      supportingClaimIds.includes(c.claim_id)
    )
    // Get unique lens names from supporting claims
    const supportingLensNames = Array.from(
      new Set(supportingClaims.map((c: any) => c.lens))
    )

    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="font-mono text-[10px] text-muted uppercase tracking-wider">
            INSPECTION
          </div>
          <button
            onClick={onClose}
            className="text-xs text-muted hover:text-foreground"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {convergence ? (
            <>
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">
                  {convergence.theme_label || 'Unlabeled convergence'}
                </div>
                <div className="text-xs text-muted">Convergence Point</div>
              </div>

              <div>
                <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-2">
                  STRENGTH
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-green-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${(convergence.strength || 0) * 100}%` }}
                    />
                  </div>
                  <div className="font-mono text-xs text-green-700 font-semibold">
                    {((convergence.strength || 0) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-2">
                  EVIDENCE DENSITY
                </div>
                <div className="font-mono text-xs text-foreground">
                  {(convergence.evidence_density || 0).toFixed(3)}
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-2">
                  SUPPORTING LENSES ({supportingLensNames.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {(supportingLensNames as string[]).map((lensName: string) => (
                    <div
                      key={lensName}
                      className="px-2 py-1 bg-gray-100 rounded text-xs text-foreground font-mono"
                    >
                      {lensName}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-2">
                  SUPPORTING CLAIMS ({supportingClaims.length})
                </div>
                <div className="space-y-2">
                  {supportingClaims.slice(0, 5).map((claim: any) => (
                    <div
                      key={claim.claim_id}
                      className="px-2 py-1.5 border border-border rounded text-xs text-foreground leading-relaxed"
                    >
                      {claim.text}
                    </div>
                  ))}
                  {supportingClaims.length > 5 && (
                    <div className="text-xs text-muted">
                      +{supportingClaims.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-xs text-muted">Convergence not found</div>
          )}
        </div>
      </div>
    )
  }

  if (selectedNode.type === 'divergence') {
    const divergencePoints = synthesis.divergence_points || []
    const divergence = divergencePoints.find(
      (d: any) => d.theme_id === selectedNode.themeId
    )

    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="font-mono text-[10px] text-muted uppercase tracking-wider">
            INSPECTION
          </div>
          <button
            onClick={onClose}
            className="text-xs text-muted hover:text-foreground"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {divergence ? (
            <>
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">
                  {divergence.theme_label || 'Unlabeled divergence'}
                </div>
                <div className="text-xs text-muted">Divergence Point</div>
              </div>

              <div>
                <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-2">
                  NATURE
                </div>
                <div className="px-2 py-1 bg-red-50 border border-red-200 rounded text-xs text-red-800 font-mono">
                  {divergence.nature || 'contradictory'}
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-2">
                  SEVERITY
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-red-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${(divergence.severity || 0) * 100}%` }}
                    />
                  </div>
                  <div className="font-mono text-xs text-red-700 font-semibold">
                    {((divergence.severity || 0) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-2">
                  POSITIONS ({divergence.positions?.length || 0})
                </div>
                <div className="space-y-3">
                  {divergence.positions?.map((pos: any, idx: number) => {
                    const claimIds = pos.claim_ids || []
                    const claims = claimArtifacts.filter((c: any) =>
                      claimIds.includes(c.claim_id)
                    )
                    // Get unique lens names from claims in this position
                    const lensNames = Array.from(new Set(claims.map((c: any) => c.lens)))
                    return (
                      <div key={idx} className="border border-red-200 rounded p-3 bg-red-50">
                        <div className="text-xs font-semibold text-red-900 mb-2">
                          Position {idx + 1}
                        </div>
                        <div className="text-xs text-muted mb-2">
                          Lenses: {lensNames.join(', ') || 'Unknown'}
                        </div>
                        <div className="text-xs text-red-800 mb-2">
                          {pos.position_summary}
                        </div>
                        <div className="space-y-1 mt-2">
                          {claims.slice(0, 3).map((claim: any) => (
                            <div
                              key={claim.claim_id}
                              className="text-xs text-foreground leading-relaxed pl-2 border-l-2 border-red-300"
                            >
                              {claim.text}
                            </div>
                          ))}
                          {claims.length > 3 && (
                            <div className="text-xs text-muted">
                              +{claims.length - 3} more claims
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-xs text-muted">Divergence not found</div>
          )}
        </div>
      </div>
    )
  }

  return null
}
