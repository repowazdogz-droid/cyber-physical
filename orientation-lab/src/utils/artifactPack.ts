import type { OrientationState } from "../types/orientation";
import { buildSignals } from "./signals";
import { APP_NAME, APP_VERSION } from "./version";

function fmtTime(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleString();
}

function joinLines(lines: string[]): string {
  return lines.filter(Boolean).join("\n");
}

// Plain-text artifact (relay-ready)
export function buildArtifactText(state: OrientationState): string {
  const models = state.models ?? [];
  const assumptions = state.assumptions ?? [];
  const disagreements = state.disagreements ?? [];
  const unknowns = state.unknowns ?? [];
  const judgments = state.judgments ?? [];

  const out: string[] = [];
  out.push("ORIENTATION ARTIFACT");
  out.push("");

  out.push("MODELS");
  if (models.length === 0) out.push("- (none)");
  for (const m of models) {
    out.push(`- ${m.name || "(unnamed)"}: ${m.claim || "(no claim)"}`);
    out.push(`  Scope: ${m.scope || "(no scope)"}`);
  }
  out.push("");

  out.push("ASSUMPTIONS");
  if (assumptions.length === 0) out.push("- (none)");
  for (const a of assumptions) {
    out.push(`- ${a.text || "(blank)"}`);
    out.push(`  Status: ${a.status}${a.owner ? ` | Owner: ${a.owner}` : ""}`);
  }
  out.push("");

  out.push("DISAGREEMENTS");
  if (disagreements.length === 0) out.push("- (none)");
  for (const d of disagreements) {
    out.push(`- Topic: ${d.topic || "(blank)"}`);
    if (d.parties) out.push(`  Parties: ${d.parties}`);
    out.push(`  What would change minds: ${d.whatWouldChangeMind || "(blank)"}`);
  }
  out.push("");

  out.push("UNKNOWNS");
  if (unknowns.length === 0) out.push("- (none)");
  for (const u of unknowns) {
    out.push(`- ${u.question || "(blank)"}`);
    out.push(
      `  Impact: ${u.impact || "unspecified"} | Horizon: ${u.horizon || "unspecified"}${
        u.owner ? ` | Owner: ${u.owner}` : ""
      }`
    );
  }
  out.push("");

  out.push("JUDGMENT TYPES REQUIRED");
  out.push(judgments.length ? `- ${judgments.join(", ")}` : "- (none)");
  out.push("");

  out.push("BOUNDARY");
  out.push(
    "This artifact does not forecast, optimise, or recommend actions. It records structure so humans can own judgment."
  );

  return joinLines(out);
}

export function buildPackText(args: {
  title: string;
  createdAt: number;
  updatedAt: number;
  state: OrientationState;
}): string {
  const { title, createdAt, updatedAt, state } = args;
  const signals = buildSignals(state);

  const lines: string[] = [];
  lines.push(`${APP_NAME} ${APP_VERSION}`);
  lines.push(`Session: ${title}`);
  lines.push(`Created: ${fmtTime(createdAt)}`);
  lines.push(`Updated: ${fmtTime(updatedAt)}`);
  lines.push("");
  lines.push("Signals (structure reflection; not advice):");
  if (signals.items.length === 0) {
    lines.push("- No notable structural gaps detected.");
  } else {
    signals.items.slice(0, 8).forEach((s) => {
      lines.push(`- [${s.level.toUpperCase()}] ${s.title}`);
    });
  }
  lines.push("");
  lines.push("Artifact (read-out):");
  lines.push(buildArtifactText(state));
  lines.push("");
  lines.push("Boundary:");
  lines.push("- This tool does not forecast, optimise, recommend, or decide.");
  lines.push("- It captures structure so humans can own judgement.");
  return lines.join("\n");
}

// Printable HTML pack (single page style)
export function buildPackHtml(args: {
  title: string;
  createdAt: number;
  updatedAt: number;
  state: OrientationState;
}): string {
  const text = buildPackText(args)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // A print-only, UI-free page
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${APP_NAME} Pack</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; margin: 24px; color: #111; }
    pre { white-space: pre-wrap; font-size: 13px; line-height: 1.45; }
    .stamp { font-size: 12px; color: #444; margin-bottom: 12px; }
    @media print {
      body { margin: 14mm; }
    }
  </style>
</head>
<body data-print="pack">
  <div class="stamp">${APP_NAME} ${APP_VERSION} — printable artifact pack</div>
  <pre>${text}</pre>
</body>
</html>`;
}

