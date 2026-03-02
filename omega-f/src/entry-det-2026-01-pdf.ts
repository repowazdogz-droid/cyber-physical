import "./styles/site.css";
import { head, masthead, footer, foot } from "./partials/chrome";
import { initSite } from "./site";
import { DETERMINATIONS } from "./data/determinations";
import { DETERMINATION_TEXTS } from "./data/determinationTexts";
import { renderDeterminationPdf } from "./pages/determinationRender";

const recPdf = DETERMINATIONS.find((d) => d.id === "2026-01");
if (!recPdf) throw new Error("Missing determination record 2026-01");
const textPdf = DETERMINATION_TEXTS["2026-01"];
if (!textPdf) throw new Error("Missing determination text 2026-01");

const root = document.querySelector<HTMLDivElement>("#app");
if (root) {
  root.innerHTML = (
    head(`PDF — ${recPdf.docId} — OMEGA-F`) +
    `<div class="shell"><div class="content pdfMode">` +
    masthead() +
    `<div class="pdfMode">
      ${renderDeterminationPdf(recPdf, textPdf)}
    </div>
    ` +
    footer() +
    `</div></div>` +
    foot()
  );
}

initSite();

document.getElementById("js-print")?.addEventListener("click", () => {
  window.print();
});
