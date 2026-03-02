import type { Determination } from "../data/determinations";
import { head, masthead, footer, foot } from "../partials/chrome";
import { renderMetaBlock, renderDocFooter } from "../partials/recordBlocks";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return c;
    }
  });
}

export function renderDeterminationPDF(opts: {
  d: Determination;
  bodyHtml: string;
}): string {
  const { d, bodyHtml } = opts;

  return (
    head(`${d.docId} (PDF) — OMEGA-F`) +
    `<div class="shell"><div class="content">` +
    masthead() +
    `<header class="pageHead noPrintNav">
      <div class="kicker">PDF · Print</div>
      <h1>${esc(d.docId)}</h1>
      <p class="lede">Use your browser's Print dialog to "Save as PDF".</p>
      <p class="muted small">Tip: turn off headers/footers in the print dialog for a clean page.</p>
      <div class="actions">
        <button type="button" onclick="window.print()">Print / Save as PDF</button>
        <a class="btn ghost" href="${d.permalink}">Back to HTML</a>
      </div>
    </header>

    <article class="doc paper">
      ${renderMetaBlock(d)}
      <h2 class="docTitle">${esc(d.systemTitle)}</h2>
      ${bodyHtml}
      ${renderDocFooter(d)}
    </article>
    ` +
    footer() +
    `</div></div>` +
    foot()
  );
}

