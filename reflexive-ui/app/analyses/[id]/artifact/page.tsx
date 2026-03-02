'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import type { InstitutionalArtifact } from '@/lib/artifact-domain/artifact.types'

function ArtifactDocument({ artifact }: { artifact: InstitutionalArtifact }) {
  return (
    <div className="min-h-screen bg-white print:bg-white">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 1in;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-8 py-12 print:px-0 print:py-8">
        {/* Header */}
        <div className="mb-12 print:mb-8 border-b border-black/10 pb-8 print:pb-4">
          <div className="font-mono text-[10px] text-gray-600 uppercase tracking-wider mb-2">
            REFLEXIVE — INSTITUTIONAL DECISION ARTIFACT
          </div>
          <div className="text-sm text-gray-700 mb-1">
            Analysis ID: {artifact.artifactId}
          </div>
          <div className="text-sm text-gray-700 mb-1">
            Classification: {artifact.classification}
          </div>
          <div className="text-xs text-gray-500">
            Schema: {artifact.schemaVersion}
          </div>
        </div>

        {/* Executive Signal */}
        <section className="mb-12 print:mb-8">
          <div className="font-mono text-[10px] text-gray-600 uppercase tracking-wider mb-4">
            EXECUTIVE SIGNAL
          </div>
          <div className="space-y-3">
            <div className="text-lg font-semibold text-gray-900">
              Decision Posture: {artifact.executiveSignal.postureCondition
                ? `${artifact.executiveSignal.posture} — ${artifact.executiveSignal.postureCondition}`
                : artifact.executiveSignal.posture}
            </div>
            <div className="text-sm text-gray-700">
              Variance Driver: {artifact.executiveSignal.varianceDriver}
            </div>
            <div className="text-sm text-gray-700 leading-relaxed">
              {artifact.executiveSignal.interpretation}
            </div>
          </div>
        </section>

        {/* Evidence Position */}
        <section className="mb-12 print:mb-8">
          <div className="font-mono text-[10px] text-gray-600 uppercase tracking-wider mb-4">
            EVIDENCE POSITION
          </div>
          <div className="space-y-2 text-sm text-gray-700 mb-4">
            <div>Claims Extracted: {artifact.evidencePosition.claimsExtracted}</div>
            <div>Evidence-Linked (Total): {artifact.evidencePosition.evidenceLinkedClaims}</div>
            <div>External Coverage: {artifact.evidencePosition.externalCoveragePercent ?? 0}%</div>
            <div>Stimulus Coverage: {artifact.evidencePosition.inputCoveragePercent ?? 0}%</div>
            <div>Evidence Linked (External): {artifact.evidencePosition.externalLinkedClaims ?? 0}</div>
            <div>Evidence Linked (Stimulus): {artifact.evidencePosition.inputLinkedClaims ?? 0}</div>
            <div>Unsupported: {artifact.evidencePosition.unsupportedCount} (forward-state only)</div>
          </div>
          <div className="text-sm text-gray-700 italic">
            Institutional interpretation:
          </div>
          <div className="text-sm text-gray-700 mt-2 leading-relaxed">
            {artifact.evidencePosition.institutionalInterpretation}
          </div>
          <div className="text-[10px] text-gray-500 italic mt-2">
            Stimulus coverage reflects linkage to the user-provided prompt, not independent validation.
          </div>
        </section>

        {/* Epistemic Stratification */}
        <section className="mb-12 print:mb-8">
          <div className="font-mono text-[10px] text-gray-600 uppercase tracking-wider mb-4">
            EPISTEMIC STRATIFICATION
          </div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-black/10">
                <th className="text-left py-2 font-semibold text-gray-900">Tier</th>
                <th className="text-left py-2 font-semibold text-gray-900">Definition</th>
                <th className="text-left py-2 font-semibold text-gray-900">Decision Weight</th>
                <th className="text-right py-2 font-semibold text-gray-900">Claims</th>
              </tr>
            </thead>
            <tbody>
              {artifact.epistemicStratification.map((s, i) => (
                <tr key={i} className="border-b border-black/5">
                  <td className="py-2 text-gray-700">{s.tier}</td>
                  <td className="py-2 text-gray-700">{s.definition}</td>
                  <td className="py-2 text-gray-700">{s.decisionWeight}</td>
                  <td className="py-2 text-gray-700 text-right">{s.claimCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Structural Thesis */}
        <section className="mb-12 print:mb-8">
          <div className="font-mono text-[10px] text-gray-600 uppercase tracking-wider mb-4">
            STRUCTURAL THESIS
          </div>
          <div className="text-base text-gray-900 leading-relaxed mb-4">
            {artifact.structuralThesis.classification}
          </div>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {artifact.structuralThesis.thesis}
          </div>
        </section>

        {/* Confidence Construction */}
        <section className="mb-12 print:mb-8">
          <div className="font-mono text-[10px] text-gray-600 uppercase tracking-wider mb-4">
            CONFIDENCE CONSTRUCTION
          </div>
          <div className="space-y-4">
            <div className="text-sm text-gray-700">
              Band: {artifact.confidenceConstruction.band}
              {artifact.confidenceConstruction.qualifier && ` (${artifact.confidenceConstruction.qualifier})`}
            </div>
            
            {artifact.confidenceConstruction.positiveForces.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Positive Forces:</div>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                  {artifact.confidenceConstruction.positiveForces.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {artifact.confidenceConstruction.compressionForces.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Compression Forces:</div>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
                  {artifact.confidenceConstruction.compressionForces.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="text-sm text-gray-700 italic mt-4">
              Principle: {artifact.confidenceConstruction.principle}
            </div>
          </div>
        </section>

        {/* Decision Gates */}
        <section className="mb-12 print:mb-8">
          <div className="font-mono text-[10px] text-gray-600 uppercase tracking-wider mb-4">
            DECISION GATE — RE-TIGHTENED
          </div>
          <div className="space-y-6">
            {artifact.decisionGates.map((gate) => (
              <div key={gate.gateId}>
                <div className="text-sm font-semibold text-gray-900 mb-2">{gate.title}</div>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-black/10">
                      <th className="text-left py-2 font-semibold text-gray-900">Result</th>
                      <th className="text-left py-2 font-semibold text-gray-900">Institutional Move</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gate.rows.map((row, i) => (
                      <tr key={i} className="border-b border-black/5">
                        <td className="py-2 text-gray-700">{row.condition}</td>
                        <td className="py-2 text-gray-700">{row.move}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </section>

        {/* Convergence Field */}
        <section className="mb-12 print:mb-8">
          <div className="font-mono text-[10px] text-gray-600 uppercase tracking-wider mb-4">
            CONVERGENCE FIELD
          </div>
          <div className="space-y-3">
            {artifact.convergenceField.map((conv, i) => (
              <div key={i} className="text-sm text-gray-700">
                <div className="font-semibold mb-1">• {conv.theme}</div>
                <div className="ml-4 text-gray-600">{conv.interpretation}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Active Divergence */}
        <section className="mb-12 print:mb-8">
          <div className="font-mono text-[10px] text-gray-600 uppercase tracking-wider mb-4">
            ACTIVE DIVERGENCE
          </div>
          <div className="space-y-6">
            {artifact.activeDivergence.map((div, i) => (
              <div key={i}>
                <div className="text-sm font-semibold text-gray-900 mb-2">{div.theme}</div>
                <div className="space-y-2 ml-4 mb-3">
                  {div.positions.map((pos, j) => (
                    <div key={j} className="text-sm text-gray-700">
                      <span className="font-medium">{pos.label}:</span> {pos.interpretation}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-600 italic ml-4">
                  {div.institutionalRead}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reasoning Trace */}
        {artifact.reasoningTrace.length > 0 && (
          <section className="mb-12 print:mb-8">
            <div className="font-mono text-[10px] text-gray-600 uppercase tracking-wider mb-4">
              TRACE — REASONING PATH
            </div>
            <div className="space-y-2">
              {artifact.reasoningTrace.map((trace, i) => (
                <div key={i} className="text-sm text-gray-700">
                  <span className="font-semibold">{trace.lens}</span> → {trace.path}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Terminal Line */}
        <section className="mt-16 print:mt-12 pt-8 print:pt-6 border-t-2 border-black/20">
          <div className="font-mono text-[10px] text-gray-600 uppercase tracking-wider mb-4">
            TERMINAL LINE
          </div>
          <div className="text-base font-semibold text-gray-900 leading-relaxed">
            {artifact.terminalLine}
          </div>
        </section>
      </div>
    </div>
  )
}

export default function ArtifactPage() {
  const params = useParams()
  const router = useRouter()
  const analysisId = params.id as string

  // Fetch artifact directly from backend endpoint
  const {
    data: artifact,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['artifact', analysisId],
    queryFn: () => api.getArtifact(analysisId),
    retry: false,
  })

  // Fetch stored analysis for re-run fallback - MUST be before any early returns
  const {
    data: storedAnalysis,
  } = useQuery({
    queryKey: ['stored-analysis', analysisId],
    queryFn: () => api.getStoredAnalysis(analysisId),
    retry: false,
    enabled: !!error || !artifact,
  })

  const rerunMutation = useMutation({
    mutationFn: api.createAnalysis,
    onSuccess: (data) => {
      router.push(`/analyses/${data.analysis_id}/artifact`)
    },
    onError: (error: any) => {
      console.error('Re-run failed:', error)
      alert(`Failed to re-run analysis: ${error?.message || 'Unknown error'}`)
    },
  })

  const handleRerun = () => {
    const stimulus = storedAnalysis?.inputs?.stimulus || storedAnalysis?.request?.stimulus
    if (!stimulus?.text || !stimulus?.type) {
      alert('Could not find original stimulus. Please create a new analysis.')
      return
    }
    rerunMutation.mutate({
      stimulus: {
        text: stimulus.text,
        type: stimulus.type,
      },
      context: storedAnalysis?.inputs?.context || storedAnalysis?.request?.context,
      options: {
        dry_run: false,
        save: true,
      },
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm text-gray-600">Loading decision artifact...</div>
        </div>
      </div>
    )
  }

  if (error) {
    const errorCode = (error as any)?.code || ''
    const isIncomplete = errorCode === 'MISSING_SYNTHESIS_SCORE' || errorCode?.startsWith('HTTP_409')
    
    if (isIncomplete) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="max-w-md text-center px-8">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">
              Analysis Incomplete
            </h1>
            <p className="text-sm text-gray-700 mb-6">
              This analysis was created before confidence scoring was available. Re-run to generate a complete artifact.
            </p>
            <button
              onClick={handleRerun}
              disabled={rerunMutation.isPending}
              className="bg-gray-900 text-white px-6 py-3 text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {rerunMutation.isPending ? 'Creating...' : 'Re-run analysis'}
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Error loading artifact</h1>
          <p className="text-sm text-gray-700">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    )
  }

  if (!artifact) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <div className="max-w-4xl mx-auto px-8 pt-8 print:hidden">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => router.push('/analyses')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Decision History
          </button>
          <button
            onClick={() => window.print()}
            className="text-xs text-gray-600 hover:text-gray-900 font-mono"
          >
            Print
          </button>
        </div>
      </div>

      <ArtifactDocument artifact={artifact} />

      {/* Debug Panel (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <DebugPanel artifact={artifact} />
      )}

      {/* Footer with raw JSON link */}
      <div className="max-w-4xl mx-auto px-8 pb-8 print:hidden">
        <div className="border-t border-black/10 pt-6 mt-12">
          <button
            onClick={() => {
              const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
              window.open(`${apiBase}/v1/analyses/${analysisId}`, '_blank')
            }}
            className="text-xs text-gray-500 hover:text-gray-700 font-mono"
          >
            Developer → View Raw Analysis
          </button>
        </div>
      </div>

      {/* Debug Panel (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <DebugPanel artifact={artifact} />
      )}
    </div>
  )
}

function DebugPanel({ artifact }: { artifact: InstitutionalArtifact }) {
  const [expanded, setExpanded] = useState(false)

  const debugInfo = {
    __artifact_debug: (artifact as any).__artifact_debug || 'missing',
    externalCoveragePercent: artifact.evidencePosition.externalCoveragePercent ?? 'N/A',
    inputCoveragePercent: artifact.evidencePosition.inputCoveragePercent ?? 'N/A',
    externalLinkedClaims: artifact.evidencePosition.externalLinkedClaims ?? 'N/A',
    inputLinkedClaims: artifact.evidencePosition.inputLinkedClaims ?? 'N/A',
    posture: artifact.executiveSignal.posture,
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-50 border-t border-gray-200 print:hidden z-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-2 py-1 text-[10px] font-mono text-gray-500 hover:text-gray-700 hover:bg-gray-100 text-left"
      >
        {expanded ? '▼ DEBUG' : '▶ DEBUG'}
      </button>
      {expanded && (
        <div className="px-2 pb-2 text-[10px] font-mono text-gray-600 space-y-0.5 bg-gray-50">
          <div>debug: {debugInfo.__artifact_debug}</div>
          <div>externalCoverage: {debugInfo.externalCoveragePercent}%</div>
          <div>inputCoverage: {debugInfo.inputCoveragePercent}%</div>
          <div>externalLinkedClaims: {debugInfo.externalLinkedClaims}</div>
          <div>inputLinkedClaims: {debugInfo.inputLinkedClaims}</div>
          <div>posture: {debugInfo.posture}</div>
        </div>
      )}
    </div>
  )
}
