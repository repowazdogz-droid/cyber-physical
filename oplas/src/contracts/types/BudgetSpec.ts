/**
 * Budget Specification Types
 * 
 * Hard caps for resource limits.
 * All budgets must be finite; orchestrator enforces.
 * 
 * Version: 1.0.0
 */

/**
 * BudgetSpec: Resource budgets for a run.
 */
export interface BudgetSpec {
  /** Maximum proposals (default 36) */
  max_proposals: number;
  /** Maximum repairs (default 24) */
  max_repairs: number;
  /** Maximum refinement iterations (default 6) */
  max_refinement_iters: number;
  /** Maximum wall-clock time (milliseconds) */
  max_wall_ms: number;
  /** Maximum runtime steps */
  max_runtime_steps: number;
  /** Maximum tokens per LLM call */
  max_tokens_per_call: number;
}

/**
 * Default budgets.
 */
export const DEFAULT_BUDGETS: BudgetSpec = {
  max_proposals: 36,
  max_repairs: 24,
  max_refinement_iters: 6,
  max_wall_ms: 300000, // 5 minutes
  max_runtime_steps: 10000,
  max_tokens_per_call: 4000
};























