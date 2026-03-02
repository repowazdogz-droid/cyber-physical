export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { generateTeacherRecapData } from '../../../learning/teacher/TeacherMomentEngine';
import { evaluateGate } from '../../../../spine/gates/GateEngine';
import { GateAction, ViewerRole, Surface, ConsentState } from '../../../../spine/gates/GateTypes';
import { getShareTokenStore } from '../../../../spine/share/ShareTokenStore';
import { ShareScope } from '../../../../spine/share/ShareTypes';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const learnerId = searchParams.get('learnerId');
    const sessionId = searchParams.get('sessionId');
    const token = searchParams.get('token');

    if (!learnerId && !token) {
      return NextResponse.json(
        { error: 'learnerId or token is required' },
        { status: 400 }
      );
    }

    // Check access via gate or token
    let resolvedLearnerId = learnerId || '';
    let resolvedSessionId = sessionId || undefined;
    let consentState = ConsentState.NotOptedIn;

    // If token provided, validate it
    if (token) {
      const store = getShareTokenStore();
      const validation = await store.validateToken(token, ShareScope.TEACHER_RECAP);
      
      if (validation.ok && validation.allowed) {
        // Token serves as opt-in proof
        consentState = ConsentState.OptedIn;
        if (validation.learnerId) {
          resolvedLearnerId = validation.learnerId;
        }
        if (validation.sessionId) {
          resolvedSessionId = validation.sessionId;
        }
      } else {
        return NextResponse.json({
          allowed: false,
          visibilityNote: validation.reason || 'Invalid token'
        }, { status: 403 });
      }
    }

    // Check if minor (same logic as teacherAccess)
    const isMinor = resolvedLearnerId.includes('minor') || 
                    resolvedLearnerId.includes('6-9') || 
                    resolvedLearnerId.includes('10-12') || 
                    resolvedLearnerId.includes('13-15') || 
                    resolvedLearnerId.includes('16-18');

    if (!token && !isMinor) {
      // Check if access is granted (legacy flow)
      const accessResponse = await fetch(
        `${request.nextUrl.origin}/api/learning/teacherAccess?learnerId=${resolvedLearnerId}`
      );
      const accessData = await accessResponse.json();
      if (accessData.allowed) {
        consentState = ConsentState.OptedIn;
      }
    }

    // Gate: VIEW_TEACHER_RECAP
    const gateDecision = evaluateGate(GateAction.VIEW_TEACHER_RECAP, {
      viewerRole: ViewerRole.Teacher,
      isMinor,
      consentState,
      surface: Surface.TeacherRecap
    });

    if (!gateDecision.allowed) {
      return NextResponse.json({
        allowed: false,
        visibilityNote: gateDecision.reason
      });
    }

    // Load bundle data
    const bundlePath = resolvedSessionId 
      ? join(process.cwd(), 'tmp', 'learningBundles', resolvedSessionId)
      : null;

    let sessionLog: any = null;
    let thoughtObjects: any[] = [];
    let boardState: any = null;
    let meta: any = null;

    if (bundlePath && existsSync(bundlePath)) {
      // Load from bundle
      const sessionLogPath = join(bundlePath, 'sessionlog.json');
      const thoughtObjectsPath = join(bundlePath, 'thoughtObjects.json');
      const boardStatePath = join(bundlePath, 'learningBoard.json');
      const metaPath = join(bundlePath, 'meta.json');

      if (existsSync(sessionLogPath)) {
        const content = await readFile(sessionLogPath, 'utf-8');
        sessionLog = JSON.parse(content);
      }

      if (existsSync(thoughtObjectsPath)) {
        const content = await readFile(thoughtObjectsPath, 'utf-8');
        const parsed = JSON.parse(content);
        thoughtObjects = parsed.objects || parsed;
      }

      if (existsSync(boardStatePath)) {
        const content = await readFile(boardStatePath, 'utf-8');
        boardState = JSON.parse(content);
      }

      if (existsSync(metaPath)) {
        const content = await readFile(metaPath, 'utf-8');
        meta = JSON.parse(content);
      }
    } else {
      // Try to load from live store (if available)
      // For now, return error if no bundle found
      return NextResponse.json(
        { error: 'Bundle not found. Export a session first.' },
        { status: 404 }
      );
    }

    // Generate teacher recap data
    const recapData = generateTeacherRecapData({
      sessionLog,
      thoughtObjects,
      boardState,
      meta,
      calmMode: meta?.reduceMotion || true
    });

    // Apply gate constraints (maxItems, redactFields)
    const maxItems = gateDecision.constraints?.maxItems;
    const redactFields = gateDecision.constraints?.redactFields || [];

    // Apply maxItems constraint to moments/prompts/plan if present
    if (maxItems && recapData.teacherMoments) {
      recapData.teacherMoments = recapData.teacherMoments.slice(0, maxItems);
    }
    if (maxItems && recapData.nextPrompts) {
      recapData.nextPrompts = recapData.nextPrompts.slice(0, maxItems);
    }
    if (maxItems && recapData.nextSessionPlan) {
      recapData.nextSessionPlan = recapData.nextSessionPlan.slice(0, maxItems);
    }

    // Apply redactFields (remove scoring-like fields)
    if (redactFields.length > 0) {
      const redactRecapData = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(redactRecapData);
        }
        if (obj && typeof obj === 'object') {
          const redacted: any = {};
          for (const [key, value] of Object.entries(obj)) {
            if (!redactFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
              redacted[key] = redactRecapData(value);
            }
          }
          return redacted;
        }
        return obj;
      };
      // Redact specific fields explicitly
      if (recapData.teacherMoments) {
        recapData.teacherMoments = redactRecapData(recapData.teacherMoments);
      }
      if (recapData.nextPrompts) {
        recapData.nextPrompts = redactRecapData(recapData.nextPrompts);
      }
      if (recapData.nextSessionPlan) {
        recapData.nextSessionPlan = redactRecapData(recapData.nextSessionPlan);
      }
      if (recapData.summary) {
        recapData.summary = redactRecapData(recapData.summary);
      }
    }

    return NextResponse.json({
      allowed: true,
      visibilityNote: gateDecision.reason,
      ...recapData
    });
  } catch (error: any) {
    console.error('Failed to generate teacher recap:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate teacher recap' },
      { status: 500 }
    );
  }
}

