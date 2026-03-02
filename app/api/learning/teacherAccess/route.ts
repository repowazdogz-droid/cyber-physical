import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface TeacherAccessRequest {
  learnerId: string;
  sessionId?: string;
  action: 'request' | 'grant' | 'revoke';
  role?: 'teacher' | 'parent';
}

interface TeacherAccessState {
  learnerId: string;
  allowed: boolean;
  grantedAt?: string;
  grantedBy?: string;
  role?: string;
}

// In-memory store for demo (would be DB in production)
const accessStore = new Map<string, TeacherAccessState>();

export async function POST(request: NextRequest) {
  try {
    const body: TeacherAccessRequest = await request.json();
    const { learnerId, sessionId, action, role = 'teacher' } = body;

    if (!learnerId || !action) {
      return NextResponse.json(
        { error: 'learnerId and action are required' },
        { status: 400 }
      );
    }

    // For demo: assume minor if learnerId contains "minor" or age band is 6-18
    // In production, this would come from learner profile
    const isMinor = learnerId.includes('minor') || 
                    learnerId.includes('6-9') || 
                    learnerId.includes('10-12') || 
                    learnerId.includes('13-15') || 
                    learnerId.includes('16-18');

    // Load existing state
    const storagePath = join(process.cwd(), 'tmp', 'teacherAccess');
    if (!existsSync(storagePath)) {
      await mkdir(storagePath, { recursive: true });
    }

    const statePath = join(storagePath, `${learnerId}.json`);
    let currentState: TeacherAccessState | null = null;

    if (existsSync(statePath)) {
      try {
        const content = await readFile(statePath, 'utf-8');
        currentState = JSON.parse(content);
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Check in-memory store first
    if (accessStore.has(learnerId)) {
      currentState = accessStore.get(learnerId)!;
    }

    switch (action) {
      case 'request':
        // For minors: auto-grant
        if (isMinor) {
          return NextResponse.json({
            allowed: true,
            reason: 'Minor learners allow teacher/parent access by default',
            requestId: null
          });
        }

        // For adults: create request
        const requestId = `req_${Date.now()}_${learnerId}`;
        const message = `${role === 'teacher' ? 'A teacher' : 'A parent'} wants to view your learning recap. This helps them support you. You can approve or decline.`;

        return NextResponse.json({
          allowed: false,
          reason: 'Adult learners must opt-in to teacher access',
          requestId,
          message
        });

      case 'grant':
        // For minors: auto-grant (no-op, but return success)
        if (isMinor) {
          const minorState: TeacherAccessState = {
            learnerId,
            allowed: true,
            grantedAt: new Date().toISOString(),
            grantedBy: 'system',
            role
          };

          await saveState(statePath, minorState);
          accessStore.set(learnerId, minorState);

          return NextResponse.json({
            allowed: true,
            reason: 'Minor learners allow teacher/parent access by default'
          });
        }

        // For adults: grant access
        const grantedState: TeacherAccessState = {
          learnerId,
          allowed: true,
          grantedAt: new Date().toISOString(),
          grantedBy: 'learner',
          role
        };

        await saveState(statePath, grantedState);
        accessStore.set(learnerId, grantedState);

        return NextResponse.json({
          allowed: true,
          reason: 'Access granted by learner'
        });

      case 'revoke':
        // Revoke access
        const revokedState: TeacherAccessState = {
          learnerId,
          allowed: false,
          grantedAt: undefined,
          grantedBy: undefined,
          role
        };

        await saveState(statePath, revokedState);
        accessStore.set(learnerId, revokedState);

        return NextResponse.json({
          allowed: false,
          reason: 'Access revoked by learner'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Failed to process teacher access request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

async function saveState(path: string, state: TeacherAccessState) {
  const tempPath = path + '.tmp';
  await writeFile(tempPath, JSON.stringify(state, null, 2));
  // Atomic move (would need fs.rename in Node.js, but writeFile + unlink works)
  const fs = await import('fs/promises');
  await fs.rename(tempPath, path);
}

// GET endpoint to check access
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const learnerId = searchParams.get('learnerId');

    if (!learnerId) {
      return NextResponse.json(
        { error: 'learnerId is required' },
        { status: 400 }
      );
    }

    // Check if minor
    const isMinor = learnerId.includes('minor') || 
                    learnerId.includes('6-9') || 
                    learnerId.includes('10-12') || 
                    learnerId.includes('13-15') || 
                    learnerId.includes('16-18');

    if (isMinor) {
      return NextResponse.json({
        allowed: true,
        reason: 'Minor learners allow teacher/parent access by default'
      });
    }

    // Check access state
    const storagePath = join(process.cwd(), 'tmp', 'teacherAccess');
    const statePath = join(storagePath, `${learnerId}.json`);

    let currentState: TeacherAccessState | null = null;

    if (accessStore.has(learnerId)) {
      currentState = accessStore.get(learnerId)!;
    } else if (existsSync(statePath)) {
      try {
        const content = await readFile(statePath, 'utf-8');
        currentState = JSON.parse(content);
      } catch (e) {
        // Ignore parse errors
      }
    }

    return NextResponse.json({
      allowed: currentState?.allowed || false,
      reason: currentState?.allowed 
        ? 'Access granted' 
        : 'Access not granted. Adult learners must opt-in.'
    });
  } catch (error: any) {
    console.error('Failed to check teacher access:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check access' },
      { status: 500 }
    );
  }
}








































