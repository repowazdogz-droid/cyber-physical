import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    // Load highlight reel from bundle
    const bundlePath = join(process.cwd(), 'tmp', 'learningBundles', sessionId);
    const highlightPath = join(bundlePath, 'highlight.json');

    if (!existsSync(highlightPath)) {
      return NextResponse.json(
        { error: 'Highlight reel not found' },
        { status: 404 }
      );
    }

    const content = await readFile(highlightPath, 'utf-8');
    const highlight = JSON.parse(content);

    return NextResponse.json(highlight);
  } catch (error: any) {
    console.error('Failed to load highlight reel:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load highlight reel' },
      { status: 500 }
    );
  }
}








































