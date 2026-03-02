/**
 * Gate Engine
 * 
 * Pure rules engine for capability and consent gating.
 * Deterministic, bounded, no IO, no time.
 * 
 * Version: 1.0.0
 */

import { GateAction, GateDecision, GateContext, GateConstraints, ViewerRole, ConsentState, Surface } from './GateTypes';
import { getDefaultGatePack } from './packs/default_gate_pack';
import { getAllRules } from './GateRegistry';

/**
 * Evaluates a gate action against context.
 * Applies rules in order: non-negotiables → consent/visibility → comfort → bounds.
 */
export function evaluateGate(action: GateAction, ctx: GateContext): GateDecision {
  // Get all registered rules (default pack + any custom packs)
  const allRules = getAllRules();

  // Try registered rules first (first match wins)
  for (const rule of allRules) {
    const result = rule(action, ctx);
    if (result !== null) {
      return result;
    }
  }

  // Fallback to built-in checks
  // 1. Non-negotiables (dismissible spotlight, no grading surfaces)
  const nonNegotiable = checkNonNegotiables(action, ctx);
  if (!nonNegotiable.allowed) {
    return nonNegotiable;
  }

  // 2. Consent/visibility (adult opt-in vs minor default)
  const consentCheck = checkConsentAndVisibility(action, ctx);
  if (!consentCheck.allowed) {
    return consentCheck;
  }

  // 3. Comfort constraints (reduce motion)
  const comfortConstraints = checkComfortConstraints(action, ctx);

  // 4. Surface bounds (max trace nodes, max items)
  const surfaceBounds = checkSurfaceBounds(action, ctx);

  // Merge constraints (preserve nonNegotiable constraints like redactFields)
  const constraints: GateConstraints = {
    ...nonNegotiable.constraints,
    ...comfortConstraints,
    ...surfaceBounds,
    ...consentCheck.constraints
  };

  return {
    allowed: true,
    constraints: Object.keys(constraints).length > 0 ? constraints : undefined,
    reason: 'Action allowed with constraints'
  };
}

/**
 * Checks non-negotiable rules (dismissible spotlight, no grading).
 */
function checkNonNegotiables(action: GateAction, ctx: GateContext): GateDecision {
  // Spotlight must be dismissible
  if (action === GateAction.SHOW_SPOTLIGHT) {
    return {
      allowed: true,
      constraints: {
        requireDismissible: true
      },
      reason: 'Spotlight must be dismissible'
    };
  }

  // No grading surfaces (teacher recap, recap)
  if ((action === GateAction.VIEW_TEACHER_RECAP || action === GateAction.EXPORT_BUNDLE) &&
      (ctx.surface === Surface.TeacherRecap || ctx.surface === Surface.Recap)) {
    return {
      allowed: true,
      constraints: {
        redactFields: ['score', 'grade', 'points', 'rating', 'rank'].slice(0, 10) // Max 10
      },
      reason: 'No grading surfaces allowed'
    };
  }

  return { allowed: true, reason: 'No non-negotiable restrictions' };
}

/**
 * Checks consent and visibility rules (adult opt-in vs minor default).
 */
function checkConsentAndVisibility(action: GateAction, ctx: GateContext): GateDecision {
  // Actions that require adult opt-in
  const requiresOptIn = [
    GateAction.VIEW_TEACHER_RECAP,
    GateAction.VIEW_KERNEL_RUNS,
    GateAction.VIEW_ORCHESTRATOR_RUNS
  ];

  if (requiresOptIn.includes(action)) {
    // If viewer is teacher/parent and viewing adult data
    if ((ctx.viewerRole === ViewerRole.Teacher || ctx.viewerRole === ViewerRole.Parent) &&
        !ctx.isMinor &&
        ctx.consentState !== ConsentState.OptedIn) {
      return {
        allowed: false,
        reason: 'Adult opt-in required for this action'
      };
    }

    // If viewer is minor, allow with constraints
    if (ctx.isMinor) {
      return {
        allowed: true,
        constraints: {
          maxTraceNodes: 12,
          maxItems: 12,
          redactFields: ['internal', 'system', 'debug'].slice(0, 10) // Max 10
        },
        reason: 'Minor viewing allowed with constraints'
      };
    }
  }

  return { allowed: true, reason: 'Consent check passed' };
}

/**
 * Checks comfort constraints (reduce motion).
 */
function checkComfortConstraints(action: GateAction, ctx: GateContext): GateConstraints {
  const constraints: GateConstraints = {};

  // XR surfaces require reduce motion if requested or unknown
  if (ctx.surface === Surface.XR && (ctx.reduceMotion === true || ctx.reduceMotion === undefined)) {
    constraints.requireReduceMotion = true;
  }

  return constraints;
}

/**
 * Checks surface bounds (max trace nodes, max items).
 */
function checkSurfaceBounds(action: GateAction, ctx: GateContext): GateConstraints {
  const constraints: GateConstraints = {};

  // Reasoning trace actions get node limits
  if (action === GateAction.SHOW_REASONING_TRACE) {
    if (ctx.isMinor) {
      constraints.maxTraceNodes = 12;
    } else {
      constraints.maxTraceNodes = 20; // Higher limit for adults
    }
  }

  // View actions get item limits
  if (action === GateAction.VIEW_KERNEL_RUNS || action === GateAction.VIEW_ORCHESTRATOR_RUNS) {
    if (ctx.isMinor) {
      constraints.maxItems = 12;
    } else {
      constraints.maxItems = 50; // Higher limit for adults
    }
  }

  return constraints;
}

