/**
 * Share Token Store
 * 
 * File-backed dev implementation for share tokens.
 * Atomic writes, bounded storage, deterministic.
 * 
 * Version: 1.0.0
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { createHash, randomBytes } from 'crypto';
import {
  ShareTokenRecord,
  ShareTokenValidationResult,
  ShareScope,
  MAX_TOKENS_PER_LEARNER,
  MAX_TTL_MINUTES,
  TOKEN_LENGTH
} from './ShareTypes';

const STORE_ROOT = '/tmp/shareTokens';

/**
 * Share token store interface.
 */
export interface IShareTokenStore {
  createToken(
    scope: ShareScope,
    learnerId: string,
    sessionId?: string,
    ttlMinutes?: number
  ): Promise<ShareTokenRecord>;

  validateToken(token: string, scope: ShareScope): Promise<ShareTokenValidationResult>;

  revokeToken(token: string): Promise<boolean>;

  listTokens(learnerId: string): Promise<ShareTokenRecord[]>;
}

/**
 * File-backed share token store implementation.
 */
export class FileShareTokenStore implements IShareTokenStore {
  private storeRoot: string;

  constructor(storeRoot?: string) {
    this.storeRoot = storeRoot || STORE_ROOT;
  }

  private async ensureStoreDir(): Promise<void> {
    await fs.mkdir(this.storeRoot, { recursive: true });
  }

  private getLearnerFile(learnerId: string): string {
    const learnerHash = createHash('sha256').update(learnerId).digest('hex').substring(0, 16);
    return join(this.storeRoot, `${learnerHash}.json`);
  }

  private async loadLearnerTokens(learnerId: string): Promise<ShareTokenRecord[]> {
    const filePath = this.getLearnerFile(learnerId);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const tokens: ShareTokenRecord[] = JSON.parse(content);
      // Filter out expired and revoked tokens
      const now = new Date().toISOString();
      return tokens.filter(
        t => t.expiresAtIso > now && !t.revokedAtIso
      );
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  private async saveLearnerTokens(learnerId: string, tokens: ShareTokenRecord[]): Promise<void> {
    const filePath = this.getLearnerFile(learnerId);
    const tmpPath = `${filePath}.tmp`;
    
    await fs.writeFile(tmpPath, JSON.stringify(tokens, null, 2), 'utf-8');
    await fs.rename(tmpPath, filePath);
  }

  async createToken(
    scope: ShareScope,
    learnerId: string,
    sessionId?: string,
    ttlMinutes: number = 60
  ): Promise<ShareTokenRecord> {
    // Bound TTL
    const boundedTtl = Math.min(ttlMinutes, MAX_TTL_MINUTES);

    // Generate token (32 chars, alphanumeric)
    const tokenBytes = randomBytes(16);
    const token = tokenBytes.toString('hex').substring(0, TOKEN_LENGTH);

    // Generate token ID
    const tokenId = createHash('sha256')
      .update(`${learnerId}-${scope}-${Date.now()}`)
      .digest('hex')
      .substring(0, 16);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + boundedTtl * 60 * 1000);

    const record: ShareTokenRecord = {
      tokenId,
      token,
      learnerId,
      sessionId,
      scope,
      createdAtIso: now.toISOString(),
      expiresAtIso: expiresAt.toISOString()
    };

    await this.ensureStoreDir();

    // Load existing tokens
    const existingTokens = await this.loadLearnerTokens(learnerId);

    // Remove expired/revoked tokens
    const activeTokens = existingTokens.filter(
      t => t.expiresAtIso > now.toISOString() && !t.revokedAtIso
    );

    // Enforce max tokens per learner (FIFO eviction)
    if (activeTokens.length >= MAX_TOKENS_PER_LEARNER) {
      // Remove oldest tokens
      activeTokens.sort((a, b) => a.createdAtIso.localeCompare(b.createdAtIso));
      activeTokens.splice(0, activeTokens.length - MAX_TOKENS_PER_LEARNER + 1);
    }

    // Add new token
    activeTokens.push(record);

    // Save
    await this.saveLearnerTokens(learnerId, activeTokens);

    return record;
  }

  async validateToken(token: string, scope: ShareScope): Promise<ShareTokenValidationResult> {
    // Search all learner files for the token
    // In production, this would use an index, but for dev we scan
    try {
      const files = await fs.readdir(this.storeRoot);
      const jsonFiles = files.filter(f => f.endsWith('.json') && !f.endsWith('.tmp'));

      for (const file of jsonFiles) {
        const filePath = join(this.storeRoot, file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const tokens: ShareTokenRecord[] = JSON.parse(content);
          
          const found = tokens.find(t => t.token === token && t.scope === scope);
          
          if (found) {
            const now = new Date().toISOString();
            
            // Check expiration
            if (found.expiresAtIso < now) {
              return {
                ok: false,
                allowed: false,
                reason: 'Token expired',
                learnerId: found.learnerId,
                sessionId: found.sessionId
              };
            }

            // Check revocation
            if (found.revokedAtIso) {
              return {
                ok: false,
                allowed: false,
                reason: 'Token revoked',
                learnerId: found.learnerId,
                sessionId: found.sessionId
              };
            }

            return {
              ok: true,
              allowed: true,
              reason: 'Token valid',
              learnerId: found.learnerId,
              sessionId: found.sessionId
            };
          }
        } catch {
          // Continue searching
        }
      }

      return {
        ok: false,
        allowed: false,
        reason: 'Token not found',
        learnerId: '',
        sessionId: undefined
      };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return {
          ok: false,
          allowed: false,
          reason: 'Token not found',
          learnerId: '',
          sessionId: undefined
        };
      }
      throw error;
    }
  }

  async revokeToken(token: string): Promise<boolean> {
    try {
      const files = await fs.readdir(this.storeRoot);
      const jsonFiles = files.filter(f => f.endsWith('.json') && !f.endsWith('.tmp'));

      for (const file of jsonFiles) {
        const filePath = join(this.storeRoot, file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const tokens: ShareTokenRecord[] = JSON.parse(content);
          
          const found = tokens.find(t => t.token === token);
          
          if (found && !found.revokedAtIso) {
            found.revokedAtIso = new Date().toISOString();
            await this.saveLearnerTokens(found.learnerId, tokens);
            return true;
          }
        } catch {
          // Continue searching
        }
      }

      return false;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  async listTokens(learnerId: string): Promise<ShareTokenRecord[]> {
    return this.loadLearnerTokens(learnerId);
  }
}

// Singleton instance
let storeInstance: IShareTokenStore | null = null;

export function getShareTokenStore(): IShareTokenStore {
  if (!storeInstance) {
    storeInstance = new FileShareTokenStore();
  }
  return storeInstance;
}




