import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { exportPath, sessionId } = body;

    // If exportPath provided, use it
    if (exportPath && existsSync(exportPath)) {
      // Import from provided path
      return await importFromPath(exportPath, sessionId);
    }

    // Otherwise, find latest export folder
    const exportsDir = join(process.cwd(), 'tmp', 'learningBundles');
    
    if (!existsSync(exportsDir)) {
      return NextResponse.json(
        { error: 'No exports directory found' },
        { status: 404 }
      );
    }

    // Find latest session folder
    const entries = await readdir(exportsDir, { withFileTypes: true });
    const sessionDirs = entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort()
      .reverse(); // Most recent first

    if (sessionDirs.length === 0) {
      return NextResponse.json(
        { error: 'No exported sessions found' },
        { status: 404 }
      );
    }

    const latestSessionId = sessionDirs[0];
    const latestPath = join(exportsDir, latestSessionId);

    return await importFromPath(latestPath, latestSessionId);
  } catch (error: any) {
    console.error('Failed to import latest export:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import latest export' },
      { status: 500 }
    );
  }
}

async function importFromPath(bundlePath: string, sessionId: string) {
  // Copy bundle files to learningBundles storage (same as XR-07 import)
  const storageDir = join(process.cwd(), 'tmp', 'learningBundles', sessionId);
  const fs = await import('fs/promises');
  
  if (!existsSync(storageDir)) {
    await fs.mkdir(storageDir, { recursive: true });
  }

  // Copy all JSON files from export to storage
  const files = ['meta.json', 'sessionlog.json', 'learningBoard.json', 'thoughtObjects.json', 'highlight.json'];
  
  for (const file of files) {
    const sourcePath = join(bundlePath, file);
    const destPath = join(storageDir, file);
    
    if (existsSync(sourcePath)) {
      const content = await readFile(sourcePath, 'utf-8');
      await fs.writeFile(destPath, content);
    }
  }

  // Get host URL for recap link
  const recapUrl = `/learning/recap/${sessionId}`;

  return NextResponse.json({
    success: true,
    sessionId,
    recapUrl,
    message: 'Bundle imported successfully'
  });
}

// GET endpoint to check for latest export
export async function GET(request: NextRequest) {
  try {
    const exportsDir = join(process.cwd(), 'tmp', 'learningBundles');
    
    if (!existsSync(exportsDir)) {
      return NextResponse.json({ latestSessionId: null });
    }

    const entries = await readdir(exportsDir, { withFileTypes: true });
    const sessionDirs = entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort()
      .reverse();

    return NextResponse.json({
      latestSessionId: sessionDirs.length > 0 ? sessionDirs[0] : null,
      count: sessionDirs.length
    });
  } catch (error: any) {
    console.error('Failed to check latest export:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check latest export' },
      { status: 500 }
    );
  }
}








































