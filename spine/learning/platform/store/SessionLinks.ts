/**
 * Session Links
 * 
 * In-memory invite code system for teacher-learner session linking.
 * Bounded map, TTL expiry, deterministic formatting.
 * 
 * Version: 0.1
 */

export interface InviteCode {
  code: string
  teacherId: string
  learnerId: string
  createdAt: string
  expiresAt: string
  ttlMinutes: number
}

const INVITE_CODES = new Map<string, InviteCode>()
const MAX_INVITE_CODES = 1000 // Bounded map
const CODE_LENGTH = 6 // 4-6 chars as specified

/**
 * Generates a deterministic invite code.
 */
function generateInviteCode(teacherId: string, learnerId: string, timestamp: string): string {
  // Simple deterministic hash (FNV-1a style)
  const input = `${teacherId}-${learnerId}-${timestamp}`
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  
  // Convert to alphanumeric code (uppercase, no confusing chars like 0/O, 1/I)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  let num = Math.abs(hash)
  
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += chars[num % chars.length]
    num = Math.floor(num / chars.length)
  }
  
  return code
}

/**
 * Creates an invite code linking teacher to learner.
 */
export function createInviteCode(
  teacherId: string,
  learnerId: string,
  ttlMinutes: number = 60
): InviteCode {
  // Clean up expired codes first
  cleanupExpiredCodes()
  
  // Enforce bounds
  if (INVITE_CODES.size >= MAX_INVITE_CODES) {
    // Remove oldest entry (FIFO)
    const oldest = Array.from(INVITE_CODES.entries())
      .sort((a, b) => new Date(a[1].createdAt).getTime() - new Date(b[1].createdAt).getTime())[0]
    if (oldest) {
      INVITE_CODES.delete(oldest[0])
    }
  }
  
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000)
  const timestamp = now.toISOString()
  
  const code = generateInviteCode(teacherId, learnerId, timestamp)
  
  const invite: InviteCode = {
    code,
    teacherId,
    learnerId,
    createdAt: timestamp,
    expiresAt: expiresAt.toISOString(),
    ttlMinutes
  }
  
  INVITE_CODES.set(code, invite)
  
  return invite
}

/**
 * Resolves an invite code to get teacher/learner info.
 */
export function resolveInviteCode(code: string): InviteCode | null {
  const invite = INVITE_CODES.get(code.toUpperCase())
  
  if (!invite) {
    return null
  }
  
  // Check expiry
  if (new Date() > new Date(invite.expiresAt)) {
    INVITE_CODES.delete(code.toUpperCase())
    return null
  }
  
  return invite
}

/**
 * Cleans up expired invite codes.
 */
function cleanupExpiredCodes(): void {
  const now = new Date()
  for (const [code, invite] of INVITE_CODES.entries()) {
    if (new Date(invite.expiresAt) < now) {
      INVITE_CODES.delete(code)
    }
  }
}

/**
 * Gets all active invite codes for a teacher.
 */
export function getTeacherInvites(teacherId: string): InviteCode[] {
  cleanupExpiredCodes()
  return Array.from(INVITE_CODES.values())
    .filter(invite => invite.teacherId === teacherId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/**
 * Gets all active invite codes for a learner.
 */
export function getLearnerInvites(learnerId: string): InviteCode[] {
  cleanupExpiredCodes()
  return Array.from(INVITE_CODES.values())
    .filter(invite => invite.learnerId === learnerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}








































