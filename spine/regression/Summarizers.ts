/**
 * Summarizers
 * 
 * Canonical summarizers for kernel runs, orchestrator runs, and recaps.
 * Single source of truth for explainable summaries.
 * Order-stable and bounded.
 * 
 * Version: 1.0.0
 */

import { Summary, MAX_FIELD_LENGTH } from './RegressionTypes';
import { ArtifactBundle } from '../artifacts/ArtifactTypes';

/**
 * Bounds a string to max length.
 */
function boundString(text: string, maxLen: number): string {
  if (typeof text !== 'string') return String(text);
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + '...';
}

/**
 * Bounds an array to max length.
 */
function boundArray<T>(arr: T[], maxLen: number): T[] {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, maxLen);
}

/**
 * Summarizes a kernel run.
 * Accepts any object with decision, trace, and policyNotes fields.
 */
export function summarizeKernelRun(run: any): Summary {
  // Outcome summary
  const outcome = boundString(
    `${run.decision.outcome} (${run.decision.confidence})`,
    MAX_FIELD_LENGTH
  );

  // Claim IDs (bounded, max 20)
  const claimIds = boundArray(
    run.trace.claims.map((c: any) => c.claimId),
    20
  ).sort(); // Stable ordering

  // Policy notes (bounded, max 10, each max 200 chars)
  const policyNotes = boundArray(
    (run.policyNotes || []).map((note: any) => boundString(note, MAX_FIELD_LENGTH)),
    10
  );

  // Highlights from trace nodes (bounded, max 12, each max 200 chars)
  const highlights = boundArray(
    run.trace.nodes
      .filter((node: any) => node.type === 'decision' || node.type === 'override' || node.type === 'disallow')
      .map((node: any) => boundString(`${node.label}: ${node.description || ''}`, MAX_FIELD_LENGTH)),
    12
  );

  return {
    outcome,
    claimIds: claimIds as string[],
    policyNotes: policyNotes as string[],
    highlights: highlights as string[]
  };
}

/**
 * Summarizes an orchestrator run.
 * Accepts any object with terminalOutcome, nodes, summaryClaims, policyNotes, and boundedTraceHighlights fields.
 */
export function summarizeOrchestratorRun(run: any): Summary {
  // Outcome summary
  const outcome = boundString(
    `${run.terminalOutcome || 'No terminal outcome'} (${run.nodes.length} nodes)`,
    MAX_FIELD_LENGTH
  );

  // Claim IDs from summary claims (bounded, max 20)
  const claimIds = boundArray(
    run.summaryClaims.map((c: any) => c.claimId || c.title),
    20
  ).sort(); // Stable ordering

  // Policy notes (bounded, max 10, each max 200 chars)
  const policyNotes = boundArray(
    (run.policyNotes || []).map((note: any) => boundString(note, MAX_FIELD_LENGTH)),
    10
  );

  // Highlights from trace highlights (bounded, max 12, each max 200 chars)
  const highlights = boundArray(
    run.boundedTraceHighlights.map((h: any) => boundString(`${h.label}: ${h.description || ''}`, MAX_FIELD_LENGTH)),
    12
  );

  return {
    outcome,
    claimIds: claimIds as string[],
    policyNotes: policyNotes as string[],
    highlights: highlights as string[]
  };
}

/**
 * Summarizes a recap bundle.
 */
export function summarizeRecap(bundle: ArtifactBundle): Summary {
  const payloads = bundle.payloads;
  const manifest = bundle.manifest;

  // Outcome summary: timeline labels, pinned IDs, explain-back IDs
  const timelineLabels: string[] = [];
  const pinnedIds: string[] = [];
  const explainBackIds: string[] = [];

  // Extract from sessionlog
  if (payloads.sessionlog && Array.isArray(payloads.sessionlog.events)) {
    payloads.sessionlog.events.slice(0, 20).forEach((event: any) => {
      if (event.type && typeof event.type === 'string') {
        timelineLabels.push(event.type);
      }
    });
  }

  // Extract from learningBoard
  if (payloads.learningBoard) {
    if (Array.isArray(payloads.learningBoard.pinnedIds)) {
      pinnedIds.push(...payloads.learningBoard.pinnedIds.slice(0, 20));
    }
    if (Array.isArray(payloads.learningBoard.customOrderIds)) {
      explainBackIds.push(...payloads.learningBoard.customOrderIds.slice(0, 20));
    }
  }

  // Extract from thoughtObjects
  if (Array.isArray(payloads.thoughtObjects)) {
    payloads.thoughtObjects.slice(0, 20).forEach((obj: any) => {
      if (obj.id) {
        explainBackIds.push(obj.id);
      }
    });
  }

  const outcome = boundString(
    `Timeline: ${timelineLabels.length} events, Pinned: ${pinnedIds.length}, Explain-back: ${explainBackIds.length}`,
    MAX_FIELD_LENGTH
  );

  // Claim IDs: use thought object IDs (bounded, max 20)
  const claimIds = boundArray(
    [...new Set([...pinnedIds, ...explainBackIds])],
    20
  ).sort(); // Stable ordering

  // Policy notes: none for recap
  const policyNotes: string[] = [];

  // Highlights: timeline event types (bounded, max 12, each max 200 chars)
  const highlights = boundArray(
    timelineLabels.map(label => boundString(label, MAX_FIELD_LENGTH)),
    12
  );

  // Include manifest hash and file hashes
  const fileHashes = manifest.files.map(f => ({
    name: f.name,
    sha256: f.sha256
  }));

  return {
    outcome,
    claimIds,
    policyNotes,
    highlights,
    manifestHash: manifest.rootSha256,
    fileHashes
  };
}

