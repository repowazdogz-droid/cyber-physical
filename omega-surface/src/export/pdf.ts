import type { ArtifactEnvelope } from '../artifact/types.js';

/**
 * Export sealed artifact as PDF.
 * Stub — implement later (e.g. jsPDF, puppeteer, or server-side).
 */
export function exportAsPdf(_envelope: ArtifactEnvelope<unknown>): Promise<string> {
  return Promise.resolve(
    '[PDF export not implemented — use exportAsJson or exportAsHtml]'
  );
}
