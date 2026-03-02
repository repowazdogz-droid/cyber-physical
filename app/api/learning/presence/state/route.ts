import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface PresenceStateDto {
  sessionId: string;
  focusedThoughtId?: string;
  clusterId?: string;
  pinnedIds?: string[];
  spotlightThoughtId?: string;
  demoStepIndex?: number;
  updatedAtMs: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: PresenceStateDto = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Validate: IDs only, no text content
    if (body.focusedThoughtId && body.focusedThoughtId.length > 100) {
      return NextResponse.json(
        { error: 'Invalid state: IDs only, no text content' },
        { status: 400 }
      );
    }

    // Store state (atomic write, TTL 5 minutes)
    const presenceDir = join(process.cwd(), 'tmp', 'presence');
    if (!existsSync(presenceDir)) {
      await mkdir(presenceDir, { recursive: true });
    }

    const filePath = join(presenceDir, `${sessionId}.json`);
    const tempPath = `${filePath}.tmp`;

    // Add timestamp
    body.updatedAtMs = Date.now();

    await writeFile(tempPath, JSON.stringify(body, null, 2), 'utf-8');
    await writeFile(filePath, JSON.stringify(body, null, 2), 'utf-8');

    // Clean up temp file
    try {
      const fs = await import('fs/promises');
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to store presence state:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to store presence state' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params?: { sessionId?: string } }
) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Load state
    const presenceDir = join(process.cwd(), 'tmp', 'presence');
    const filePath = join(presenceDir, `${sessionId}.json`);

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'State not found' },
        { status: 404 }
      );
    }

    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf-8');
    const state: PresenceStateDto = JSON.parse(content);

    // Check TTL (5 minutes)
    const age = Date.now() - state.updatedAtMs;
    if (age > 5 * 60 * 1000) {
      return NextResponse.json(
        { error: 'State expired' },
        { status: 410 }
      );
    }

    return NextResponse.json(state);
  } catch (error: any) {
    console.error('Failed to load presence state:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load presence state' },
      { status: 500 }
    );
  }
}








































