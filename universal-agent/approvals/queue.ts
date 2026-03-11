export interface PendingAction {
  id: string;
  tool: string;
  input: any;
  reason: string;
  createdAt: number;
  expiresAt: number;
}

export interface DeadLetter {
  id: string;
  tool: string;
  input: any;
  reason: string;
  createdAt: number;
  expiredAt: number;
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

class ApprovalQueue {
  private pending: PendingAction[] = [];
  private dead: DeadLetter[] = [];

  enqueue(
    tool: string,
    input: any,
    reason: string,
    ttlMs: number = DEFAULT_TTL_MS,
  ): PendingAction {
    const now = Date.now();
    const action: PendingAction = {
      id: this.generateId(),
      tool,
      input,
      reason,
      createdAt: now,
      expiresAt: now + ttlMs,
    };
    this.pending.push(action);
    return action;
  }

  listPending(): PendingAction[] {
    this.expireSweep();
    return [...this.pending];
  }

  listDeadLetters(): DeadLetter[] {
    return [...this.dead];
  }

  resolve(
    id: string,
    approved: boolean,
  ): { action: PendingAction; approved: boolean } | null {
    this.expireSweep();

    const index = this.pending.findIndex((p) => p.id === id);
    if (index === -1) {
      return null;
    }

    const [action] = this.pending.splice(index, 1);
    return { action, approved };
  }

  expireSweep(): void {
    const now = Date.now();
    const remaining: PendingAction[] = [];

    for (const action of this.pending) {
      if (action.expiresAt <= now) {
        this.dead.push({
          id: action.id,
          tool: action.tool,
          input: action.input,
          reason: action.reason,
          createdAt: action.createdAt,
          expiredAt: now,
        });
      } else {
        remaining.push(action);
      }
    }

    this.pending = remaining;
  }

  private generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

const defaultQueue = new ApprovalQueue();

export function enqueue(
  tool: string,
  input: any,
  reason: string,
  ttlMs?: number,
): PendingAction {
  return defaultQueue.enqueue(tool, input, reason, ttlMs);
}

export function listPending(): PendingAction[] {
  return defaultQueue.listPending();
}

export function listDeadLetters(): DeadLetter[] {
  return defaultQueue.listDeadLetters();
}

export function resolve(
  id: string,
  approved: boolean,
): { action: PendingAction; approved: boolean } | null {
  return defaultQueue.resolve(id, approved);
}

export function expireSweep(): void {
  return defaultQueue.expireSweep();
}

