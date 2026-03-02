/**
 * Orchestrator Run Types
 * 
 * Bounded summary version of OrchestratorRun for storage.
 * 
 * Version: 1.0.0
 */

/**
 * OrchestratorRunRecord: Bounded summary for storage.
 * Max 20 per learner (FIFO eviction).
 */
export interface OrchestratorRunRecord {
  /** Run ID (deterministic hash) */
  runId: string;
  /** Graph ID */
  graphId: string;
  /** Creation timestamp (ISO string) */
  createdAtIso: string;
  /** Terminal outcome */
  terminalOutcome: string;
  /** Summary claims (bounded, max 12) */
  summaryClaims: Array<{
    claimId: string;
    title: string;
    severity: "info" | "warn" | "critical";
    count: number;
  }>;
  /** Trace highlights (bounded, max 12) */
  traceHighlights: Array<{
    nodeId: string;
    label: string;
    description: string;
    type: "override" | "disallow" | "decision" | "claim";
  }>;
  /** Node run IDs (references to kernelRuns, bounded max 25) */
  nodeRunIds: string[];
}








































