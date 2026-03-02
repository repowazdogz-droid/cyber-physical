// spine/llm/modes/omegaMerge.ts

import type { OmegaMeta } from "./OmegaMeta";

/**
 * Deterministic, minimal merge: prefer "more informative" meta.
 * - If only one exists, use it.
 * - If both exist, prefer the one with audit present or retry attempted.
 * - If both have audit, prefer the one with audit.ok === false (more critical).
 * - Otherwise prefer the latter (last-seen).
 */
export function mergeOmegaMeta(a?: OmegaMeta, b?: OmegaMeta): OmegaMeta | undefined {
  if (!a) return b;
  if (!b) return a;

  const aHasAudit = Boolean(a.audit);
  const bHasAudit = Boolean(b.audit);
  if (aHasAudit !== bHasAudit) return bHasAudit ? b : a;

  const aHasRetry = Boolean(a.retry?.attempted);
  const bHasRetry = Boolean(b.retry?.attempted);
  if (aHasRetry !== bHasRetry) return bHasRetry ? b : a;

  const aAuditOk = a.audit?.ok;
  const bAuditOk = b.audit?.ok;
  if (aAuditOk !== bAuditOk) {
    if (aAuditOk === false) return a;
    if (bAuditOk === false) return b;
  }

  return b; // last-seen wins
}




































