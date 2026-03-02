import "./styles/site.css";
import { renderPage } from "./pages/stub";
import { initSite } from "./site";

const root = document.getElementById("app");
if (root) {
  root.innerHTML = renderPage(
    "About — OMEGA-F",
    `
      <div class="meta"><span class="mono">About</span></div>
      <h2>About</h2>
      <p>
        OMEGA-F publishes structural governability determinations for complex systems.
        It does not certify, regulate, or recommend actions. It records what can and cannot
        be governed as structured.
      </p>
      <details>
        <summary>Boundary (intentional)</summary>
        <p>
          OMEGA-F is an assessment and documentation system. It is not an operational or autonomous system.
          Responsibility remains with human operators and governance.
        </p>
      </details>
    `
  );
  initSite();
}

