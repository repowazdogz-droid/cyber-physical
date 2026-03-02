import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * GET /api/learning/bundle/[sessionId]/thoughtObjects
 * Returns the thought objects for a bundle.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    const objectsPath = join(
      process.cwd(),
      'tmp',
      'learningBundles',
      sessionId,
      'thoughtObjects.json'
    );

    if (!existsSync(objectsPath)) {
      return NextResponse.json(
        { error: 'Thought objects not found' },
        { status: 404 }
      );
    }

    const content = await readFile(objectsPath, 'utf-8');
    const objects = JSON.parse(content);

    return NextResponse.json(objects);
  } catch (error: any) {
    console.error('Get thought objects error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get thought objects' },
      { status: 500 }
    );
  }
}

