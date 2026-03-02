'use client'

import { useCallback, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { DemoPackResponse } from '@/lib/api'

type SelectedNode = 
  | { type: 'lens'; id: string; lens: string }
  | { type: 'claim'; id: string; claimId: string }
  | { type: 'evidence'; id: string; evidenceId: string }
  | { type: 'convergence'; id: string; themeId: string }
  | { type: 'divergence'; id: string; themeId: string }
  | null

interface ReasoningGraphProps {
  analysis: DemoPackResponse
  selectedNode: SelectedNode
  onNodeSelect: (node: SelectedNode) => void
}

// Custom node components
function LensNode({ data }: { data: any }) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-white shadow-sm cursor-pointer transition-all ${
        data.selected
          ? 'border-foreground shadow-md'
          : 'border-border hover:border-foreground/30'
      }`}
      style={{ minWidth: '180px' }}
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />
      <div className="font-mono text-[10px] text-muted uppercase tracking-wider mb-1">
        LENS
      </div>
      <div className="font-semibold text-sm text-foreground mb-1">
        {data.lens}
      </div>
      <div className="text-xs text-muted">
        {data.claimCount} {data.claimCount === 1 ? 'claim' : 'claims'}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </div>
  )
}

function ClaimNode({ data }: { data: any }) {
  return (
    <div
      className={`px-3 py-2 rounded border bg-white shadow-sm cursor-pointer transition-all ${
        data.selected
          ? 'border-foreground shadow-md'
          : 'border-border hover:border-foreground/30'
      }`}
      style={{ minWidth: '200px', maxWidth: '250px' }}
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="font-mono text-[9px] text-muted uppercase tracking-wider">
          {data.category || 'CLAIM'}
        </div>
        {data.polarity && (
          <div
            className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
              data.polarity === 'positive'
                ? 'bg-green-50 text-green-700'
                : data.polarity === 'negative'
                ? 'bg-red-50 text-red-700'
                : 'bg-gray-50 text-gray-700'
            }`}
          >
            {data.polarity[0].toUpperCase()}
          </div>
        )}
      </div>
      <div className="text-xs text-foreground leading-relaxed line-clamp-3">
        {data.text}
      </div>
      {data.evidenceCount > 0 && (
        <div className="mt-1.5 text-[10px] text-muted">
          {data.evidenceCount} evidence
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </div>
  )
}

function EvidenceNode({ data }: { data: any }) {
  return (
    <div
      className={`px-2.5 py-1.5 rounded border bg-white shadow-sm cursor-pointer transition-all ${
        data.selected
          ? 'border-foreground shadow-md'
          : 'border-border hover:border-foreground/30'
      }`}
      style={{ minWidth: '160px', maxWidth: '200px' }}
    >
      <Handle type="target" position={Position.Top} className="!bg-border" />
      <div className="font-mono text-[9px] text-muted uppercase tracking-wider mb-1">
        {data.sourceType}
      </div>
      <div className="text-[10px] text-foreground leading-relaxed line-clamp-2">
        {data.content}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </div>
  )
}

function ConvergenceNode({ data }: { data: any }) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-green-50 shadow-sm cursor-pointer transition-all ${
        data.selected
          ? 'border-green-600 shadow-md'
          : 'border-green-200 hover:border-green-400'
      }`}
      style={{ minWidth: '220px' }}
    >
      <Handle type="target" position={Position.Top} className="!bg-green-300" />
      <div className="font-mono text-[10px] text-green-700 uppercase tracking-wider mb-1">
        CONVERGENCE
      </div>
      <div className="text-sm font-semibold text-foreground mb-1.5">
        {data.themeLabel}
      </div>
      <div className="text-xs text-muted mb-2">
        {data.lensCount} {data.lensCount === 1 ? 'lens' : 'lenses'} · {data.claimCount} claims
      </div>
      <div className="flex items-center gap-2">
        <div className="text-[10px] text-muted">Strength:</div>
        <div className="flex-1 h-1.5 bg-green-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500"
            style={{ width: `${data.strength * 100}%` }}
          />
        </div>
        <div className="font-mono text-[10px] text-green-700">
          {(data.strength * 100).toFixed(0)}%
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-green-300" />
    </div>
  )
}

function DivergenceNode({ data }: { data: any }) {
  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-red-50 shadow-sm cursor-pointer transition-all ${
        data.selected
          ? 'border-red-600 shadow-md'
          : 'border-red-200 hover:border-red-400'
      }`}
      style={{ minWidth: '220px' }}
    >
      <Handle type="target" position={Position.Top} className="!bg-red-300" />
      <div className="font-mono text-[10px] text-red-700 uppercase tracking-wider mb-1">
        DIVERGENCE
      </div>
      <div className="text-sm font-semibold text-foreground mb-1.5">
        {data.themeLabel}
      </div>
      <div className="text-xs text-muted mb-2">
        {data.positionCount} {data.positionCount === 1 ? 'position' : 'positions'}
      </div>
      <div className="flex items-center gap-2">
        <div className="text-[10px] text-muted">Severity:</div>
        <div className="flex-1 h-1.5 bg-red-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500"
            style={{ width: `${data.severity * 100}%` }}
          />
        </div>
        <div className="font-mono text-[10px] text-red-700">
          {(data.severity * 100).toFixed(0)}%
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-red-300" />
    </div>
  )
}

const nodeTypes: NodeTypes = {
  lens: LensNode,
  claim: ClaimNode,
  evidence: EvidenceNode,
  convergence: ConvergenceNode,
  divergence: DivergenceNode,
}

export function ReasoningGraph({
  analysis,
  selectedNode,
  onNodeSelect,
}: ReasoningGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const lensArtifacts = analysis.artifacts?.lens_artifacts || []
    const claimArtifacts = analysis.artifacts?.claim_artifacts || []
    const evidenceArtifacts = analysis.artifacts?.evidence_artifacts || {}
    const synthesis = analysis.synthesis || {}
    const convergencePoints = synthesis.convergence_points || []
    const divergencePoints = synthesis.divergence_points || []

    const nodes: Node[] = []
    const edges: Edge[] = []

    // Build lens nodes (top level)
    const lensNodes: Map<string, Node> = new Map()
    lensArtifacts.forEach((lens: any, idx: number) => {
      const lensId = `lens-${lens.lens}`
      const claimCount = claimArtifacts.filter((c: any) => c.lens === lens.lens).length
      
      const node: Node = {
        id: lensId,
        type: 'lens',
        position: { x: 100 + (idx % 3) * 280, y: 50 },
        data: {
          lens: lens.lens,
          claimCount,
          selected: selectedNode?.type === 'lens' && selectedNode.id === lensId,
        },
      }
      lensNodes.set(lens.lens, node)
      nodes.push(node)
    })

    // Build claim nodes (under lenses)
    const claimNodes: Map<string, Node> = new Map()
    const claimsByLens = new Map<string, any[]>()
    
    claimArtifacts.forEach((claim: any) => {
      if (!claimsByLens.has(claim.lens)) {
        claimsByLens.set(claim.lens, [])
      }
      claimsByLens.get(claim.lens)!.push(claim)
    })

    let claimYOffset = 180
    lensArtifacts.forEach((lens: any) => {
      const lensId = `lens-${lens.lens}`
      const lensClaims = claimsByLens.get(lens.lens) || []
      
      lensClaims.forEach((claim: any, claimIdx: number) => {
        const claimId = `claim-${claim.claim_id}`
        const evidenceLinks = (evidenceArtifacts.links || []).filter(
          (link: any) => link.claim_id === claim.claim_id
        )
        
        const node: Node = {
          id: claimId,
          type: 'claim',
          position: {
            x: 100 + (lensArtifacts.findIndex((l: any) => l.lens === lens.lens) % 3) * 280 + (claimIdx % 2) * 140,
            y: claimYOffset + Math.floor(claimIdx / 2) * 120,
          },
          data: {
            claimId: claim.claim_id,
            text: claim.text,
            category: claim.category,
            polarity: claim.polarity,
            evidenceCount: evidenceLinks.length,
            selected: selectedNode?.type === 'claim' && selectedNode.id === claimId,
          },
        }
        claimNodes.set(claim.claim_id, node)
        nodes.push(node)

        // Edge from lens to claim
        edges.push({
          id: `edge-${lensId}-${claimId}`,
          source: lensId,
          target: claimId,
          type: 'smoothstep',
          style: { stroke: '#e5e7eb', strokeWidth: 1.5 },
        })
      })
      
      if (lensClaims.length > 0) {
        claimYOffset += Math.ceil(lensClaims.length / 2) * 120 + 40
      }
    })

    // Build evidence nodes (under claims)
    const evidenceNodes: Map<string, Node> = new Map()
    const evidenceItems = evidenceArtifacts.items || []
    const evidenceMap = new Map(evidenceItems.map((item: any) => [item.id, item]))

    claimArtifacts.forEach((claim: any) => {
      const claimId = `claim-${claim.claim_id}`
      const claimNode = claimNodes.get(claim.claim_id)
      if (!claimNode) return

      const evidenceLinks = (evidenceArtifacts.links || []).filter(
        (link: any) => link.claim_id === claim.claim_id
      )

      evidenceLinks.forEach((link: any, evIdx: number) => {
        const evidence = evidenceMap.get(link.evidence_item_id) as any
        if (!evidence) return

        const evidenceId = `evidence-${evidence.id}`
        
        if (!evidenceNodes.has(evidenceId)) {
          const node: Node = {
            id: evidenceId,
            type: 'evidence',
            position: {
              x: claimNode.position.x + (evIdx % 2) * 120,
              y: claimNode.position.y + 100 + Math.floor(evIdx / 2) * 80,
            },
            data: {
              evidenceId: evidence.id,
              content: evidence.content_text || '',
              sourceType: evidence.source_type || 'unknown',
              selected: selectedNode?.type === 'evidence' && selectedNode.id === evidenceId,
            },
          }
          evidenceNodes.set(evidenceId, node)
          nodes.push(node)

          // Edge from claim to evidence
          edges.push({
            id: `edge-${claimId}-${evidenceId}`,
            source: claimId,
            target: evidenceId,
            type: 'smoothstep',
            style: { stroke: '#9ca3af', strokeWidth: 1 },
            animated: link.support_type === 'undermines',
          })
        }
      })
    })

    // Build convergence nodes (merge point for converging claims)
    // Map claim IDs to lens names for convergence lens counting
    const claimToLensMap = new Map(
      claimArtifacts.map((c: any) => [c.claim_id, c.lens])
    )
    
    const convergenceY = Math.max(...nodes.map(n => n.position.y), 0) + 200
    convergencePoints.forEach((conv: any, idx: number) => {
      const convId = `convergence-${conv.theme_id}`
      const supportingClaims = conv.supporting_claims || []
      
      // Get unique lens names from supporting claims
      const supportingLensNames = new Set<string>()
      supportingClaims.forEach((claimId: string) => {
        const lensName = claimToLensMap.get(claimId) as string | undefined
        if (lensName) supportingLensNames.add(lensName)
      })
      
      const node: Node = {
        id: convId,
        type: 'convergence',
        position: { x: 100 + idx * 300, y: convergenceY },
        data: {
          themeId: conv.theme_id,
          themeLabel: conv.theme_label || 'Unlabeled convergence',
          lensCount: supportingLensNames.size,
          claimCount: supportingClaims.length,
          strength: conv.strength || 0,
          selected: selectedNode?.type === 'convergence' && selectedNode.id === convId,
        },
      }
      nodes.push(node)

      // Edges from converging claims to convergence node
      supportingClaims.slice(0, 5).forEach((claimId: string) => {
        const claimNodeId = `claim-${claimId}`
        if (claimNodes.has(claimId)) {
          edges.push({
            id: `edge-${claimNodeId}-${convId}`,
            source: claimNodeId,
            target: convId,
            type: 'smoothstep',
            style: { stroke: '#10b981', strokeWidth: 2 },
          })
        }
      })
    })

    // Build divergence nodes (opposing positions)
    const divergenceY = convergenceY + 150
    divergencePoints.forEach((div: any, idx: number) => {
      const divId = `divergence-${div.theme_id}`
      const positions = div.positions || []
      
      const node: Node = {
        id: divId,
        type: 'divergence',
        position: { x: 100 + idx * 300, y: divergenceY },
        data: {
          themeId: div.theme_id,
          themeLabel: div.theme_label || 'Unlabeled divergence',
          positionCount: positions.length,
          severity: div.severity || 0,
          selected: selectedNode?.type === 'divergence' && selectedNode.id === divId,
        },
      }
      nodes.push(node)

      // Edges from opposing claims to divergence node
      positions.forEach((pos: any) => {
        const claimIds = pos.claim_ids || []
        claimIds.slice(0, 3).forEach((claimId: string) => {
          const claimNodeId = `claim-${claimId}`
          if (claimNodes.has(claimId)) {
            edges.push({
              id: `edge-${claimNodeId}-${divId}`,
              source: claimNodeId,
              target: divId,
              type: 'smoothstep',
              style: { stroke: '#ef4444', strokeWidth: 2 },
            })
          }
        })
      })
    })

    return { nodes, edges }
  }, [analysis, selectedNode])

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (node.type === 'lens') {
        onNodeSelect({ type: 'lens', id: node.id, lens: node.data.lens })
      } else if (node.type === 'claim') {
        onNodeSelect({ type: 'claim', id: node.id, claimId: node.data.claimId })
      } else if (node.type === 'evidence') {
        onNodeSelect({ type: 'evidence', id: node.id, evidenceId: node.data.evidenceId })
      } else if (node.type === 'convergence') {
        onNodeSelect({ type: 'convergence', id: node.id, themeId: node.data.themeId })
      } else if (node.type === 'divergence') {
        onNodeSelect({ type: 'divergence', id: node.id, themeId: node.data.themeId })
      }
    },
    [onNodeSelect]
  )

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-border">
        <div className="font-mono text-[10px] text-muted uppercase tracking-wider">
          REASONING GRAPH
        </div>
      </div>
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background color="#f3f4f6" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'convergence') return '#10b981'
              if (node.type === 'divergence') return '#ef4444'
              if (node.type === 'lens') return '#6366f1'
              return '#9ca3af'
            }}
            maskColor="rgba(255, 255, 255, 0.8)"
          />
        </ReactFlow>
      </div>
    </div>
  )
}
