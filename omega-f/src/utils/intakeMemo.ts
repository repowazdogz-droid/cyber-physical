export type AudienceSensitivity = "Board" | "Regulator" | "Mixed" | "Internal";
export type IntakeStage = "Proposed" | "Live" | "Post-incident";
export type DesiredOutput =
  | "Determination"
  | "Board memo"
  | "Regulator note"
  | "Go / No-Go gate"
  | "Incident post-mortem"
  | "Room brief";

export type IntakeFormState = {
  systemName: string;
  domain: string;
  stage: IntakeStage;
  operator: string;
  haltAuthority: string;
  harmBearer: string;
  fastestHarm: string;
  governanceArtifacts: string;
  outputs: DesiredOutput[];
  audience: AudienceSensitivity;
  notes: string;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildIntakeMemo(s: IntakeFormState): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const date = `${yyyy}-${mm}-${dd}`;

  const lines: string[] = [];
  lines.push("OMEGA-F · Assessment Intake (Unsubmitted)");
  lines.push(`Date: ${date}`);
  lines.push("");
  lines.push(`System: ${s.systemName || "[not provided]"}`);
  lines.push(`Domain: ${s.domain || "[not provided]"}`);
  lines.push(`Stage: ${s.stage}`);
  lines.push(`Audience sensitivity: ${s.audience}`);
  lines.push("");
  lines.push("Accountability topology (as described)");
  lines.push(`- Operator (who operates it): ${s.operator || "[not provided]"}`);
  lines.push(`- Halt authority (who can halt): ${s.haltAuthority || "[not provided]"}`);
  lines.push(`- Harm bearer (who bears harm): ${s.harmBearer || "[not provided]"}`);
  lines.push("");
  lines.push("Fastest plausible harm");
  lines.push(s.fastestHarm ? `- ${s.fastestHarm}` : "- [not provided]");
  lines.push("");
  lines.push("Existing governance artifacts");
  lines.push(s.governanceArtifacts ? `- ${s.governanceArtifacts}` : "- [not provided]");
  lines.push("");
  lines.push("Desired outputs");
  if (s.outputs.length) {
    for (const o of s.outputs) lines.push(`- ${o}`);
  } else {
    lines.push("- [none selected]");
  }
  if (s.notes.trim()) {
    lines.push("");
    lines.push("Additional notes");
    lines.push(s.notes.trim());
  }
  lines.push("");
  lines.push("Boundary");
  lines.push("This intake does not transmit data. It is a local scoping artifact.");
  return lines.join("\n");
}

export function buildIntakeMemoHtml(pre: string): string {
  return `<pre class="plainBlock">${esc(pre)}</pre>`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}








