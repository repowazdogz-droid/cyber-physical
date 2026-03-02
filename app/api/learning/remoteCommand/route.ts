import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface RemoteCommandRequest {
  sessionId: string;
  learnerId: string;
  commandType: 'spotlight_show' | 'spotlight_dismiss';
  thoughtId?: string;
  role?: 'teacher' | 'parent';
}

interface RemoteCommand {
  sessionId: string;
  learnerId: string;
  commandType: string;
  thoughtId?: string;
  timestampMs: number;
  version: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RemoteCommandRequest = await request.json();
    const { sessionId, learnerId, commandType, thoughtId, role = 'teacher' } = body;

    if (!sessionId || !learnerId || !commandType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Enforce XR-08 access gate (adult opt-in / minor default)
    // Check access via teacherAccess API
    const baseUrl = request.nextUrl.origin;
    const accessResponse = await fetch(`${baseUrl}/api/learning/teacherAccess?learnerId=${encodeURIComponent(learnerId)}`, {
      method: 'GET'
    });

    if (!accessResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to check access' },
        { status: 500 }
      );
    }

    const accessData = await accessResponse.json();
    if (!accessData.allowed) {
      return NextResponse.json(
        { error: 'Access not granted. Learner must opt in.' },
        { status: 403 }
      );
    }

    // Validate command
    if (commandType === 'spotlight_show' && !thoughtId) {
      return NextResponse.json(
        { error: 'thoughtId required for spotlight_show' },
        { status: 400 }
      );
    }

    // Store command (atomic write, TTL 2 minutes)
    const remoteDir = join(process.cwd(), 'tmp', 'remote');
    if (!existsSync(remoteDir)) {
      await mkdir(remoteDir, { recursive: true });
    }

    const filePath = join(remoteDir, `${sessionId}.json`);
    const tempPath = `${filePath}.tmp`;

    const command: RemoteCommand = {
      sessionId,
      learnerId,
      commandType,
      thoughtId,
      timestampMs: Date.now(),
      version: '0.1'
    };

    await writeFile(tempPath, JSON.stringify(command, null, 2), 'utf-8');
    await writeFile(filePath, JSON.stringify(command, null, 2), 'utf-8');

    // Clean up temp file
    try {
      const fs = await import('fs/promises');
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }

    return NextResponse.json({ success: true, command });
  } catch (error: any) {
    console.error('Failed to store remote command:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to store remote command' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Load command
    const remoteDir = join(process.cwd(), 'tmp', 'remote');
    const filePath = join(remoteDir, `${sessionId}.json`);

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'No command found' },
        { status: 404 }
      );
    }

    const content = await readFile(filePath, 'utf-8');
    const command: RemoteCommand = JSON.parse(content);

    // Check TTL (2 minutes)
    const age = Date.now() - command.timestampMs;
    if (age > 2 * 60 * 1000) {
      return NextResponse.json(
        { error: 'Command expired' },
        { status: 410 }
      );
    }

    return NextResponse.json(command);
  } catch (error: any) {
    console.error('Failed to load remote command:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load remote command' },
      { status: 500 }
    );
  }
}

