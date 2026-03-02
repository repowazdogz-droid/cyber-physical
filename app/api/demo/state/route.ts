/**
 * Demo State API
 * 
 * Manages demo state (last artifact ID, last label) server-side.
 * Dev-only, stored in /tmp/demoState.json.
 * 
 * Version: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const DEMO_STATE_PATH = join(process.cwd(), 'tmp', 'demoState.json');

/**
 * Maximum string lengths.
 */
const MAX_STRING_LENGTH = 200;

/**
 * Bounds a string to max length.
 */
function boundString(text: string, maxLen: number): string {
  if (typeof text !== 'string') return String(text);
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen);
}

interface DemoState {
  lastArtifactId?: string;
  lastLabel?: string;
}

/**
 * Reads demo state from file.
 */
async function readDemoState(): Promise<DemoState> {
  try {
    if (!existsSync(DEMO_STATE_PATH)) {
      return {};
    }
    const content = await readFile(DEMO_STATE_PATH, 'utf-8');
    const state: DemoState = JSON.parse(content);
    
    // Bound strings
    return {
      lastArtifactId: state.lastArtifactId ? boundString(state.lastArtifactId, MAX_STRING_LENGTH) : undefined,
      lastLabel: state.lastLabel ? boundString(state.lastLabel, MAX_STRING_LENGTH) : undefined
    };
  } catch (error) {
    console.warn('Failed to read demo state:', error);
    return {};
  }
}

/**
 * Writes demo state to file.
 */
async function writeDemoState(state: DemoState): Promise<void> {
  try {
    // Ensure directory exists
    const dir = join(process.cwd(), 'tmp');
    await mkdir(dir, { recursive: true });

    // Bound strings
    const boundedState: DemoState = {
      lastArtifactId: state.lastArtifactId ? boundString(state.lastArtifactId, MAX_STRING_LENGTH) : undefined,
      lastLabel: state.lastLabel ? boundString(state.lastLabel, MAX_STRING_LENGTH) : undefined
    };

    await writeFile(DEMO_STATE_PATH, JSON.stringify(boundedState, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write demo state:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const state = await readDemoState();
    return NextResponse.json(state);
  } catch (error: any) {
    console.error('Failed to get demo state:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get demo state' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const state: DemoState = {
      lastArtifactId: body.lastArtifactId,
      lastLabel: body.lastLabel
    };

    await writeDemoState(state);
    return NextResponse.json({ ok: true, ...state });
  } catch (error: any) {
    console.error('Failed to set demo state:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set demo state' },
      { status: 500 }
    );
  }
}








































