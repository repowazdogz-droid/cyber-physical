/**
 * UAV Formatters
 * 
 * Human-readable formatters for talk demos.
 * ND-first: short, calm, bounded.
 * 
 * Version: 0.1
 */

import { KernelRunRecord, BoundedTraceNode } from '@spine/kernels/surfaces/learning/KernelSurfaceTypes';
import { UAVPreset } from './presets';

const MAX_CLAIM_LENGTH = 80;
const MAX_TRACE_HIGHLIGHTS = 6;
const MAX_TALK_TRACK_BULLETS = 6;

/**
 * Formats outcome ID to human-readable label and one-liner.
 */
export function formatOutcome(outcomeId: string): { label: string; oneLiner: string } {
  const outcomes: Record<string, { label: string; oneLiner: string }> = {
    'S1': {
      label: 'Continue Mission',
      oneLiner: 'All systems nominal. Safe to continue.'
    },
    'S2': {
      label: 'Prepare Landing',
      oneLiner: 'Conditions degraded. Prepare for landing sequence.'
    },
    'S3': {
      label: 'Execute Landing',
      oneLiner: 'Critical conditions detected. Execute landing now.'
    },
    'S4': {
      label: 'Emergency Landing',
      oneLiner: 'Emergency conditions. Immediate landing required.'
    },
    'DISALLOWED': {
      label: 'Decision Disallowed',
      oneLiner: 'Safety rules prevent this decision.'
    },
    'INDETERMINATE': {
      label: 'Indeterminate',
      oneLiner: 'Unable to determine outcome from available signals.'
    }
  };

  return outcomes[outcomeId] || {
    label: outcomeId,
    oneLiner: 'Decision outcome: ' + outcomeId
  };
}

/**
 * Formats claims to chip-friendly short strings (≤ 80 chars).
 */
export function formatClaims(claims: Array<{ id: string; type: string; text: string }>): string[] {
  return claims
    .slice(0, 6) // Max 6 claims
    .map(claim => {
      let text = claim.text;
      if (text.length > MAX_CLAIM_LENGTH) {
        text = text.substring(0, MAX_CLAIM_LENGTH - 3) + '...';
      }
      return text;
    });
}

/**
 * Picks top trace highlights (≤ 6 nodes) with short title + one sentence.
 */
export function pickTraceHighlights(trace: BoundedTraceNode[]): Array<{ title: string; sentence: string }> {
  // Prioritize Decision and Policy nodes
  const priorityNodes = trace.filter(node => 
    node.type === 'Decision' || node.type === 'Policy'
  );

  // Take top N priority nodes
  const highlights: Array<{ title: string; sentence: string }> = [];
  for (let i = 0; i < Math.min(priorityNodes.length, MAX_TRACE_HIGHLIGHTS); i++) {
    const node = priorityNodes[i];
    highlights.push({
      title: node.label,
      sentence: node.description.length > 150 
        ? node.description.substring(0, 147) + '...' 
        : node.description
    });
  }

  // Fill remaining slots with other nodes if needed
  if (highlights.length < MAX_TRACE_HIGHLIGHTS) {
    const otherNodes = trace.filter(node => 
      node.type !== 'Decision' && node.type !== 'Policy'
    );
    for (let i = 0; i < Math.min(otherNodes.length, MAX_TRACE_HIGHLIGHTS - highlights.length); i++) {
      const node = otherNodes[i];
      highlights.push({
        title: node.label,
        sentence: node.description.length > 150 
          ? node.description.substring(0, 147) + '...' 
          : node.description
      });
    }
  }

  return highlights;
}

/**
 * Builds talk track (4-6 bullet lines you can read aloud).
 */
export function buildTalkTrack(preset: UAVPreset, run: KernelRunRecord): string[] {
  const outcome = formatOutcome(run.decision.outcomeId);
  const bullets: string[] = [];

  // Opening
  bullets.push(`Scenario: ${preset.title}`);
  bullets.push(`What's happening: ${preset.whatHappening}`);

  // Decision
  bullets.push(`Decision: ${outcome.label} — ${outcome.oneLiner}`);

  // Confidence
  bullets.push(`Confidence: ${run.decision.confidence} (based on ${run.claims.length} assurance claims)`);

  // Key reasoning (from trace highlights)
  const highlights = pickTraceHighlights(run.trace);
  if (highlights.length > 0) {
    const topHighlight = highlights[0];
    bullets.push(`Key reasoning: ${topHighlight.sentence}`);
  }

  // Override note (if any)
  if (run.trace.some(node => node.type === 'Override')) {
    bullets.push('Note: Environment or time override applied (safety-first)');
  }

  // Bounded to max bullets
  return bullets.slice(0, MAX_TALK_TRACK_BULLETS);
}




