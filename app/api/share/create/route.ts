/**
 * Share Token Creation API
 * 
 * Creates share tokens with GateEngine validation.
 * 
 * Version: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShareTokenStore } from '../../../../spine/share/ShareTokenStore';
import { ShareScope } from '../../../../spine/share/ShareTypes';
import { evaluateGate } from '../../../../spine/gates/GateEngine';
import { GateAction, ViewerRole, Surface } from '../../../../spine/gates/GateTypes';

interface CreateTokenRequest {
  scope: ShareScope;
  learnerId: string;
  sessionId?: string;
  ttlMinutes?: number;
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
    const body: CreateTokenRequest = await request.json();
    const { scope, learnerId, sessionId, ttlMinutes = 60 } = body;

    if (!scope || !learnerId) {
      return NextResponse.json(
        { error: 'scope and learnerId are required' },
        { status: 400 }
      );
    }

    // Gate: Check if action is allowed
    const gateAction = scopeToGateAction(scope);
    const gateDecision = evaluateGate(gateAction, {
      viewerRole: ViewerRole.Teacher, // Default for sharing
      isMinor: false, // Could be determined from learnerId
      surface: Surface.Export
    });

    if (!gateDecision.allowed) {
      return NextResponse.json(
        { error: gateDecision.reason },
        { status: 403 }
      );
    }

    // Create token
    const store = getShareTokenStore();
    const token = await store.createToken(scope, learnerId, sessionId, ttlMinutes);

    // Build share URL
    const baseUrl = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const origin = `${protocol}://${baseUrl}`;

    let shareUrl = '';
    switch (scope) {
      case ShareScope.TEACHER_RECAP:
        shareUrl = `${origin}/teacher/recap?token=${token.token}&learnerId=${learnerId}${sessionId ? `&sessionId=${sessionId}` : ''}`;
        break;
      case ShareScope.SESSION_RECAP:
        shareUrl = `${origin}/learning/recap/${sessionId}?token=${token.token}`;
        break;
      case ShareScope.KERNEL_RUNS:
      case ShareScope.ORCHESTRATOR_RUNS:
        shareUrl = `${origin}/learning/permissions?token=${token.token}&scope=${scope}`;
        break;
      case ShareScope.PAIRING_BOOTSTRAP:
        shareUrl = `${origin}/api/learning/pair/${token.token}`;
        break;
    }

    return NextResponse.json({
      ok: true,
      token: token.token,
      expiresAtIso: token.expiresAtIso,
      shareUrl
    });
  } catch (error: any) {
    console.error('Failed to create share token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create share token' },
      { status: 500 }
    );
  }
}








































