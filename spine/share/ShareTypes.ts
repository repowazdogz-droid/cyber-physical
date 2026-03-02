/**
 * Share Types
 * 
 * Types for share tokens and consent flows.
 * Deterministic, bounded, ND-first.
 * 
 * Version: 1.0.0
 */

/**
 * ShareScope: Scope of a share token.
 */
export enum ShareScope {
  /** Teacher recap access */
  TEACHER_RECAP = 'TEACHER_RECAP',
  /** Session recap sharing */
  SESSION_RECAP = 'SESSION_RECAP',
  /** Kernel runs visibility */
  KERNEL_RUNS = 'KERNEL_RUNS',
  /** Orchestrator runs visibility */
  ORCHESTRATOR_RUNS = 'ORCHESTRATOR_RUNS',
  /** XR pairing bootstrap */
  PAIRING_BOOTSTRAP = 'PAIRING_BOOTSTRAP'
}

/**
 * ShareTokenRecord: Record for a share token.
 * Bounded: max 50 tokens per learner, TTL max 24h, token length fixed (32 chars).
 */
export interface ShareTokenRecord {
  /** Unique token ID */
  tokenId: string;
  /** Share token (fixed length, 32 chars) */
  token: string;
  /** Learner ID */
  learnerId: string;
  /** Optional session ID */
  sessionId?: string;
  /** Share scope */
  scope: ShareScope;
  /** Creation timestamp (ISO string) */
  createdAtIso: string;
  /** Expiration timestamp (ISO string) */
  expiresAtIso: string;
  /** Optional revocation timestamp (ISO string) */
  revokedAtIso?: string;
  /** Optional notes (max 200 chars) */
  notes?: string;
}

/**
 * ShareTokenValidationResult: Result of token validation.
 */
export interface ShareTokenValidationResult {
  /** Whether token is valid */
  ok: boolean;
  /** Whether access is allowed */
  allowed: boolean;
  /** Human-readable reason (max 200 chars) */
  reason: string;
  /** Optional constraints from gate */
  constraints?: {
    maxItems?: number;
    maxTraceNodes?: number;
    redactFields?: string[];
  };
  /** Learner ID */
  learnerId: string;
  /** Optional session ID */
  sessionId?: string;
}

/**
 * Maximum tokens per learner.
 */
export const MAX_TOKENS_PER_LEARNER = 50;

/**
 * Maximum TTL in minutes (24 hours).
 */
export const MAX_TTL_MINUTES = 24 * 60;

/**
 * Token length (fixed).
 */
export const TOKEN_LENGTH = 32;








































