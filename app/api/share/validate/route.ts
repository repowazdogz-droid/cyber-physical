/**
 * Share Token Validation API
 * 
 * Validates share tokens and returns gate constraints.
 * 
 * Version: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShareTokenStore } from '../../../../spine/share/ShareTokenStore';
import { ShareScope } from '../../../../spine/share/ShareTypes';
import { evaluateGate } from '../../../../spine/gates/GateEngine';
import { GateAction, ViewerRole, Surface } from '../../../../spine/gates/GateTypes';

interface ValidateTokenRequest {
  token: string;
  scope: ShareScope;
}

/**
 * Maps ShareScope to GateAction for validation.
 */
function scopeToGateAction(scope: ShareScope): GateAction {
  switch (scope) {
    case ShareScope.TEACHER_RECAP:
      return GateAction.VIEW_TEACHER_RECAP;
    case ShareScope.SESSION_RECAP:
      return GateAction.EXPORT_BUNDLE;
    case ShareScope.KERNEL_RUNS:
      return GateAction.VIEW_KERNEL_RUNS;
    case ShareScope.ORCHESTRATOR_RUNS:
      return GateAction.VIEW_ORCHESTRATOR_RUNS;
    case ShareScope.PAIRING_BOOTSTRAP:
      return GateAction.ENABLE_PRESENCE;
    default:
      throw new Error(`Unknown scope: ${scope}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidateTokenRequest = await request.json();
    const { token, scope } = body;

    if (!token || !scope) {
      return NextResponse.json(
        { error: 'token and scope are required' },
        { status: 400 }
      );
    }

    // Validate token
    const store = getShareTokenStore();
    const validation = await store.validateToken(token, scope);

    if (!validation.ok || !validation.allowed) {
      return NextResponse.json({
        ok: false,
        allowed: false,
        reason: validation.reason
      });
    }

    // Gate: Check constraints
    const gateAction = scopeToGateAction(scope);
    const gateDecision = evaluateGate(gateAction, {
      viewerRole: ViewerRole.Teacher,
      isMinor: false, // Could be determined from learnerId
      surface: Surface.Export
    });

    return NextResponse.json({
      ok: true,
      allowed: true,
      reason: 'Token valid',
      constraints: gateDecision.constraints,
      learnerId: validation.learnerId,
      sessionId: validation.sessionId
    });
  } catch (error: any) {
    console.error('Failed to validate share token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to validate share token' },
      { status: 500 }
    );
  }
}








































