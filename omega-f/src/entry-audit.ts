import "./styles/site.css";
import { head, masthead, footer, foot } from "./partials/chrome";
import { renderAudit } from "./pages/audit";
import { initSite } from "./site";

const root = document.querySelector<HTMLDivElement>("#app");
if (root) {
  root.innerHTML = (
    head("Audit intake — OMEGA-F") +
    `<div class="shell"><div class="content">` +
    masthead() +
    renderAudit() +
    footer() +
    `</div></div>` +
    foot()
  );
}

initSite();

const form = document.getElementById("auditForm") as HTMLFormElement;
const memoSection = document.getElementById("memoSection")!;
const memoOutput = document.getElementById("memoOutput")!;
const genBtn = document.getElementById("generateMemo")!;
const copyBtn = document.getElementById("copyMemo")!;

genBtn.addEventListener("click", () => {
  const fd = new FormData(form);

  const outputs = fd.getAll("outputs").map(String);
  const audience = fd.get("audience") || "Unspecified";

  const lines: string[] = [];

  lines.push("OMEGA-F — INTAKE MEMORANDUM");
  lines.push("");
  lines.push(`System: ${fd.get("systemName") || ""}`);
  lines.push(`Domain: ${fd.get("domain") || ""}`);
  lines.push(`Stage: ${fd.get("stage") || ""}`);
  lines.push("");
  lines.push("Operational roles");
  lines.push(`- Operator: ${fd.get("operator") || ""}`);
  lines.push(`- Halt authority: ${fd.get("halt") || ""}`);
  lines.push(`- Harm bearer: ${fd.get("bearer") || ""}`);
  lines.push("");
  lines.push("Fastest plausible harm");
  lines.push(fd.get("harm") || "");
  lines.push("");
  lines.push("Existing governance artifacts");
  lines.push(fd.get("governance") || "None declared");
  lines.push("");
  lines.push("Requested outputs");
  if (outputs.length === 0) {
    lines.push("None specified");
  } else {
    for (const o of outputs) lines.push(`- ${o}`);
  }
  lines.push("");
  lines.push(`Audience sensitivity: ${audience}`);
  lines.push("");
  lines.push("Note");
  lines.push(
    "This memorandum records intake information only. It is not an assessment, recommendation, or determination."
  );

  memoOutput.textContent = lines.join("\n");
  memoSection.removeAttribute("hidden");
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(memoOutput.textContent || "");
  } catch {
    // silent
  }
});
