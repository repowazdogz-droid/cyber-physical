import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface LearningBundleMeta {
  sessionId: string;
  createdAtIso: string;
  version: string;
  modeUsed: string;
  reduceMotion: boolean;
  learnerIdHash?: string;
}

/**
 * POST /api/learning/importBundle
 * Accepts a learning bundle (multipart or JSON) and stores it.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const sessionId = formData.get('sessionId') as string || `session_${Date.now()}`;

    // Create bundle directory
    const bundlesDir = join(process.cwd(), 'tmp', 'learningBundles');
    if (!existsSync(bundlesDir)) {
      await mkdir(bundlesDir, { recursive: true });
    }

    const bundleDir = join(bundlesDir, sessionId);
    if (!existsSync(bundleDir)) {
      await mkdir(bundleDir, { recursive: true });
    }

    // Save uploaded files
    const files: { [key: string]: File } = {};
    
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        const buffer = await value.arrayBuffer();
        const filePath = join(bundleDir, value.name);
        await writeFile(filePath, Buffer.from(buffer));
        files[value.name] = value;
      }
    }

    // If no files, try parsing as JSON
    if (Object.keys(files).length === 0) {
      const body = await request.json();
      
      // Save each file from JSON
      if (body.meta) {
        await writeFile(join(bundleDir, 'meta.json'), JSON.stringify(body.meta, null, 2));
      }
      if (body.sessionlog) {
        await writeFile(join(bundleDir, 'sessionlog.json'), JSON.stringify(body.sessionlog, null, 2));
      }
      if (body.learningBoard) {
        await writeFile(join(bundleDir, 'learningBoard.json'), JSON.stringify(body.learningBoard, null, 2));
      }
      if (body.thoughtObjects) {
        await writeFile(join(bundleDir, 'thoughtObjects.json'), JSON.stringify(body.thoughtObjects, null, 2));
      }
    }

    // Validate bundle
    const metaPath = join(bundleDir, 'meta.json');
    if (!existsSync(metaPath)) {
      return NextResponse.json(
        { error: 'Bundle missing meta.json' },
        { status: 400 }
      );
    }

    const metaContent = await readFile(metaPath, 'utf-8');
    const meta: LearningBundleMeta = JSON.parse(metaContent);

    // Validate version
    if (meta.version !== '0.1') {
      return NextResponse.json(
        { error: `Unsupported bundle version: ${meta.version}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: meta.sessionId,
      bundlePath: bundleDir,
      meta
    });
  } catch (error: any) {
    console.error('Import bundle error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import bundle' },
      { status: 500 }
    );
  }
}
/**
 * GET /api/learning/importBundle?sessionId=...
 * Retrieves bundle metadata.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId required' },
        { status: 400 }
      );
    }

    const bundleDir = join(process.cwd(), 'tmp', 'learningBundles', sessionId);
    const metaPath = join(bundleDir, 'meta.json');

    if (!existsSync(metaPath)) {
      return NextResponse.json(
        { error: 'Bundle not found' },
        { status: 404 }
      );
    }

    const metaContent = await readFile(metaPath, 'utf-8');
    const meta: LearningBundleMeta = JSON.parse(metaContent);

    return NextResponse.json({ meta });
  } catch (error: any) {
    console.error('Get bundle error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get bundle' },
      { status: 500 }
    );
  }
}


