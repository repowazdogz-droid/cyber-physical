/**
 * Dispute / adjudication.
 * - 1 dispute per misconception per session.
 * - Dispute triggers adjudication probe(s); caps confidence until next session if dispute fails (rejected).
 */

export interface DisputeGate {
  /** Already disputed this misconception in this session */
  alreadyDisputed: boolean;
  /** Can open a new dispute */
  canDispute: boolean;
}

/**
 * Check if learner can dispute this misconception in this session.
 * canDispute = true if no dispute exists for (misconceptionEntryId, sessionId).
 */
export function disputeGate(disputeCountForEntrySession: number): DisputeGate {
  const alreadyDisputed = disputeCountForEntrySession > 0;
  return { alreadyDisputed, canDispute: !alreadyDisputed };
}

/**
 * After adjudication: if dispute status is REJECTED, confidence is capped until next session.
 * Caller should apply cap when computing effective confidence for scheduler/display.
 */
export function isConfidenceCappedByDispute(disputeStatus: "PENDING" | "ADJUDICATING" | "UPHELD" | "REJECTED"): boolean {
  return disputeStatus === "REJECTED";
}
