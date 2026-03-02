import { NextRequest, NextResponse } from 'next/server';

interface BootstrapRequest {
  calmMode?: boolean;
  customSessionId?: string;
  customLearnerId?: string;
  role?: 'teacher' | 'parent' | 'learner';
}

export async function POST(request: NextRequest) {
  try {
    const body: BootstrapRequest = await request.json();
    const { calmMode = false, customSessionId, customLearnerId, role = 'learner' } = body;

    // Generate IDs if not provided
    const sessionId = customSessionId || `session_${Date.now()}`;
    const learnerId = customLearnerId || `learner_${Date.now()}`;

    // Get host URL (for Unity HTTP mode)
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    // Determine age band (default to 10-12 for demo)
    const ageBand = '10-12';
    const missionId = 'understand';
    const topicId = 'math-basics';

    // Build response style hint
    const responseStyleHint = calmMode
      ? 'calmMode,oneQuestion,veryShort,calmTone,allowUncertainty,suggestBreaks,simplifyLanguage'
      : 'short,mediumLength,calmTone,allowUncertainty';

    // Build thought objects endpoint URL
    const thoughtObjectsEndpointUrl = `${baseUrl}/api/learning/thoughtObjects?learnerId=${encodeURIComponent(learnerId)}&sessionId=${encodeURIComponent(sessionId)}`;

    // Build recap URL
    const recapUrl = `${baseUrl}/learning/recap/${sessionId}`;

    return NextResponse.json({
      sessionId,
      learnerId,
      ageBand,
      missionId,
      topicId,
      responseStyleHint,
      thoughtObjectsEndpointUrl,
      recapUrl,
      calmMode,
      reduceMotion: calmMode
    });
  } catch (error: any) {
    console.error('Failed to bootstrap demo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to bootstrap demo' },
      { status: 500 }
    );
  }
}








































