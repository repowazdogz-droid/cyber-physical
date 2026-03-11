export interface LLMAdapter {
  (prompt: string, opts?: { maxTokens?: number }): Promise<string>;
}

export interface Identity {
  userId: string;
  email?: string;
  orgId?: string;
  roles?: string[];
}

export interface RefinedIntent {
  objective: string;
  success_criteria: string[];
  constraints: string[];
  scope_in: string[];
  scope_out: string[];
  assumptions: string[];
  questions: string[];
}

export type PolicyDecision =
  | {
      allow: true;
    }
  | {
      allow: false;
      reason: string;
      requiresApproval?: boolean;
    };

export interface PolicyContext {
  tool: string;
  input: any;
  intent: string;
  domainId: string;
  identity: Identity;
}

export interface RunContext {
  intent: string;
  refinedIntent: RefinedIntent;
  domain: DomainPack;
  identity: Identity;
  memory: Record<string, any>;
  toolResults: Record<string, any>;
  trace: any[];
}

export interface DomainPack {
  id: string;
  description: string;
  systemPrompt: string;
  version: string;
  context?: {
    queries: (intent: string) => Array<{ tool: string; input: any }>;
  };
  policies?: Array<(ctx: PolicyContext) => PolicyDecision>;
  allowedTools?: string[];
  artifact: {
    name: string;
    build: (ctx: RunContext, llm?: LLMAdapter) => Promise<any> | any;
  };
}

export interface LedgerRecord {
  runId: string;
  checkpointId: string;
  updatedAt: number;
  memory: Record<string, any>;
}

export interface Outcome {
  runId: string;
  domainId: string;
  artifactId: string;
  status: "used" | "edited" | "rejected" | "unknown";
  edits?: {
    summary: string;
    deltaSize?: number;
  };
  userNote?: string;
  ts: number;
}

