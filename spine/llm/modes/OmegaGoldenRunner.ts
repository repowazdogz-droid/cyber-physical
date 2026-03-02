// spine/llm/modes/OmegaGoldenRunner.ts

import { generateText } from "../LLMRouter";
import { getActiveLLMBackend } from "../LLMRouter";
import { getOpenAIModel } from "../openai/OpenAIConfig";
import { getGeminiModel } from "../config/GeminiConfig";
import type { OmegaGoldenCase } from "./omega_goldens_v1";
import type { OmegaMode } from "./OmegaModes";
import type { OmegaMeta } from "./OmegaMeta";

export type OmegaGoldenResult = {
  id: string;
  mode: OmegaMode;
  text: string;
  audit: {
    ok: boolean;
    violations: string[];
  };
  retry: {
    attempted: boolean;
    repaired: boolean;
  };
  timestampIso: string;
  backend: "openai" | "gemini" | null;
  model: string | null;
};

export async function runOmegaGoldenCase(
  testCase: OmegaGoldenCase
): Promise<OmegaGoldenResult> {
  const backend = getActiveLLMBackend();
  let model: string | null = null;

  if (backend === "openai") {
    model = getOpenAIModel();
  } else if (backend === "gemini") {
    model = getGeminiModel();
  }

  const result = await generateText({
    user: testCase.prompt,
    maxOutputChars: testCase.maxOutputChars ?? 900,
    omega: {
      mode: testCase.mode,
      retryOnAuditFailure: true,
    },
  });

  if (!result.ok || !result.text) {
    throw new Error(
      `Golden case ${testCase.id} failed: ${result.error || "Unknown error"}`
    );
  }

  const omegaMeta = result.omegaMeta;

  return {
    id: testCase.id,
    mode: testCase.mode,
    text: result.text,
    audit: {
      ok: omegaMeta?.audit?.ok ?? false,
      violations: omegaMeta?.audit?.violations ?? [],
    },
    retry: {
      attempted: omegaMeta?.retry?.attempted ?? false,
      repaired: omegaMeta?.retry?.repaired ?? false,
    },
    timestampIso: new Date().toISOString(),
    backend: backend ?? null,
    model: model ?? null,
  };
}

export async function runAllOmegaGoldens(
  cases: OmegaGoldenCase[]
): Promise<OmegaGoldenResult[]> {
  const results: OmegaGoldenResult[] = [];

  for (const testCase of cases) {
    const result = await runOmegaGoldenCase(testCase);
    results.push(result);
  }

  return results;
}




































