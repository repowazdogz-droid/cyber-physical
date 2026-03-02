import "./styles/site.css";
import { renderPage } from "./pages/stub";
import { initSite } from "./site";
import { DETERMINATIONS, byNewest } from "./data/determinations";
import { renderDeterminationRow } from "./partials/recordBlocks";

function yearFromISO(dateISO: string): string {
  return dateISO.slice(0, 4);
}

const root = document.getElementById("app");
if (root) {
  const sorted = [...DETERMINATIONS].sort(byNewest);
  const byYear: Record<string, typeof sorted> = {};
  for (const r of sorted) {
    const y = yearFromISO(r.assessmentDate);
    byYear[y] = byYear[y] ?? [];
    byYear[y].push(r);
  }

  const yearsDesc = Object.keys(byYear).sort((a, b) => b.localeCompare(a));

  const archiveHtml = yearsDesc
    .map((y) => {
      const rows = (byYear[y] ?? []).map(renderDeterminationRow).join("");
      return `<h2>${y}</h2>${rows}`;
    })
    .join("");

  root.innerHTML = renderPage(
    "Archive — OMEGA-F",
    `
      <div class="meta"><span class="mono">Archive</span></div>
      <h2>Archive</h2>
      <p>All determinations (by year).</p>
      ${archiveHtml}
    `
  );
  initSite();
}

