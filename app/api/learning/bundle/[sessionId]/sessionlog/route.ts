import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * GET /api/learning/bundle/[sessionId]/sessionlog
 * Returns the session log for a bundle.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    const logPath = join(
      process.cwd(),
      'tmp',
      'learningBundles',
      sessionId,
      'sessionlog.json'
    );

    if (!existsSync(logPath)) {
      return NextResponse.json(
        { error: 'Session log not found' },
        { status: 404 }
      );
    }

    const content = await readFile(logPath, 'utf-8');
    const log = JSON.parse(content);

    return NextResponse.json(log);
  } catch (error: any) {
    console.error('Get session log error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get session log' },
      { status: 500 }
    );
  }
}

