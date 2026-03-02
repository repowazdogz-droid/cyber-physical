import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

interface PairingRecord {
  pairCode: string;
  expiresAtIso: string;
  bootstrap: {
    sessionId: string;
    learnerId: string;
    thoughtObjectsUrl: string;
    recapBaseUrl: string;
    mode: string;
    reduceMotion: boolean;
    ageBand?: string;
    missionId?: string;
    topicId?: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { pairCode: string } }
) {
  try {
    const pairCode = params.pairCode;

    if (!pairCode || pairCode.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid pair code' },
        { status: 400 }
      );
    }

    // Load pairing record
    const pairingDir = join(process.cwd(), 'tmp', 'pairing');
    const filePath = join(pairingDir, `${pairCode}.json`);

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Pair code not found' },
        { status: 404 }
      );
    }

    const content = await readFile(filePath, 'utf-8');
    const record: PairingRecord = JSON.parse(content);

    // Check expiration
    const expiresAt = new Date(record.expiresAtIso);
    if (new Date() > expiresAt) {
      return NextResponse.json(
        { error: 'Pair code expired' },
        { status: 410 } // Gone
      );
    }

    return NextResponse.json({
      pairCode: record.pairCode,
      expiresAtIso: record.expiresAtIso,
      bootstrap: record.bootstrap
    });
  } catch (error: any) {
    console.error('Failed to fetch pairing:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pairing' },
      { status: 500 }
    );
  }
}








































