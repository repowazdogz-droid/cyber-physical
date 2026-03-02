import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    app: 'rooms',
    ok: true,
  });
}
