import { head, masthead, footer, foot } from "../partials/chrome";
import { PROTOCOL_V1 } from "../data/protocol_v1";

export function renderMethodPage(): string {
  return (
    head("Method — OMEGA-F") +
    `<div class="shell"><div class="content">` +
    masthead() +
    `<header class="pageHead">
      <div class="kicker">Protocol · Method</div>
      <h1>OMEGA-F Assessment Protocol</h1>
      <p class="lede">Protocol v${PROTOCOL_V1.version}. Published as a reference for determinations.</p>
    </header>

    <section class="section">
      <h2>Scope</h2>
      <p>${PROTOCOL_V1.scope}</p>
    </section>

    <section class="section">
      <h2>Definitions</h2>
      <ul>
        ${PROTOCOL_V1.definitions.map((d) => `<li><strong>${d.term}:</strong> ${d.def}</li>`).join("")}
      </ul>
    </section>

    <section class="section">
      <h2>Procedure</h2>
      <ol>
        ${PROTOCOL_V1.procedure.map((p) => `<li>${p}</li>`).join("")}
      </ol>
    </section>

    <section class="section">
      <h2>Diagnostic blades</h2>
      <ul>
        ${PROTOCOL_V1.blades.map((b) => `<li><strong>${b.id}:</strong> ${b.desc}</li>`).join("")}
      </ul>
    </section>

    <section class="section">
      <h2>Revision history</h2>
      <ul class="tight">
        ${PROTOCOL_V1.revisions.map((r) => `<li><strong>${r.version}</strong> — ${r.date} — ${r.note}</li>`).join("")}
      </ul>
    </section>
    ` +
    footer() +
    `</div></div>` +
    foot()
  );
}

