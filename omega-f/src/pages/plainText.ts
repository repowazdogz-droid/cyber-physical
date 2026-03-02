import type { Determination } from "../data/determinations";

export function renderPlainText(opts: { d: Determination; sections: { heading: string; lines: string[] }[] }): string {
  const { d, sections } = opts;

  const out: string[] = [];
  out.push(`${d.docId}`);
  out.push(`Classification: Structural Governability Assessment`);
  out.push(`System Type: ${d.systemType}`);
  out.push(`Assessment Date: ${d.assessmentDateHuman}`);
  out.push(`Status: ${d.status} · Supersedes: ${d.supersedes ?? "None"}`);
  out.push("");
  out.push(d.systemTitle);
  out.push("");

  for (const s of sections) {
    out.push(s.heading.toUpperCase());
    out.push(...s.lines);
    out.push("");
  }

  out.push(`Document ID: ${d.docId}`);
  out.push(`Permanent URL: ${d.permalink}`);
  out.push("© 2026 OMEGA-F. Published as a matter of record.");

  return out.join("\n");
}

// Legacy compatibility
export function renderDeterminationPlainText(rec: Determination, bodyText: string): string {
  return renderPlainText({
    d: rec,
    sections: [{ heading: "Content", lines: bodyText.split("\n").filter(Boolean) }],
  });
}
