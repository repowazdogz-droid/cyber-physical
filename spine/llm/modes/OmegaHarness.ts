// spine/llm/modes/OmegaHarness.ts

import type { OmegaMode } from "./OmegaModes";
import { generateText } from "../LLMRouter";

export type OmegaHarnessCase = {
  id: string;
  prompt: string;
  mode: OmegaMode;
  maxOutputChars?: number;
};

export type OmegaHarnessResult = {
  id: string;
  mode: OmegaMode;
  text: string;
  omegaAudit?: any;
  omegaRetry?: any;
};

export async function runOmegaHarnessCase(
  c: OmegaHarnessCase
): Promise<OmegaHarnessResult> {
  const res = await generateText({
    user: c.prompt,
    maxOutputChars: c.maxOutputChars ?? 900,
    omega: { mode: c.mode, retryOnAuditFailure: true },
  });

  if (!res.ok || !res.text) {
    throw new Error(`Harness case ${c.id} failed: ${res.error || "Unknown error"}`);
  }

  return {
    id: c.id,
    mode: c.mode,
    text: res.text,
    omegaAudit: (res as any).omegaAudit,
    omegaRetry: (res as any).omegaRetry,
  };
}




































