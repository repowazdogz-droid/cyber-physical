import type { ArtifactEnvelope } from '../artifact/types.js';

/**
 * Export sealed artifact as JSON string.
 * Preserves _integrity block for verification elsewhere.
 */
export function exportAsJson(envelope: ArtifactEnvelope<unknown>): string {
  return JSON.stringify(envelope, null, 0);
}

/**
 * Export with pretty-printing for human inspection.
 */
export function exportAsJsonPretty(envelope: ArtifactEnvelope<unknown>): string {
  return JSON.stringify(envelope, null, 2);
}
