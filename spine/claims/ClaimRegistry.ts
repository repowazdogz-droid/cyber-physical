/**
 * Claims Registry
 * 
 * Canonical registry of stable claim IDs with human labels, ND-calm descriptions,
 * severity, and domain tags. Contract-compatible.
 * 
 * Version: 1.0.0
 */

import { ClaimType } from '../contracts/ClaimContracts';

/**
 * Claim ID: Stable identifier for a claim.
 */
export type ClaimId =
  | "core.deterministic"
  | "core.bounded"
  | "core.explainable"
  | "core.ambiguity_bias_harder"
  | "core.environment_override_applied"
  | "core.time_critical_override_applied"
  | "core.privacy_filtered"
  | "core.reduce_motion_respected"
  | "uav.safe_landing_decision"
  | "uav.emergency_landing_required"
  | "uav.health_critical"
  | "uav.environment_unsafe"
  | "learning.session_traceable"
  | "learning.thought_objects_bounded"
  | "xr.comfort_mode_active"
  | "xr.motion_intensity_clamped";

/**
 * Claim Severity: Severity level for display/filtering.
 */
export type ClaimSeverity = "info" | "warn" | "critical";

/**
 * Evidence Schema Hint: Expected structure of evidence.
 */
export type EvidenceSchemaHint =
  | "trace_node_ref"
  | "signal_value"
  | "policy_result"
  | "external_ref"
  | "simple_text";

/**
 * Claim Descriptor: Human-readable claim metadata.
 */
export interface ClaimDescriptor {
  /** Stable claim ID */
  id: ClaimId;
  /** Human-readable title (max 60 chars) */
  title: string;
  /** ND-calm description (max 160 chars) */
  description: string;
  /** Claim type (from contracts) */
  type: ClaimType;
  /** Severity level */
  severity: ClaimSeverity;
  /** Applicable domains */
  domains: string[];
  /** Evidence schema hint */
  evidenceSchemaHint: EvidenceSchemaHint;
}

/**
 * Claims Registry: Map of all registered claims.
 */
const CLAIMS_REGISTRY: Record<ClaimId, ClaimDescriptor> = {
  // Core claims
  "core.deterministic": {
    id: "core.deterministic",
    title: "Deterministic Output",
    description: "Same input always produces the same decision and trace. No randomness or time-based logic.",
    type: ClaimType.Determinism,
    severity: "info",
    domains: ["core", "uav", "learning", "xr"],
    evidenceSchemaHint: "trace_node_ref"
  },
  "core.bounded": {
    id: "core.bounded",
    title: "Bounded Storage",
    description: "All outputs have size limits. Arrays, traces, and text are capped to prevent unbounded growth.",
    type: ClaimType.Bounded,
    severity: "info",
    domains: ["core", "uav", "learning", "xr"],
    evidenceSchemaHint: "trace_node_ref"
  },
  "core.explainable": {
    id: "core.explainable",
    title: "Explainable Decision",
    description: "Decision process is traceable with human-readable reasoning. No black-box logic.",
    type: ClaimType.Explainable,
    severity: "info",
    domains: ["core", "uav", "learning", "xr"],
    evidenceSchemaHint: "trace_node_ref"
  },
  "core.ambiguity_bias_harder": {
    id: "core.ambiguity_bias_harder",
    title: "Ambiguity Bias Applied",
    description: "Uncertain or ambiguous signals were treated as worst-case for safety.",
    type: ClaimType.Safety,
    severity: "warn",
    domains: ["core", "uav"],
    evidenceSchemaHint: "signal_value"
  },
  "core.environment_override_applied": {
    id: "core.environment_override_applied",
    title: "Environment Override",
    description: "Environmental conditions triggered a safety override. Decision modified for safety.",
    type: ClaimType.Safety,
    severity: "warn",
    domains: ["core", "uav"],
    evidenceSchemaHint: "policy_result"
  },
  "core.time_critical_override_applied": {
    id: "core.time_critical_override_applied",
    title: "Time Critical Override",
    description: "Imminent time-to-contact triggered emergency override. Immediate action required.",
    type: ClaimType.Safety,
    severity: "critical",
    domains: ["core", "uav"],
    evidenceSchemaHint: "signal_value"
  },
  "core.privacy_filtered": {
    id: "core.privacy_filtered",
    title: "Privacy Filtered",
    description: "Internal or system markers were removed from output for privacy. Safe for display.",
    type: ClaimType.Constraint,
    severity: "info",
    domains: ["core", "learning"],
    evidenceSchemaHint: "trace_node_ref"
  },
  "core.reduce_motion_respected": {
    id: "core.reduce_motion_respected",
    title: "Motion Reduction Active",
    description: "Reduce motion preference is respected. Animations and transitions are minimized.",
    type: ClaimType.Constraint,
    severity: "info",
    domains: ["core", "xr"],
    evidenceSchemaHint: "simple_text"
  },
  // UAV-specific claims
  "uav.safe_landing_decision": {
    id: "uav.safe_landing_decision",
    title: "Safe Landing Decision",
    description: "Decision square evaluated. Landing outcome determined based on altitude, health, environment, and time.",
    type: ClaimType.Safety,
    severity: "info",
    domains: ["uav"],
    evidenceSchemaHint: "policy_result"
  },
  "uav.emergency_landing_required": {
    id: "uav.emergency_landing_required",
    title: "Emergency Landing Required",
    description: "Critical conditions detected. Emergency landing sequence must be initiated immediately.",
    type: ClaimType.Safety,
    severity: "critical",
    domains: ["uav"],
    evidenceSchemaHint: "policy_result"
  },
  "uav.health_critical": {
    id: "uav.health_critical",
    title: "Health Status Critical",
    description: "System health is degraded or critical. Decision biased toward safer outcome.",
    type: ClaimType.Safety,
    severity: "warn",
    domains: ["uav"],
    evidenceSchemaHint: "signal_value"
  },
  "uav.environment_unsafe": {
    id: "uav.environment_unsafe",
    title: "Environment Unsafe",
    description: "Environmental conditions are hazardous or extreme. Landing required as precaution.",
    type: ClaimType.Safety,
    severity: "warn",
    domains: ["uav"],
    evidenceSchemaHint: "signal_value"
  },
  // Learning-specific claims
  "learning.session_traceable": {
    id: "learning.session_traceable",
    title: "Session Traceable",
    description: "Learning session is fully traceable. All decisions and interactions are recorded.",
    type: ClaimType.Explainable,
    severity: "info",
    domains: ["learning"],
    evidenceSchemaHint: "trace_node_ref"
  },
  "learning.thought_objects_bounded": {
    id: "learning.thought_objects_bounded",
    title: "Thought Objects Bounded",
    description: "Learning board objects are bounded to prevent unbounded growth. Max 50 objects per board.",
    type: ClaimType.Bounded,
    severity: "info",
    domains: ["learning"],
    evidenceSchemaHint: "simple_text"
  },
  // XR-specific claims
  "xr.comfort_mode_active": {
    id: "xr.comfort_mode_active",
    title: "Comfort Mode Active",
    description: "XR comfort settings are active. Motion and intensity are reduced for user comfort.",
    type: ClaimType.Constraint,
    severity: "info",
    domains: ["xr"],
    evidenceSchemaHint: "simple_text"
  },
  "xr.motion_intensity_clamped": {
    id: "xr.motion_intensity_clamped",
    title: "Motion Intensity Clamped",
    description: "Motion intensity metadata is clamped to safe range. Display-only constraint.",
    type: ClaimType.Constraint,
    severity: "info",
    domains: ["xr"],
    evidenceSchemaHint: "signal_value"
  }
};

/**
 * Gets claim descriptor by ID.
 * Returns undefined if not found.
 */
export function getClaimDescriptor(id: ClaimId): ClaimDescriptor | undefined {
  return CLAIMS_REGISTRY[id];
}

/**
 * Lists all claims, optionally filtered by domain.
 */
export function listClaims(options?: { domain?: string }): ClaimDescriptor[] {
  const allClaims = Object.values(CLAIMS_REGISTRY);
  
  if (!options?.domain) {
    return allClaims;
  }
  
  const domain = options.domain;
  if (!domain) {
    return allClaims;
  }
  return allClaims.filter(claim => claim.domains.includes(domain));
}

/**
 * Gets all claim IDs.
 */
export function getAllClaimIds(): ClaimId[] {
  return Object.keys(CLAIMS_REGISTRY) as ClaimId[];
}




