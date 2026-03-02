import "./styles/site.css";
import { renderPage } from "./pages/stub";
import { initSite } from "./site";
import { DETERMINATIONS, byNewest } from "./data/determinations";
import { renderDeterminationRow } from "./partials/recordBlocks";

const root = document.getElementById("app");
if (root) {
  const list = [...DETERMINATIONS].sort(byNewest).map(renderDeterminationRow).join("");
  
  root.innerHTML = renderPage(
    "Determinations — OMEGA-F",
    `
      <div class="meta"><span class="mono">Index</span> · Determinations</div>
      <h2>Determinations</h2>
      <p>Published as a matter of record.</p>
      ${list}
    `
  );
  initSite();
}

