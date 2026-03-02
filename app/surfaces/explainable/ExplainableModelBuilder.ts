/**
 * Explainable Model Builder
 * 
 * Pure deterministic builders for explainable display models.
 * Uses claim registry, normalizes strings, deterministic ordering.
 * 
 * Version: 1.0.0
 */

import {
  ExplainableDisplayModel,
  ExplainableOutcomeCardModel,
  ExplainableClaimChipModel,
  ExplainableReasoningItemModel,
  ExplainablePolicyNoteModel,
  ExplainableTalkTrackModel,
  ExplainableModelOptions
} from './ExplainableTypes';
import { KernelRunRecord } from '@spine/kernels/surfaces/learning/KernelSurfaceTypes';
import { OrchestratorRun } from '@spine/orchestrator/OrchestratorTypes';
import { getClaimDescriptor, listClaims } from '@spine/claims/ClaimRegistry';
import { hashString } from '@spine/learning/platform/session/hash';

/**
 * Builds display model from KernelRunRecord.
 */
export function buildFromKernelRun(
  run: KernelRunRecord,
  opts: ExplainableModelOptions = {}
): ExplainableDisplayModel {
  const {
    calmMode = true,
    audience = 'demo',
    includeReasoning = true,
    includeTalkTrack = false
  } = opts;

  // Build outcome card
  const outcome: ExplainableOutcomeCardModel = {
    label: boundString(run.decision.label || run.decision.outcomeId, 60),
    subtitle: boundString(run.decision.rationale, 120),
    confidence: run.decision.confidence as any
  };

  // Build claim chips (max 8)
  const claimChips = buildClaimChips(run.claims).slice(0, 8);

  // Build policy notes (empty for kernel runs, max 3)
  const policyNotes: ExplainablePolicyNoteModel[] = [];

  // Build reasoning items (max 12)
  const reasoningItems: ExplainableReasoningItemModel[] = includeReasoning
    ? buildReasoningItems(run.trace, 'kernel').slice(0, 12)
    : [];

  // Build talk track (optional, max 6 bullets)
  const talkTrack: ExplainableTalkTrackModel | undefined = includeTalkTrack
    ? buildTalkTrack(run, audience)
    : undefined;

  return {
    outcome,
    claimChips,
    policyNotes,
    reasoningItems,
    talkTrack
  };
}

/**
 * Builds display model from OrchestratorRun.
 */
export function buildFromOrchestratorRun(
  run: OrchestratorRun,
  opts: ExplainableModelOptions = {}
): ExplainableDisplayModel {
  const {
    calmMode = true,
    audience = 'demo',
    includeReasoning = true,
    includeTalkTrack = false
  } = opts;

  // Build outcome card
  const nodeCount = run.nodes?.length || 0;
  const outcome: ExplainableOutcomeCardModel = {
    label: boundString(run.terminalOutcome, 60),
    subtitle: `Graph "${run.graphId}" completed with ${nodeCount} node${nodeCount !== 1 ? 's' : ''}`,
    terminalNodeId: run.terminalNodeId
  };

  // Build claim chips from summary claims (max 8)
  const claimChips = buildClaimChipsFromOrchestratorClaims(run.summaryClaims).slice(0, 8);

  // Build policy notes (max 3)
  const policyNotes: ExplainablePolicyNoteModel[] = run.policyNotes
    .slice(0, 3)
    .map((note, idx) => ({
      id: hashString(`policy_note_${idx}_${note}`),
      text: boundString(note, 150)
    }));

  // Build reasoning items from trace highlights (max 12)
  const reasoningItems: ExplainableReasoningItemModel[] = includeReasoning
    ? buildReasoningItemsFromHighlights(run.boundedTraceHighlights).slice(0, 12)
    : [];

  // Build talk track (optional, max 6 bullets)
  const talkTrack: ExplainableTalkTrackModel | undefined = includeTalkTrack
    ? buildTalkTrackFromOrchestrator(run, audience)
    : undefined;

  return {
    outcome,
    claimChips,
    policyNotes,
    reasoningItems,
    talkTrack
  };
}

/**
 * Builds claim chips from kernel run claims.
 */
function buildClaimChips(claims: KernelRunRecord['claims']): ExplainableClaimChipModel[] {
  const chips: ExplainableClaimChipModel[] = [];

  for (const claim of claims) {
    // Try to get claim descriptor from registry
    const claimDescriptors = listClaims();
    const matchingDescriptor = claimDescriptors.find(desc =>
      desc.type === claim.type || desc.title.toLowerCase().includes(claim.text.toLowerCase().substring(0, 20))
    );

    const text = matchingDescriptor?.title || boundString(claim.text, 80);
    const severity = matchingDescriptor?.severity || 'info';

    chips.push({
      id: claim.id,
      text: boundString(text, 80),
      severity: severity as any
    });
  }

  // Sort by severity (critical > warn > info), then by id
  return stableSortChips(chips);
}

/**
 * Builds claim chips from orchestrator summary claims.
 */
function buildClaimChipsFromOrchestratorClaims(
  summaryClaims: OrchestratorRun['summaryClaims']
): ExplainableClaimChipModel[] {
  const chips: ExplainableClaimChipModel[] = [];

  for (const claim of summaryClaims) {
    // Try to get claim descriptor from registry (for better labels)
    const descriptor = getClaimDescriptor(claim.claimId as any);
    const text = descriptor?.title || claim.title || boundString(claim.claimId, 80);
    const severity = descriptor?.severity || claim.severity || 'info';

    chips.push({
      id: claim.claimId,
      text: boundString(text, 80),
      severity: severity as any
    });
  }

  // Sort by severity (critical > warn > info), then by id
  return stableSortChips(chips);
}

/**
 * Builds reasoning items from kernel trace.
 */
function buildReasoningItems(
  trace: KernelRunRecord['trace'],
  mode: 'kernel' | 'orchestrator'
): ExplainableReasoningItemModel[] {
  const items: ExplainableReasoningItemModel[] = [];

  // Prioritize Decision, Policy, Override nodes
  const priorityNodes = trace.filter(node =>
    node.type === 'Decision' || node.type === 'Policy' || node.type === 'Override'
  );

  for (const node of priorityNodes) {
    const priority = node.type === 'Override' ? 100 :
                     node.type === 'Decision' ? 80 :
                     node.type === 'Policy' ? 70 : 50;

    items.push({
      id: node.id,
      title: boundString(safeLabel(node.label), 100),
      sentence: boundString(safeLabel(node.description), 200),
      type: node.type.toLowerCase() as any,
      priority
    });
  }

  // Sort by priority (descending), then by id
  return stableSortReasoningItems(items);
}

/**
 * Builds reasoning items from orchestrator trace highlights.
 */
function buildReasoningItemsFromHighlights(
  highlights: OrchestratorRun['boundedTraceHighlights']
): ExplainableReasoningItemModel[] {
  const items: ExplainableReasoningItemModel[] = [];

  for (const highlight of highlights) {
    const priority = highlight.type === 'override' ? 100 :
                     highlight.type === 'disallow' ? 95 :
                     highlight.type === 'decision' ? 80 :
                     highlight.type === 'claim' ? 70 : 50;

    items.push({
      id: hashString(`${highlight.nodeId}_${highlight.label}`),
      title: boundString(safeLabel(highlight.label), 100),
      sentence: boundString(safeLabel(highlight.description), 200),
      type: highlight.type,
      priority
    });
  }

  // Sort by priority (descending), then by id
  return stableSortReasoningItems(items);
}

/**
 * Builds talk track from kernel run.
 */
function buildTalkTrack(
  run: KernelRunRecord,
  audience: "learner" | "teacher" | "demo"
): ExplainableTalkTrackModel {
  const bullets: string[] = [];

  // Outcome
  bullets.push(`Decision: ${run.decision.label || run.decision.outcomeId}`);

  // Rationale
  if (run.decision.rationale) {
    bullets.push(boundString(run.decision.rationale, 200));
  }

  // Top claims (max 2)
  for (const claim of run.claims.slice(0, 2)) {
    bullets.push(boundString(`Claim: ${claim.text}`, 200));
  }

  // Top trace highlights (max 2)
  for (const node of run.trace.slice(0, 2)) {
    bullets.push(boundString(`${node.label}: ${node.description}`, 200));
  }

  return {
    bullets: bullets.slice(0, 6), // Max 6
    audience
  };
}

/**
 * Builds talk track from orchestrator run.
 */
function buildTalkTrackFromOrchestrator(
  run: OrchestratorRun,
  audience: "learner" | "teacher" | "demo"
): ExplainableTalkTrackModel {
  const bullets: string[] = [];
  const nodeCount = (run as any).nodeRunIds?.length || run.nodes?.length || 0;

  // Outcome
  bullets.push(`Graph outcome: ${run.terminalOutcome}`);

  // Node count
  bullets.push(`Processed ${nodeCount} node${nodeCount !== 1 ? 's' : ''} in dependency order`);

  // Top claims (max 2)
  for (const claim of run.summaryClaims.slice(0, 2)) {
    const descriptor = getClaimDescriptor(claim.claimId as any);
    const title = descriptor?.title || claim.title || claim.claimId;
    bullets.push(boundString(title, 200));
  }

  // Top reasoning highlights (max 2)
  for (const highlight of run.boundedTraceHighlights.slice(0, 2)) {
    bullets.push(boundString(`${highlight.label}: ${highlight.description}`, 200));
  }

  return {
    bullets: bullets.slice(0, 6), // Max 6
    audience
  };
}

/**
 * Stable sort claim chips (severity > id).
 */
function stableSortChips(chips: ExplainableClaimChipModel[]): ExplainableClaimChipModel[] {
  const severityOrder = { critical: 3, warn: 2, info: 1 };
  return [...chips].sort((a, b) => {
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Stable sort reasoning items (priority > id).
 */
function stableSortReasoningItems(items: ExplainableReasoningItemModel[]): ExplainableReasoningItemModel[] {
  return [...items].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.id.localeCompare(b.id);
  });
}

/**
 * Bounds string to max length.
 */
function boundString(s: string, maxLen: number): string {
  if (s.length <= maxLen) {
    return s;
  }
  return s.substring(0, maxLen - 3) + '...';
}

/**
 * Strips internal/system markers from label.
 */
function safeLabel(s: string): string {
  return s
    .replace(/internal/gi, '')
    .replace(/system/gi, '')
    .replace(/debug/gi, '')
    .trim();
}

