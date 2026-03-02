import { head, masthead, footer, foot } from "../partials/chrome";
import { DETERMINATIONS, byNewest } from "../data/determinations";
import { renderDeterminationRow } from "../partials/recordBlocks";

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

export function renderHome() {
  const rows = [...DETERMINATIONS].sort(byNewest).map((d) => renderDeterminationRow(d)).join("");

  return (
    head("OMEGA-F") +
    `<div class="shell"><div class="content">` +
    masthead() +
    `<header class="pageHead">
      <h1>OMEGA-F</h1>
      <p class="lede">Structural governability determinations. Published as a matter of record.</p>
    </header>

    <section class="callout">
      <p><strong>Positions</strong></p>
      <ul class="tight">
        <li>Systems with split information, power, and consequence become non-governable.</li>
        <li>Rollback after human impact is usually fictional.</li>
        <li>Oversight that cannot halt is not oversight.</li>
      </ul>
    </section>

    <section class="section">
      <div class="sectionHead">
        <h2>Recent determinations</h2>
        <div class="searchRow">
          <label class="srOnly" for="q">Search</label>
          <input id="q" class="searchInput" type="search" placeholder="Search determinations (title, system type)"/>
        </div>
      </div>

      <div id="detList" class="records">
        ${rows}
      </div>

      <div class="linksRow">
        <a href="/determinations/">Index</a>
        <span class="dot">·</span>
        <a href="/archive/">Archive</a>
        <span class="dot">·</span>
        <a href="/methodology/">Method</a>
        <span class="dot">·</span>
        <a href="/audit/">Submit a system</a>
      </div>
    </section>
    ` +
    footer() +
    `</div></div>` +
    foot() +
    `<script type="module">
      import { attachSearch } from "/src/site.ts";
      attachSearch(${esc(JSON.stringify(DETERMINATIONS))});
    </script>`
  );
}

