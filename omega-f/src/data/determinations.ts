export type DeterminationStatus = "Active" | "Superseded" | "Under Review" | "Withdrawn";

export type Determination = {
  id: string; // e.g. "2026-01"
  docId: string; // e.g. "OMEGA-F-2026-01"
  shortTitle: string;
  systemTitle: string;
  systemType: string;
  classification: string; // e.g. "Structural Governability Assessment"
  assessmentDate: string; // ISO yyyy-mm-dd
  assessmentDateHuman: string; // "05 Jan 2026"
  determinationLabel: string; // e.g. "Not governable (as structured)"
  status: DeterminationStatus;
  supersedes?: string | null;
  supersededBy?: string | null;

  permalink: string; // HTML route (also used as permanentUrl)
  plainUrl: string;  // Plain text route
  pdfUrl: string;    // PDF route
  citeText: string;  // formatted citation
};

export const DETERMINATIONS: Determination[] = [
  {
    id: "2026-01",
    docId: "OMEGA-F-2026-01",
    shortTitle: "2026-01 — Fine-tuned frontier model with API access",
    systemTitle: "Fine-tuned frontier model with API access",
    systemType: "LLM-API-FT (Large Language Model, API-Deployed, Fine-Tunable)",
    classification: "Structural Governability Assessment",
    assessmentDate: "2026-01-05",
    assessmentDateHuman: "05 Jan 2026",
    determinationLabel: "Not governable (as structured)",
    status: "Active",
    supersedes: null,
    supersededBy: null,
    permalink: "/determinations/2026-01/",
    plainUrl: "/determinations/2026-01/plain/",
    pdfUrl: "/determinations/2026-01/pdf/",
    citeText:
      "OMEGA-F (2026). Determination 2026-01: Fine-tuned frontier model with API access — Not governable (as structured). Assessment date: 05 Jan 2026. Permanent URL: /determinations/2026-01/.",
  },
];

// Legacy compatibility helpers
export type DeterminationRecord = Determination;
export function byNewest(a: Determination, b: Determination): number {
  return b.assessmentDate.localeCompare(a.assessmentDate);
}
export function formatDateLong(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map((x) => Number(x));
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const dd = String(d).padStart(2, "0");
  const mm = months[(m ?? 1) - 1] ?? "Jan";
  return `${dd} ${mm} ${y}`;
}
export function statusLine(rec: Determination): string {
  const parts: string[] = [];
  parts.push(`Status: ${rec.status}`);
  if (rec.supersedes) parts.push(`Supersedes: ${rec.supersedes}`);
  if (rec.supersededBy) parts.push(`Superseded by: ${rec.supersededBy}`);
  if (!rec.supersedes && !rec.supersededBy) parts.push("Supersedes: None");
  return parts.join(" · ");
}
export function docId(rec: Determination): string {
  return rec.docId;
}
