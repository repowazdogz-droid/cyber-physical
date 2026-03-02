/**
 * LLM Payload Builder
 * 
 * Builds bounded payloads from ExplainableDisplayModel for LLM explain requests.
 * Ensures payloads are safe and bounded before sending to LLM.
 * 
 * Version: 1.0.0
 */

import { ExplainableDisplayModel } from './ExplainableTypes';
import { boundString } from '../../../spine/llm/LLMOutputBounds';

/**
 * Builds a bounded payload for kernel/orchestrator run explanation.
 */
export function buildExplainablePayload(model: ExplainableDisplayModel): {
  outcome: { id: string; label: string; subtitle: string };
  claims: Array<{ id: string; text: string; severity: string }>;
  policyNotes: string[];
  reasoningHighlights: Array<{ title: string; sentence: string }>;
} {
  return {
    outcome: {
      id: model.outcome.label.substring(0, 50),
      label: boundString(model.outcome.label, 60),
      subtitle: boundString(model.outcome.subtitle, 120)
    },
    claims: model.claimChips
      .slice(0, 8) // Max 8 claims
      .map(claim => ({
        id: claim.id,
        text: boundString(claim.text, 80),
        severity: claim.severity
      })),
    policyNotes: model.policyNotes
      .slice(0, 3) // Max 3 policy notes
      .map(note => boundString(note.text, 150)),
    reasoningHighlights: model.reasoningItems
      .slice(0, 6) // Max 6 highlights
      .map(item => ({
        title: boundString(item.title, 100),
        sentence: boundString(item.sentence, 200)
      }))
  };
}

/**
 * Builds a bounded payload for regression diff explanation.
 */
export function buildRegressionDiffPayload(diffSummary: {
  label?: string;
  criticalCount?: number;
  warnCount?: number;
  topChanged?: Array<{ severity: string; path: string; message: string }>;
}): {
  label?: string;
  criticalCount?: number;
  warnCount?: number;
  topChanged?: Array<{ severity: string; path: string; message: string }>;
} {
  return {
    label: diffSummary.label ? boundString(diffSummary.label, 100) : undefined,
    criticalCount: diffSummary.criticalCount,
    warnCount: diffSummary.warnCount,
    topChanged: diffSummary.topChanged
      ?.slice(0, 8) // Max 8 findings
      .map(finding => ({
        severity: finding.severity,
        path: boundString(finding.path, 100),
        message: boundString(finding.message, 200)
      }))
  };
}







































