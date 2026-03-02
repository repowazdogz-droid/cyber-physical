/**
 * OrchestratorToThoughtObjects: Converts OrchestratorRun to ThoughtObjects.
 * ND-calm, bounded, deterministic.
 * 
 * Version: 1.0.0
 */

import { OrchestratorRun } from '../../../orchestrator/OrchestratorTypes';
import { ThoughtObject } from '../../../../app/learning/board/ThoughtObjects';
import { hashString } from '../../../learning/platform/session/hash';

const MAX_THOUGHT_OBJECTS = 10;

/**
 * Converts OrchestratorRun to ThoughtObjects.
 * Deterministic ordering, bounded output (max 10 objects).
 */
export function orchestratorToThoughtObjects(run: OrchestratorRun): ThoughtObject[] {
  const objects: ThoughtObject[] = [];
  const baseId = hashString(`${run.graphId}-${run.startedAtIso}`);

  // 1. Decision Summary (1 object)
  objects.push({
    id: `${baseId}_summary`,
    type: 'Reflection' as any,
    content: {
      title: `Graph Outcome: ${run.terminalOutcome}`,
      body: `Graph "${run.graphId}" completed with ${run.nodes.length} nodes. Terminal outcome: ${run.terminalOutcome}.`
    },
    source: 'system' as any,
    timestamp: run.startedAtIso,
    confidence: 'medium' as any
  });

  // 2. Critical Claims (up to 3)
  const criticalClaims = run.summaryClaims
    .filter(c => c.severity === 'critical')
    .slice(0, 3);
  
  for (let i = 0; i < criticalClaims.length && objects.length < MAX_THOUGHT_OBJECTS; i++) {
    const claim = criticalClaims[i];
    objects.push({
      id: `${baseId}_claim_${i}`,
      type: 'Evidence' as any,
      content: {
        title: `Critical: ${claim.title}`,
        body: `This claim appeared ${claim.count} time${claim.count > 1 ? 's' : ''} across the graph.`
      },
      source: 'system' as any,
      timestamp: run.startedAtIso,
      confidence: 'high' as any
    });
  }

  // 3. Policy Notes (up to 3)
  const topPolicyNotes = run.policyNotes.slice(0, 3);
  for (let i = 0; i < topPolicyNotes.length && objects.length < MAX_THOUGHT_OBJECTS; i++) {
    const note = topPolicyNotes[i];
    objects.push({
      id: `${baseId}_policy_${i}`,
      type: 'TutorHint' as any,
      content: truncate(note, 200),
      source: 'system' as any,
      timestamp: run.startedAtIso,
      confidence: 'medium' as any
    });
  }

  // 4. Reasoning Highlights (up to 3)
  const topHighlights = run.boundedTraceHighlights
    .filter(h => h.type === 'override' || h.type === 'disallow' || h.type === 'decision')
    .slice(0, 3);
  
  for (let i = 0; i < topHighlights.length && objects.length < MAX_THOUGHT_OBJECTS; i++) {
    const highlight = topHighlights[i];
    objects.push({
      id: `${baseId}_highlight_${i}`,
      type: 'Evidence' as any,
      content: {
        title: `${highlight.type}: ${highlight.label}`,
        body: truncate(highlight.description, 200)
      },
      source: 'system' as any,
      timestamp: run.startedAtIso,
      confidence: 'medium' as any
    });
  }

  return objects;
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








































