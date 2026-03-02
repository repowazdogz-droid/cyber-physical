/**
 * Trace Highlighting
 * 
 * Pure helpers to select trace highlights deterministically.
 * Prefers: overrides, disallows, outcome decisions, critical claims.
 * 
 * Version: 1.0.0
 */

import { OrchestratorNodeResult } from './OrchestratorTypes';
import { KernelRunRecord } from '../kernels/surfaces/learning/KernelSurfaceTypes';

/**
 * Trace Highlight: Single highlight from a node trace.
 */
export interface TraceHighlight {
  /** Node ID */
  nodeId: string;
  /** Label (max 100 chars) */
  label: string;
  /** Description (max 200 chars) */
  description: string;
  /** Highlight type */
  type: "override" | "disallow" | "decision" | "claim";
  /** Priority (higher = more important, 0-100) */
  priority: number;
}

/**
 * Extracts trace highlights from node results.
 * Deterministic ordering, bounded to max 12.
 */
export function extractTraceHighlights(
  nodeResults: OrchestratorNodeResult[],
  maxHighlights: number = 12
): TraceHighlight[] {
  const highlights: TraceHighlight[] = [];

  for (const nodeResult of nodeResults) {
    const { nodeId, runRecord } = nodeResult;

    // 1. Check for overrides (priority 100)
    if (runRecord.decision.rationale.toLowerCase().includes('override')) {
      highlights.push({
        nodeId,
        label: `Override: ${runRecord.decision.outcomeId}`,
        description: truncate(runRecord.decision.rationale, 200),
        type: "override",
        priority: 100
      });
    }

    // 2. Check for disallows (priority 95)
    if (runRecord.decision.outcomeId === 'DISALLOWED' || runRecord.decision.outcomeId === 'REFUSE_TO_DECIDE') {
      highlights.push({
        nodeId,
        label: `Disallowed: ${runRecord.decision.label}`,
        description: truncate(runRecord.decision.rationale, 200),
        type: "disallow",
        priority: 95
      });
    }

    // 3. Check for critical claims (priority 90)
    const criticalClaims = runRecord.claims.filter(c => 
      c.type.toLowerCase().includes('safety') || 
      c.text.toLowerCase().includes('critical') ||
      c.text.toLowerCase().includes('emergency')
    );
    for (const claim of criticalClaims.slice(0, 2)) { // Max 2 per node
      highlights.push({
        nodeId,
        label: `Critical Claim: ${claim.type}`,
        description: truncate(claim.text, 200),
        type: "claim",
        priority: 90
      });
    }

    // 4. Decision outcomes (priority 80)
    if (runRecord.decision.outcomeId && 
        runRecord.decision.outcomeId !== 'DISALLOWED' && 
        runRecord.decision.outcomeId !== 'REFUSE_TO_DECIDE') {
      highlights.push({
        nodeId,
        label: `Decision: ${runRecord.decision.outcomeId}`,
        description: truncate(runRecord.decision.rationale, 200),
        type: "decision",
        priority: 80
      });
    }

    // 5. Trace node highlights (priority 70)
    const importantTraceNodes = runRecord.trace.filter(node =>
      node.type === 'Decision' || node.type === 'Policy' || node.type === 'Override'
    );
    for (const node of importantTraceNodes.slice(0, 1)) { // Max 1 per node
      highlights.push({
        nodeId,
        label: truncate(node.label, 100),
        description: truncate(node.description, 200),
        type: "decision",
        priority: 70
      });
    }
  }

  // Sort by priority (descending), then by nodeId (deterministic)
  highlights.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.nodeId.localeCompare(b.nodeId);
  });

  // Return top N (bounded)
  return highlights.slice(0, maxHighlights);
}

/**
 * Truncates text to max length.
 */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) {
    return text;
  }
  return text.substring(0, maxLen - 3) + '...';
}








































