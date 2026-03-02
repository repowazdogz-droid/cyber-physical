// spine/llm/LLMRouter.ts
import { generateText as geminiGenerateText, GenerateTextOptions as GeminiOptions, GenerateTextResult as GeminiResult } from "./gemini/GeminiClient";
import { isGeminiEnabled } from "./config/GeminiConfig";

import { OpenAIClient } from "./openai/OpenAIClient";
import { isOpenAIEnabled, getLLMBackend } from "./openai/OpenAIConfig";

import { OMEGA_LENSES } from "./modes/OmegaLenses";
import type { OmegaMode } from "./modes/OmegaModes";
import { auditOmegaOutput } from "./modes/OmegaAudit";
import type { OmegaAuditResult, OmegaViolation } from "./modes/OmegaAudit";
import { buildTightenInstruction } from "./modes/OmegaTighten";
import type { OmegaMeta } from "./modes/OmegaMeta";
import { isOmegaStrictEnabled } from "./modes/OmegaStrict";

export type LLMBackend = "openai" | "gemini";

type OmegaOpt = { 
  mode: OmegaMode; 
  retryOnAuditFailure?: boolean;
};

/**
 * Applies Omega lens to user prompt if mode is provided.
 * Returns modified prompt with system preamble and output contract.
 */
function applyOmegaLens(userPrompt: string, omega?: OmegaOpt): string {
  if (!omega) return userPrompt;

  const lens = OMEGA_LENSES[omega.mode];

  const contract = [
    "OUTPUT CONTRACT:",
    `Use ONLY these section headers (in this order when applicable): ${lens.allowedSections.join(" | ")}`,
    `DO NOT: ${lens.forbiddenBehaviors.join(" | ")}`,
  ].join("\n");

  // Keep this deterministic and short
  return [
    lens.systemPreamble,
    contract,
    "",
    userPrompt,
  ].join("\n");
}

/**
 * Returns the active backend name.
 * Priority:
 * 1) LLM_BACKEND env var (openai|gemini)
 * 2) If not set, prefer OpenAI if configured, else Gemini if configured
 */
export function getActiveLLMBackend(): LLMBackend | null {
  const requested = getLLMBackend(); // "openai" | "gemini" (from env with default)
  if (requested === "openai") return isOpenAIEnabled() ? "openai" : (isGeminiEnabled() ? "gemini" : null);
  if (requested === "gemini") return isGeminiEnabled() ? "gemini" : (isOpenAIEnabled() ? "openai" : null);

  // fallback (should not happen, but safe):
  if (isOpenAIEnabled()) return "openai";
  if (isGeminiEnabled()) return "gemini";
  return null;
}

/**
 * Extended options that include optional Omega mode.
 */
export interface GenerateTextOptionsWithOmega extends GeminiOptions {
  omega?: OmegaOpt;
}

/**
 * Extended result that includes optional Omega audit and retry metadata.
 */
export interface GenerateTextResultWithAudit extends GeminiResult {
  omegaAudit?: OmegaAuditResult;
  omegaRetry?: {
    attempted: boolean;
    firstViolations?: OmegaViolation[];
    secondOk?: boolean;
  };
  omegaMeta?: OmegaMeta;
}

/**
 * Internal helper to call backend (factored for retry logic).
 */
async function callBackend(
  backend: LLMBackend,
  options: {
    user: string;
    system?: string;
    maxOutputChars?: number;
    temperature?: number;
    jsonSchema?: object;
  }
): Promise<GeminiResult> {
  if (backend === "gemini") {
    return await geminiGenerateText({
      user: options.user,
      system: options.system,
      maxOutputChars: options.maxOutputChars,
      temperature: options.temperature,
      jsonSchema: options.jsonSchema,
    });
  }

  // OpenAI backend - adapt GeminiOptions to OpenAI format
  const openaiClient = new OpenAIClient();
  
  // Combine system + user into single prompt for OpenAI
  let prompt = options.system 
    ? `${options.system}\n\n${options.user}`
    : options.user;

  // If jsonSchema is requested, add instruction to prompt (OpenAI doesn't support structured outputs in same way)
  if (options.jsonSchema) {
    prompt = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON. No markdown fences, no explanations, just JSON.`;
  }

  try {
    const openaiResult = await openaiClient.generateText({
      prompt,
      temperature: options.temperature,
      maxOutputChars: options.maxOutputChars,
    });

    // Convert OpenAI result to Gemini format
    return {
      ok: true,
      text: openaiResult.text,
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error.message || "OpenAI API error",
    };
  }
}

/**
 * Unified generateText function that routes to the active backend.
 * Uses GeminiClient interface for compatibility.
 * Supports optional Omega mode lens application, audit, and one-shot retry.
 */
export async function generateText(options: GenerateTextOptionsWithOmega): Promise<GenerateTextResultWithAudit> {
  const backend = getActiveLLMBackend();
  
  if (!backend) {
    return { ok: false, error: "No LLM backend configured. Set OPENAI_API_KEY or GEMINI_ENABLED=true + GEMINI_API_KEY." };
  }

  // Apply Omega lens if provided
  const finalUserPrompt = applyOmegaLens(options.user, options.omega);
  const omegaMode: OmegaMode | undefined = options.omega?.mode;
  const retryOnAuditFailure = omegaMode ? (options.omega?.retryOnAuditFailure ?? true) : false;

  // First call
  const firstResult = await callBackend(backend, {
    user: finalUserPrompt,
    system: options.system,
    maxOutputChars: options.maxOutputChars,
    temperature: options.temperature,
    jsonSchema: options.jsonSchema,
  });

  if (!firstResult.ok || !firstResult.text) {
    const omegaMeta: OmegaMeta | undefined = omegaMode
      ? {
          mode: omegaMode,
          retry: { attempted: false, repaired: false },
        }
      : undefined;
    return {
      ...firstResult,
      omegaRetry: omegaMode ? { attempted: false } : undefined,
      omegaMeta,
    };
  }

  const firstText = firstResult.text;

  // Run audit if Omega mode is provided
  let omegaAudit: OmegaAuditResult | undefined = undefined;
  if (omegaMode) {
    omegaAudit = auditOmegaOutput(omegaMode, firstText);

    // One-shot retry if audit failed and retry is enabled
    if (retryOnAuditFailure && !omegaAudit.ok) {
      const tighten = buildTightenInstruction(omegaMode, omegaAudit.violations);
      
      // IMPORTANT: one retry only. No loops.
      const repairedPrompt = `${tighten}\n\n---\nORIGINAL OUTPUT (to repair):\n${firstText}`;
      
      // Apply lens again to repaired prompt
      const repairedPromptWithLens = applyOmegaLens(repairedPrompt, options.omega);

      const secondResult = await callBackend(backend, {
        user: repairedPromptWithLens,
        system: options.system,
        maxOutputChars: options.maxOutputChars,
        temperature: options.temperature,
        jsonSchema: options.jsonSchema,
      });

      if (secondResult.ok && secondResult.text) {
        const secondText = secondResult.text;
        const secondAudit = auditOmegaOutput(omegaMode, secondText);

        const omegaMeta: OmegaMeta = {
          mode: omegaMode,
          audit: {
            ok: secondAudit.ok,
            violations: secondAudit.violations,
          },
          retry: {
            attempted: true,
            repaired: secondAudit.ok,
          },
        };

        // Strict mode check: if audit still fails after retry, return error
        const strict = isOmegaStrictEnabled();
        if (strict && !secondAudit.ok) {
          const violations = secondAudit.violations ?? [];
          const msg =
            `OMEGA_STRICT blocked output (mode=${omegaMode}). ` +
            `Audit violations: ${violations.join(", ") || "unknown"}.`;

          return {
            ok: false,
            error: msg.slice(0, 500),
            text: "",
            omegaAudit: secondAudit,
            omegaRetry: {
              attempted: true,
              firstViolations: omegaAudit.violations,
              secondOk: false,
            },
            omegaMeta,
          };
        }

        return {
          ok: true,
          text: secondText,
          omegaAudit: secondAudit,
          omegaRetry: {
            attempted: true,
            firstViolations: omegaAudit.violations,
            secondOk: secondAudit.ok,
          },
          omegaMeta,
        };
      } else {
        // Second call failed - return first result with retry metadata
        const omegaMeta: OmegaMeta = {
          mode: omegaMode,
          audit: {
            ok: omegaAudit.ok,
            violations: omegaAudit.violations,
          },
          retry: {
            attempted: true,
            repaired: false,
          },
        };

        // Strict mode check: if audit failed and retry didn't help, return error
        const strict = isOmegaStrictEnabled();
        if (strict && !omegaAudit.ok) {
          const violations = omegaAudit.violations ?? [];
          const msg =
            `OMEGA_STRICT blocked output (mode=${omegaMode}). ` +
            `Audit violations: ${violations.join(", ") || "unknown"}.`;

          return {
            ok: false,
            error: msg.slice(0, 500),
            text: "",
            omegaAudit,
            omegaRetry: {
              attempted: true,
              firstViolations: omegaAudit.violations,
              secondOk: false,
            },
            omegaMeta,
          };
        }

        return {
          ...firstResult,
          omegaAudit,
          omegaRetry: {
            attempted: true,
            firstViolations: omegaAudit.violations,
            secondOk: false,
          },
          omegaMeta,
        };
      }
    }

    // Strict mode check: if audit failed and retry disabled/failed, return error
    const strict = omegaMode ? isOmegaStrictEnabled() : false;
    if (omegaMode && strict && omegaAudit && !omegaAudit.ok) {
      const violations = omegaAudit.violations ?? [];
      const msg =
        `OMEGA_STRICT blocked output (mode=${omegaMode}). ` +
        `Audit violations: ${violations.join(", ") || "unknown"}.`;

      const omegaMeta: OmegaMeta = {
        mode: omegaMode,
        audit: {
          ok: omegaAudit.ok,
          violations: omegaAudit.violations,
        },
        retry: { attempted: false, repaired: false },
      };

      return {
        ok: false,
        error: msg.slice(0, 500),
        text: "",
        omegaAudit,
        omegaRetry: { attempted: false },
        omegaMeta,
      };
    }
  }

  const omegaMeta: OmegaMeta | undefined = omegaMode
    ? {
        mode: omegaMode,
        audit: omegaAudit
          ? { ok: omegaAudit.ok, violations: omegaAudit.violations }
          : undefined,
        retry: { attempted: false, repaired: false },
      }
    : undefined;

  return {
    ...firstResult,
    omegaAudit,
    omegaRetry: omegaMode ? { attempted: false } : undefined,
    omegaMeta,
  };
}

/**
 * For tests only (optional): reset cached client.
 */
export function __resetLLMClientForTests() {
  // No-op for now since we're not caching clients
}

