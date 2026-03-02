/**
 * Gate Types
 * 
 * Types for capability and consent gating.
 * Deterministic, bounded, contract-aligned.
 * 
 * Version: 1.0.0
 */

/**
 * GateAction: Actions that can be gated.
 */
export enum GateAction {
  /** View kernel run records */
  VIEW_KERNEL_RUNS = 'VIEW_KERNEL_RUNS',
  /** View orchestrator run records */
  VIEW_ORCHESTRATOR_RUNS = 'VIEW_ORCHESTRATOR_RUNS',
  /** View teacher recap */
  VIEW_TEACHER_RECAP = 'VIEW_TEACHER_RECAP',
  /** Export bundle */
  EXPORT_BUNDLE = 'EXPORT_BUNDLE',
  /** Import bundle */
  IMPORT_BUNDLE = 'IMPORT_BUNDLE',
  /** Enable presence mode (XR) */
  ENABLE_PRESENCE = 'ENABLE_PRESENCE',
  /** Show spotlight */
  SHOW_SPOTLIGHT = 'SHOW_SPOTLIGHT',
  /** Run kernel */
  RUN_KERNEL = 'RUN_KERNEL',
  /** Run orchestrator */
  RUN_ORCHESTRATOR = 'RUN_ORCHESTRATOR',
  /** Attach to learning board */
  ATTACH_TO_BOARD = 'ATTACH_TO_BOARD',
  /** Show reasoning trace */
  SHOW_REASONING_TRACE = 'SHOW_REASONING_TRACE'
}

/**
 * ViewerRole: Role of the person requesting access.
 */
export enum ViewerRole {
  /** Learner themselves */
  Learner = 'Learner',
  /** Teacher */
  Teacher = 'Teacher',
  /** Parent/guardian */
  Parent = 'Parent',
  /** System/admin */
  System = 'System'
}

/**
 * ConsentState: Consent state for adult opt-in.
 */
export enum ConsentState {
  /** Not opted in */
  NotOptedIn = 'NotOptedIn',
  /** Opted in */
  OptedIn = 'OptedIn',
  /** Explicitly opted out */
  OptedOut = 'OptedOut'
}

/**
 * Surface: Surface/context where action is requested.
 */
export enum Surface {
  /** Learning board */
  Learning = 'Learning',
  /** XR/VR */
  XR = 'XR',
  /** Web recap */
  Recap = 'Recap',
  /** Teacher recap */
  TeacherRecap = 'TeacherRecap',
  /** Kernel demo */
  KernelDemo = 'KernelDemo',
  /** Orchestrator demo */
  OrchestratorDemo = 'OrchestratorDemo',
  /** Export/import */
  Export = 'Export'
}

/**
 * GateConstraints: Constraints applied when action is allowed.
 * Bounded: redactFields max 10, maxTraceNodes/maxItems reasonable.
 */
export interface GateConstraints {
  /** Maximum trace nodes to show (bounded) */
  maxTraceNodes?: number;
  /** Fields to redact (bounded, max 10) */
  redactFields?: string[];
  /** Require reduce motion */
  requireReduceMotion?: boolean;
  /** Require dismissible (for spotlight) */
  requireDismissible?: boolean;
  /** Maximum items to show (bounded) */
  maxItems?: number;
  /** Deny if adult has not opted in */
  denyIfAdultNoOptIn?: boolean;
}

/**
 * GateDecision: Result of gate evaluation.
 */
export interface GateDecision {
  /** Whether action is allowed */
  allowed: boolean;
  /** Optional constraints if allowed */
  constraints?: GateConstraints;
  /** Human-readable reason (max 200 chars) */
  reason: string;
}

/**
 * GateContext: Context for gate evaluation.
 * Read-only, deterministic.
 */
export interface GateContext {
  /** Viewer role */
  viewerRole: ViewerRole;
  /** Whether viewer is a minor */
  isMinor: boolean;
  /** Consent state (for adults) */
  consentState?: ConsentState;
  /** Surface/context */
  surface: Surface;
  /** Optional policy pack IDs */
  policyPackIds?: string[];
  /** Optional calm mode */
  calmMode?: boolean;
  /** Optional reduce motion preference */
  reduceMotion?: boolean;
}








































