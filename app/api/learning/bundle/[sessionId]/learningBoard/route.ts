import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * GET /api/learning/bundle/[sessionId]/learningBoard
 * Returns the learning board state for a bundle.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    const boardPath = join(
      process.cwd(),
      'tmp',
      'learningBundles',
      sessionId,
      'learningBoard.json'
    );

    if (!existsSync(boardPath)) {
      return NextResponse.json(
        { error: 'Learning board not found' },
        { status: 404 }
      );
    }

    const content = await readFile(boardPath, 'utf-8');
    const board = JSON.parse(content);

    return NextResponse.json(board);
  } catch (error: any) {
    console.error('Get learning board error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get learning board' },
      { status: 500 }
    );
  }
}

