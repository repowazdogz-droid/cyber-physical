/**
 * Spec Library API
 * 
 * Returns library metadata + specs (bounded to max 10 entries).
 * 
 * Version: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { listLibraryEntries, SpecLibraryEntry } from '../../../../spine/specs/library/index';

export async function GET(request: NextRequest) {
  try {
    const entries = listLibraryEntries();

    // Return entries with bounded metadata
    const response: Array<{
      id: string;
      title: string;
      description: string;
      spec: any;
      defaultInput?: Record<string, unknown>;
    }> = entries.map(entry => ({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      spec: entry.spec,
      defaultInput: entry.defaultInput
    }));

    return NextResponse.json({
      ok: true,
      entries: response.slice(0, 10) // Bound to max 10 entries
    });
  } catch (error: any) {
    console.error('Failed to get spec library:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get spec library' },
      { status: 500 }
    );
  }
}








































