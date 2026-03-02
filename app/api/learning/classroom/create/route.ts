import { NextRequest, NextResponse } from 'next/server'
import { createInviteCode } from '../../../../../spine/learning/platform/store/SessionLinks'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teacherId, learnerId, ttlMinutes = 60 } = body

    if (!teacherId || !learnerId) {
      return NextResponse.json({ error: 'teacherId and learnerId are required' }, { status: 400 })
    }

    const invite = createInviteCode(teacherId, learnerId, ttlMinutes)

    return NextResponse.json({
      inviteCode: invite.code,
      expiresAt: invite.expiresAt,
      ttlMinutes: invite.ttlMinutes
    })
  } catch (error) {
    console.error('Error creating invite code:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}








































