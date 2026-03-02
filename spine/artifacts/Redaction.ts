/**
 * Redaction
 * 
 * Privacy and internal marker stripping for artifacts.
 * Deterministic, bounded, ND-first.
 * 
 * Version: 1.0.0
 */

import { ArtifactKind } from './ArtifactTypes';
import {
  MAX_STRING_LENGTH,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_EVENTS,
  MAX_THOUGHT_OBJECTS,
  MAX_TRACE_NODES,
  MAX_CLAIMS,
  MAX_POLICY_NOTES,
  MAX_REDACTIONS
} from './ArtifactBounds';

/**
 * RedactionResult: Result of redaction process.
 */
export interface RedactionResult {
  /** Redacted payload */
  payload: any;
  /** Redactions applied (bounded, max 10) */
  redactionsApplied: string[];
}

/**
 * Strips internal/system markers from strings.
 */
function stripInternalMarkers(text: string): string {
  if (typeof text !== 'string') return text;
  
  // Remove internal/system markers
  let cleaned = text
    .replace(/internal/gi, '')
    .replace(/system/gi, '')
    .replace(/debug/gi, '')
    .replace(/\[INTERNAL\]/gi, '')
    .replace(/\[SYSTEM\]/gi, '')
    .trim();
  
  return cleaned;
}

/**
 * Bounds a string to max length.
 */
function boundString(text: string, maxLen: number): string {
  if (typeof text !== 'string') return text;
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + '...';
}

/**
 * Bounds an array to max length.
 */
function boundArray<T>(arr: T[], maxLen: number): T[] {
  if (!Array.isArray(arr)) return arr;
  return arr.slice(0, maxLen);
}

/**
 * Applies redactions to an artifact payload.
 */
export function applyRedactions(
  kind: ArtifactKind,
  payload: any,
  context?: {
    learnerId?: string;
    sessionId?: string;
    isMinor?: boolean;
  }
): RedactionResult {
  const redactionsApplied: string[] = [];
  let redacted = JSON.parse(JSON.stringify(payload)); // Deep clone

  // Strip internal markers from all strings
  const stripRecursive = (obj: any): any => {
    if (typeof obj === 'string') {
      const original = obj;
      const cleaned = stripInternalMarkers(obj);
      if (cleaned !== original) {
        if (!redactionsApplied.includes('internal_markers')) {
          redactionsApplied.push('internal_markers');
        }
      }
      return cleaned;
    }
    if (Array.isArray(obj)) {
      return obj.map(stripRecursive);
    }
    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip internal/system keys
        if (key.toLowerCase().includes('internal') || key.toLowerCase().includes('system')) {
          if (!redactionsApplied.includes('internal_keys')) {
            redactionsApplied.push('internal_keys');
          }
          continue;
        }
        result[key] = stripRecursive(value);
      }
      return result;
    }
    return obj;
  };

  redacted = stripRecursive(redacted);

  // Kind-specific redactions
  switch (kind) {
    case ArtifactKind.XR_BUNDLE:
    case ArtifactKind.SESSION_RECAP:
      // Bound events
      if (redacted.events && Array.isArray(redacted.events)) {
        if (redacted.events.length > MAX_EVENTS) {
          redacted.events = boundArray(redacted.events, MAX_EVENTS);
          if (!redactionsApplied.includes('events_bounded')) {
            redactionsApplied.push('events_bounded');
          }
        }
      }
      // Bound thought objects
      if (redacted.thoughtObjects && Array.isArray(redacted.thoughtObjects)) {
        if (redacted.thoughtObjects.length > MAX_THOUGHT_OBJECTS) {
          redacted.thoughtObjects = boundArray(redacted.thoughtObjects, MAX_THOUGHT_OBJECTS);
          if (!redactionsApplied.includes('thought_objects_bounded')) {
            redactionsApplied.push('thought_objects_bounded');
          }
        }
      }
      // Remove raw learner identifiers (keep hash)
      if (redacted.meta && redacted.meta.learnerId && !redacted.meta.learnerIdHash) {
        delete redacted.meta.learnerId;
        if (!redactionsApplied.includes('learner_id_removed')) {
          redactionsApplied.push('learner_id_removed');
        }
      }
      // Remove presence/network traces
      if (redacted.presence) {
        delete redacted.presence;
        if (!redactionsApplied.includes('presence_removed')) {
          redactionsApplied.push('presence_removed');
        }
      }
      if (redacted.network) {
        delete redacted.network;
        if (!redactionsApplied.includes('network_removed')) {
          redactionsApplied.push('network_removed');
        }
      }
      break;

    case ArtifactKind.KERNEL_RUN:
    case ArtifactKind.ORCHESTRATOR_RUN:
      // Bound trace nodes
      if (redacted.trace && redacted.trace.nodes && Array.isArray(redacted.trace.nodes)) {
        if (redacted.trace.nodes.length > MAX_TRACE_NODES) {
          redacted.trace.nodes = boundArray(redacted.trace.nodes, MAX_TRACE_NODES);
          if (!redactionsApplied.includes('trace_nodes_bounded')) {
            redactionsApplied.push('trace_nodes_bounded');
          }
        }
      }
      // Bound claims
      if (redacted.claims && Array.isArray(redacted.claims)) {
        if (redacted.claims.length > MAX_CLAIMS) {
          redacted.claims = boundArray(redacted.claims, MAX_CLAIMS);
          if (!redactionsApplied.includes('claims_bounded')) {
            redactionsApplied.push('claims_bounded');
          }
        }
      }
      // Bound policy notes
      if (redacted.policyNotes && Array.isArray(redacted.policyNotes)) {
        if (redacted.policyNotes.length > MAX_POLICY_NOTES) {
          redacted.policyNotes = boundArray(redacted.policyNotes, MAX_POLICY_NOTES);
          if (!redactionsApplied.includes('policy_notes_bounded')) {
            redactionsApplied.push('policy_notes_bounded');
          }
        }
      }
      // Bound string fields
      if (redacted.decision) {
        if (redacted.decision.label) {
          redacted.decision.label = boundString(redacted.decision.label, MAX_TITLE_LENGTH);
        }
        if (redacted.decision.rationale) {
          redacted.decision.rationale = boundString(redacted.decision.rationale, MAX_DESCRIPTION_LENGTH);
        }
      }
      break;

    case ArtifactKind.TEACHER_RECAP:
      // Apply same bounds as SESSION_RECAP
      if (redacted.events && Array.isArray(redacted.events)) {
        if (redacted.events.length > MAX_EVENTS) {
          redacted.events = boundArray(redacted.events, MAX_EVENTS);
          if (!redactionsApplied.includes('events_bounded')) {
            redactionsApplied.push('events_bounded');
          }
        }
      }
      // Remove scoring-like fields
      const scoringFields = ['score', 'grade', 'points', 'rating', 'rank'];
      const removeScoring = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(removeScoring);
        }
        if (obj && typeof obj === 'object') {
          const result: any = {};
          for (const [key, value] of Object.entries(obj)) {
            if (scoringFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
              if (!redactionsApplied.includes('scoring_fields_removed')) {
                redactionsApplied.push('scoring_fields_removed');
              }
              continue;
            }
            result[key] = removeScoring(value);
          }
          return result;
        }
        return obj;
      };
      redacted = removeScoring(redacted);
      break;

    case ArtifactKind.CONTACT_INQUIRY:
      // Bound string fields
      if (redacted.name && typeof redacted.name === 'string') {
        redacted.name = boundString(redacted.name, MAX_TITLE_LENGTH);
      }
      if (redacted.email && typeof redacted.email === 'string') {
        redacted.email = boundString(redacted.email, MAX_TITLE_LENGTH);
      }
      if (redacted.org && typeof redacted.org === 'string') {
        redacted.org = boundString(redacted.org, MAX_TITLE_LENGTH);
      }
      if (redacted.message && typeof redacted.message === 'string') {
        redacted.message = boundString(redacted.message, MAX_STRING_LENGTH);
      }
      // Bound domain tags
      if (redacted.domainTags && Array.isArray(redacted.domainTags)) {
        redacted.domainTags = boundArray(
          redacted.domainTags.map((tag: any) => 
            typeof tag === 'string' ? boundString(tag, MAX_TITLE_LENGTH) : tag
          ),
          8
        );
      }
      break;

    case ArtifactKind.LLM_RUN:
    case ArtifactKind.OMEGA_COMPARE:
      // LLM runs: no redaction needed (already bounded, no PII)
      break;
  }

  // Bound redactions list
  const boundedRedactions = redactionsApplied.slice(0, MAX_REDACTIONS);

  return {
    payload: redacted,
    redactionsApplied: boundedRedactions
  };
}


