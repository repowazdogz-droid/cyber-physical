/**
 * PolicyTypes: Policy context and decision types.
 * Disallow/override model for safety.
 * 
 * TODO: Future migration to /spine/contracts/PolicyContracts.ts
 * - PolicyContext → PolicyContextContract (add contractVersion, align structure)
 * - PolicyDecision → PolicyDecisionContract (add contractVersion, align decisionType)
 */

/**
 * PolicyContext: Context for policy evaluation.
 * 
 * TODO: Migrate to PolicyContextContract from /spine/contracts/PolicyContracts.ts
 */
export interface PolicyContext {
  /** Input signals */
  signals: Record<string, number | string | boolean>;
  /** Uncertainty flags */
  uncertainty: Record<string, boolean>;
  /** Environment/time overrides */
  overrides?: {
    environment?: string;
    timeToContact?: string;
    [key: string]: string | undefined;
  };
  /** Policy-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * PolicyDecision: Decision from policy evaluation.
 * 
 * TODO: Migrate to PolicyDecisionContract from /spine/contracts/PolicyContracts.ts
 */
export interface PolicyDecision {
  /** Allowed outcome (if not disallowed) */
  outcome?: string;
  /** Disallowed flag */
  disallowed: boolean;
  /** Reason for disallowance (if disallowed) */
  disallowReason?: string;
  /** Override applied (if any) */
  overrideApplied?: string;
  /** Confidence */
  confidence: "Low" | "Medium" | "High";
  /** Rationale */
  rationale: string;
}

/**
 * OverrideRule: Rule for applying overrides.
 */
export interface OverrideRule {
  /** Override type */
  type: "Environment" | "TimeToContact" | "Custom";
  /** Condition (when to apply) */
  condition: (context: PolicyContext) => boolean;
  /** Action (what to do) */
  action: (context: PolicyContext) => PolicyDecision;
  /** Priority (higher = applied first) */
  priority: number;
}

/**
 * DisallowRule: Rule for disallowing outcomes.
 */
export interface DisallowRule {
  /** Condition (when to disallow) */
  condition: (context: PolicyContext) => boolean;
  /** Reason for disallowance */
  reason: string;
  /** Priority (higher = checked first) */
  priority: number;
}

