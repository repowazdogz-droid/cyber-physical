import type { Determination } from "../data/determinations";
import type { DeterminationText } from "../data/determinationTexts";
import { renderMetaBlock, renderDocFooter } from "../partials/recordBlocks";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatIsoDate(iso: string): string {
  // iso: "2026-01-05"
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${String(d).padStart(2, "0")} ${months[(m || 1) - 1]} ${y}`;
}

export function renderDetH1(text: DeterminationText): string {
  return `<h1 class="docTitle">${esc(text.systemTitle)}</h1>`;
}

export function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// renderDetMeta is deprecated - use renderMetaBlock from recordBlocks instead
export function renderDetMeta(rec: Determination, _text: DeterminationText): string {
  return renderMetaBlock(rec);
}

export function renderDetSectionsHtml(text: DeterminationText): string {
  const detParas = text.determination
    .map((p) => `<p>${esc(p)}</p>`)
    .join("");

  const sections = text.sections
    .map((s) => {
      const paras = (s.paras ?? []).map((p) => `<p>${esc(p)}</p>`).join("");
      const bullets =
        s.bullets && s.bullets.length
          ? `<ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`
          : "";
      return `<section class="section">
        <h2>${esc(s.heading)}</h2>
        ${paras}${bullets}
      </section>`;
    })
    .join("");

  return `
  <section class="section">
    <h2>Determination</h2>
    ${detParas}
  </section>
  ${sections}
  `;
}

// renderDetFooterHtml is deprecated - use renderDocFooter from recordBlocks instead
export function renderDetFooterHtml(rec: Determination, _text: DeterminationText): string {
  return renderDocFooter(rec);
}

export function renderDeterminationHtml(rec: Determination, text: DeterminationText): string {
  return `
  ${renderDetMeta(rec, text)}
  ${renderDetH1(text)}
  ${renderDetSectionsHtml(text)}
  ${renderDetFooterHtml(rec, text)}
  `;
}

export function renderDeterminationPlain(rec: Determination, text: DeterminationText): string {
  const lines: string[] = [];
  lines.push(`OMEGA-F DETERMINATION No. ${rec.id}`);
  lines.push(`Classification: ${rec.classification}`);
  lines.push(`System Type: ${rec.systemType}`);
  lines.push(`Assessment Date: ${formatIsoDate(rec.assessmentDate)}`);
  lines.push(`Status: ${rec.status}${rec.supersedes ? ` · Supersedes: ${rec.supersedes}` : " · Supersedes: None"}${rec.supersededBy ? ` · Superseded by: ${rec.supersededBy}` : ""}`);
  lines.push("");
  lines.push(text.systemTitle);
  lines.push("");
  lines.push("Determination");
  lines.push(...text.determination);
  lines.push("");

  for (const s of text.sections) {
    lines.push(s.heading.toUpperCase());
    if (s.paras?.length) {
      for (const p of s.paras) lines.push(p);
    }
    if (s.bullets?.length) {
      for (const b of s.bullets) lines.push(`- ${b}`);
    }
    lines.push("");
  }

  lines.push(`Document ID: ${text.docId}`);
  lines.push(`Permanent URL: ${rec.permalink}`);
  lines.push("© 2026 OMEGA-F. Published as a matter of record.");
  
  const plainText = lines.join("\n");
  return `
  <div class="doc plainMode">
    <h1 class="docH1">Plain Text</h1>
    <pre class="plainBlock">${escHtml(plainText)}</pre>
    ${renderDocFooter(rec)}
  </div>
  `;
}

// PDF page is "print as PDF" from browser.
// Keep it identical content, but add a "Print" control and print-specific class.
export function renderDeterminationPdf(rec: Determination, text: DeterminationText): string {
  return `
  <div class="pdfTop">
    <div class="pdfMeta">
      <div class="muted">OMEGA-F · PDF format</div>
      <div class="muted">Document ID: ${esc(text.docId)} · ${esc(formatIsoDate(rec.assessmentDate))}</div>
    </div>
    <button class="printBtn" id="js-print">Print / Save as PDF</button>
    <a href="${rec.permalink}" class="btn ghost" style="margin-left: 8px;">Back to HTML</a>
  </div>

  <div class="hr"></div>

  <div class="pdfDoc">
    ${renderMetaBlock(rec)}
    ${renderDetH1(text)}
    ${renderDetSectionsHtml(text)}
    ${renderDocFooter(rec)}
  </div>
  `;
}

