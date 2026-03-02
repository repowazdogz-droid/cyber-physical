import "./styles/site.css";
import { head, masthead, footer, foot } from "./partials/chrome";
import { initSite } from "./site";
import { DETERMINATIONS } from "./data/determinations";
import { DETERMINATION_TEXTS } from "./data/determinationTexts";
import { renderDeterminationPlain } from "./pages/determinationRender";

const recPlain = DETERMINATIONS.find((d) => d.id === "2026-01");
if (!recPlain) throw new Error("Missing determination record 2026-01");
const textPlain = DETERMINATION_TEXTS["2026-01"];
if (!textPlain) throw new Error("Missing determination text 2026-01");

const root = document.querySelector<HTMLDivElement>("#app");
if (root) {
  root.innerHTML = (
    head(`Plain Text — ${recPlain.docId} — OMEGA-F`) +
    `<div class="shell"><div class="content">` +
    masthead() +
    renderDeterminationPlain(recPlain, textPlain) +
    footer() +
    `</div></div>` +
    foot()
  );
}

initSite();
