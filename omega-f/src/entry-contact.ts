import "./styles/site.css";
import { head, masthead, footer, foot } from "./partials/chrome";
import { initSite } from "./site";

const root = document.querySelector<HTMLDivElement>("#app");
if (root) {
  root.innerHTML = (
    head("Contact — OMEGA-F") +
    `<div class="shell"><div class="content">` +
    masthead() +
    `<header class="pageHead">
      <h1>Contact</h1>
      <p class="lede">Correspondence and corrections are appended to the public record where applicable.</p>
    </header>

    <section class="section">
      <h2>Submissions</h2>
      <p>Use the <a href="/audit/">audit intake</a> to generate a submission record. Handling is manual.</p>
    </section>

    <section class="section">
      <h2>Corrections</h2>
      <p>If you believe a published determination contains a factual error, submit a technical correction with supporting evidence. Corrections are appended to the record.</p>
    </section>

    <section class="section">
      <h2>Address</h2>
      <p class="muted">Public contact channel to be added by operator. This site contains no tracking and no telemetry by design.</p>
    </section>
    ` +
    footer() +
    `</div></div>` +
    foot()
  );
}

initSite();

