/**
 * Default Gate Pack
 * 
 * Baseline conservative rules for capability and consent gating.
 * 
 * Version: 1.0.0
 */

import { GatePack } from '../GateRegistry';
import { GateAction, GateDecision, GateContext, ViewerRole, ConsentState, Surface } from '../GateTypes';

/**
 * Default gate pack rules.
 */
function createDefaultRules(): GatePack['rules'] {
  return [
    // Rule 1: Adult opt-in for teacher recap
    (action: GateAction, ctx: GateContext): GateDecision | null => {
      if (action === GateAction.VIEW_TEACHER_RECAP &&
          (ctx.viewerRole === ViewerRole.Teacher || ctx.viewerRole === ViewerRole.Parent) &&
          !ctx.isMinor &&
          ctx.consentState !== ConsentState.OptedIn) {
        return {
          allowed: false,
          reason: 'Adult opt-in required for teacher recap access'
        };
      }
      return null;
    },

    // Rule 2: Adult opt-in for kernel/orchestrator runs
    (action: GateAction, ctx: GateContext): GateDecision | null => {
      if ((action === GateAction.VIEW_KERNEL_RUNS || action === GateAction.VIEW_ORCHESTRATOR_RUNS) &&
          (ctx.viewerRole === ViewerRole.Teacher || ctx.viewerRole === ViewerRole.Parent) &&
          !ctx.isMinor &&
          ctx.consentState !== ConsentState.OptedIn) {
        return {
          allowed: false,
          reason: 'Adult opt-in required for viewing kernel/orchestrator runs'
        };
      }
      return null;
    },

    // Rule 3: Minors get constrained access
    (action: GateAction, ctx: GateContext): GateDecision | null => {
      if (ctx.isMinor &&
          (action === GateAction.VIEW_KERNEL_RUNS ||
           action === GateAction.VIEW_ORCHESTRATOR_RUNS ||
           action === GateAction.VIEW_TEACHER_RECAP)) {
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
      return null;
    },

    // Rule 4: Spotlight must be dismissible
    (action: GateAction, ctx: GateContext): GateDecision | null => {
      if (action === GateAction.SHOW_SPOTLIGHT) {
        return {
          allowed: true,
          constraints: {
            requireDismissible: true
          },
          reason: 'Spotlight must be dismissible'
        };
      }
      return null;
    },

    // Rule 5: XR reduce motion
    (action: GateAction, ctx: GateContext): GateDecision | null => {
      if (ctx.surface === Surface.XR && (ctx.reduceMotion === true || ctx.reduceMotion === undefined)) {
        return {
          allowed: true,
          constraints: {
            requireReduceMotion: true
          },
          reason: 'XR surface requires reduce motion'
        };
      }
      return null;
    },

    // Rule 6: No grading surfaces
    (action: GateAction, ctx: GateContext): GateDecision | null => {
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
      return null;
    }
  ];
}

/**
 * Gets the default gate pack.
 */
export function getDefaultGatePack(): GatePack {
  return {
    id: 'default',
    version: '1.0.0',
    description: 'Default conservative gate pack',
    rules: createDefaultRules()
  };
}

// Auto-register default pack
import { registerGatePack } from '../GateRegistry';
registerGatePack(getDefaultGatePack());








































