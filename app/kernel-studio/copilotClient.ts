/**
 * Copilot Client
 * 
 * Client helper for LLM spec drafting.
 * 
 * Version: 1.0.0
 */

import type { OmegaMode } from "@/spine/llm/modes/OmegaModes";
import type { OmegaMeta } from "@/spine/llm/modes/OmegaMeta";

export interface DraftSpecResponse {
  ok: boolean;
  specDraft?: any;
  validation?: {
    ok: boolean;
    errors: string[];
    warnings: string[];
  };
  omegaMeta?: OmegaMeta;
  error?: string;
}

export async function draftSpec(text: string, omegaMode?: OmegaMode): Promise<DraftSpecResponse> {
  const body: any = { text };
  if (omegaMode) body.omegaMode = omegaMode;

  const response = await fetch('/api/llm/specDraft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  return await response.json();
}




