import type { Determination } from "../data/determinations";

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

function badgeClass(status: Determination["status"]): string {
  switch (status) {
    case "Active": return "active";
    case "Under Review": return "review";
    case "Superseded": return "superseded";
    case "Withdrawn": return "withdrawn";
    default: return "active";
  }
}

export function renderDeterminationRow(d: Determination): string {
  return `
    <article class="record">
      <div class="recordMain">
        <a class="recordTitle" href="${d.permalink}">${esc(d.shortTitle)}</a>
        <div class="recordSub">${esc(d.determinationLabel)}</div>
      </div>
      <div class="recordMeta">
        <div>${esc(d.assessmentDateHuman)}</div>
        <div class="badge badge-${badgeClass(d.status)}">${esc(d.status)}</div>
      </div>
    </article>
  `;
}

export function renderMetaBlock(d: Determination): string {
  const supersedes = d.supersedes
    ? `<div>Supersedes: <a href="/determinations/${d.supersedes}/">${esc(d.supersedes)}</a></div>`
    : `<div>Supersedes: None</div>`;

  const supersededBy = d.supersededBy
    ? `<div>Superseded by: <a href="/determinations/${d.supersededBy}/">${esc(d.supersededBy)}</a></div>`
    : "";

  return `
    <div class="metaBlock">
      <div class="metaTop">
        <div class="metaTitle">OMEGA-F DETERMINATION No. ${esc(d.id)}</div>
        <div class="badge badge-${badgeClass(d.status)}">${esc(d.status)}</div>
      </div>
      <div class="metaGrid">
        <div>Classification: ${esc(d.classification)}</div>
        <div>System Type: ${esc(d.systemType)}</div>
        <div>Assessment Date: <time datetime="${esc(d.assessmentDate)}">${esc(d.assessmentDateHuman)}</time></div>
        <div>Status: ${esc(d.status)}</div>
        ${supersedes}
        ${supersededBy}
      </div>
    </div>
  `;
}

export function renderDocFooter(d: Determination): string {
  return `
    <div class="docFooter">
      <div class="docFooterLine">
        <span>Document ID: ${esc(d.docId)}</span>
        <span class="sep">·</span>
        <span>Permanent URL: ${esc(d.permalink)}</span>
      </div>
      <div class="docFooterLine">
        <span>Formats:</span>
        <a href="${d.plainUrl}">Plain Text</a>
        <span class="sep">·</span>
        <a href="${d.pdfUrl}">PDF</a>
        <span class="sep">·</span>
        <button class="linkBtn" type="button" data-cite="${esc(d.citeText)}">Cite</button>
      </div>
    </div>
  `;
}

// Legacy compatibility
export function determinationRow(rec: Determination): string {
  return renderDeterminationRow(rec);
}
export function determinationMetaBlock(rec: Determination): string {
  return renderMetaBlock(rec);
}
export function determinationFooterBlock(rec: Determination): string {
  return renderDocFooter(rec);
}
