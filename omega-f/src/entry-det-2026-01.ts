import "./styles/site.css";
import { head, masthead, footer, foot } from "./partials/chrome";
import { initSite } from "./site";
import { DETERMINATIONS } from "./data/determinations";
import { DETERMINATION_TEXTS } from "./data/determinationTexts";
import { renderDeterminationHtml } from "./pages/determinationRender";

const rec = DETERMINATIONS.find((d) => d.id === "2026-01");
if (!rec) throw new Error("Missing determination record 2026-01");
const text = DETERMINATION_TEXTS["2026-01"];
if (!text) throw new Error("Missing determination text 2026-01");

const root = document.querySelector<HTMLDivElement>("#app");
if (root) {
  root.innerHTML = (
    head(`${rec.docId} — OMEGA-F`) +
    `<div class="shell"><div class="content">` +
    masthead() +
    `<article class="doc">
      ${renderDeterminationHtml(rec, text)}
    </article>
    ` +
    footer() +
    `</div></div>` +
    foot()
  );
}
initSite();
