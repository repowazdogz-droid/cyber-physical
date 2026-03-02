/**
 * LLM Explain API
 * 
 * Generates explanations using Gemini for kernel runs, regression diffs, or questions.
 * Requires GEMINI_ENABLED=true and GEMINI_API_KEY.
 * 
 * Version: 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { isGeminiEnabled } from '../../../../spine/llm/config/GeminiConfig';
import { generateText } from '../../../../spine/llm/LLMRouter';
import {
  explainKernelRunBounded,
  explainRegressionDiffBounded,
  generateDiscussionQuestionsBounded
} from '../../../../spine/llm/prompts/GeminiPrompts';
import { safeJsonParse, boundString } from '../../../../spine/llm/LLMOutputBounds';
import {
  validateBoundedExplanation,
  validateBoundedQuestions
} from '../../../../spine/llm/LLMContracts';
import { OmegaMode } from '../../../../spine/llm/modes/OmegaModes';
import { putArtifact } from '@spine/artifacts/ArtifactVault';
import { ArtifactKind } from '@spine/artifacts/ArtifactTypes';
import type { LLMRunArtifactPayload } from '@spine/artifacts/ArtifactTypes';
import { boundText, hashText } from '../../../../spine/llm/modes/llmRunUtils';

const MAX_PAYLOAD_SIZE = 50 * 1024; // 50KB

/**
 * Bounds a payload object for safe LLM processing.
 */
function boundPayload(payload: any, maxDepth: number = 3): any {
  if (maxDepth <= 0) return '[truncated]';
  
  if (Array.isArray(payload)) {
    return payload.slice(0, 20).map(item => boundPayload(item, maxDepth - 1));
  }
  
  if (payload && typeof payload === 'object') {
    const result: any = {};
    const keys = Object.keys(payload).slice(0, 30); // Max 30 keys
    for (const key of keys) {
      result[key] = boundPayload(payload[key], maxDepth - 1);
    }
    return result;
  }
  
  if (typeof payload === 'string') {
    return boundString(payload, 500); // Max 500 chars per string
  }
  
  return payload;
}

export async function POST(request: NextRequest) {
  try {
    // Check feature flag
    if (!isGeminiEnabled()) {
      return NextResponse.json(
        { ok: false, error: 'LLM_DISABLED' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { kind, payload, mode, omegaMode } = body;

    // Extract Omega mode if provided (optional)
    const omega = omegaMode ? { mode: omegaMode as OmegaMode } : undefined;

    if (!kind || typeof kind !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'kind field is required' },
        { status: 400 }
      );
    }

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json(
        { ok: false, error: 'payload field is required' },
        { status: 400 }
      );
    }

    // Check payload size
    const payloadJson = JSON.stringify(payload);
    if (payloadJson.length > MAX_PAYLOAD_SIZE) {
      return NextResponse.json(
        { ok: false, error: `Payload exceeds ${MAX_PAYLOAD_SIZE} bytes` },
        { status: 400 }
      );
    }

    // Bound payload before sending to LLM
    const boundedPayload = boundPayload(payload);

    let prompt: string;
    let maxOutputChars: number;
    let jsonSchema: object | undefined;

    switch (kind) {
      case 'kernelRun':
      case 'orchestratorRun':
        const explainMode = (mode === 'plain' ? 'plain' : 'bullets') as 'bullets' | 'plain';
        prompt = explainKernelRunBounded(boundedPayload, explainMode);
        maxOutputChars = 900;
        jsonSchema = undefined; // Plain text bullets
        break;

      case 'regressionDiff':
        prompt = explainRegressionDiffBounded(boundedPayload);
        maxOutputChars = 600;
        jsonSchema = undefined; // Plain text bullets
        break;

      case 'questions':
        prompt = generateDiscussionQuestionsBounded(boundedPayload);
        maxOutputChars = 800;
        jsonSchema = {
          type: 'array',
          items: { type: 'string' }
        };
        break;

      default:
        return NextResponse.json(
          { ok: false, error: `Invalid kind: ${kind}. Must be one of: kernelRun, orchestratorRun, regressionDiff, questions` },
          { status: 400 }
        );
    }

    // Call LLM router (Omega lens applied internally if omega provided)
    const result = await generateText({
      user: prompt,
      maxOutputChars,
      temperature: 0.7,
      jsonSchema,
      omega
    });

    if (!result.ok || !result.text) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error || 'Failed to generate explanation',
          ...(result.omegaAudit && { omegaAudit: result.omegaAudit }),
          ...(result.omegaRetry && { omegaRetry: result.omegaRetry }),
          ...(result.omegaMeta && { omegaMeta: result.omegaMeta }),
        },
        { status: 500 }
      );
    }

    const { text, omegaAudit, omegaRetry, omegaMeta } = result;

    // Process result based on kind
    if (kind === 'questions') {
      // Parse JSON array
      const parseResult = safeJsonParse<string[]>(text);
      if (!parseResult.ok || !Array.isArray(parseResult.data)) {
        return NextResponse.json(
          { ok: false, error: `Failed to parse questions: ${parseResult.error}` },
          { status: 500 }
        );
      }

      const validated = validateBoundedQuestions(parseResult.data);
      
      // Store as artifact (best-effort, don't fail request)
      try {
        const promptText = JSON.stringify(payload ?? {}, null, 2);
        const outputText = validated.questions.join("\n- ");

        const llmRunPayload: LLMRunArtifactPayload = {
          kind: "explain",
          createdAtIso: new Date().toISOString(),
          prompt: {
            text: boundText(promptText, 2000),
            hash: hashText(promptText),
          },
          output: {
            text: boundText(outputText, 2000),
          },
        };

        await putArtifact(
          ArtifactKind.LLM_RUN,
          { meta: { contractVersion: '1.0.0' }, ...llmRunPayload },
          {
            learnerId: "public",
            omega: omegaMeta,
          }
        );
      } catch {
        // swallow: logging must never break the endpoint
      }

      return NextResponse.json({
        ok: true,
        questions: validated.questions,
        ...(omegaAudit && { omegaAudit }),
        ...(omegaRetry && { omegaRetry }),
        ...(omegaMeta && { omegaMeta })
      });
    } else {
      // Parse bullet points or plain text (split by newlines or bullets)
      const trimmedText = text.trim();
      
      if (mode === 'plain') {
        // Plain language: split into sentences, max 5
        const sentences = trimmedText
          .split(/[.!?]+/)
          .map(s => s.trim())
          .filter(s => s.length > 0)
          .slice(0, 5);
        
        const validated = validateBoundedExplanation(sentences);
        
        // Store as artifact (best-effort, don't fail request)
        try {
          const promptText = JSON.stringify(payload ?? {}, null, 2);
          const outputText = validated.bullets.join("\n- ");

          const llmRunPayload: LLMRunArtifactPayload = {
            kind: "explain",
            createdAtIso: new Date().toISOString(),
            prompt: {
              text: boundText(promptText, 2000),
              hash: hashText(promptText),
            },
            output: {
              text: boundText(outputText, 2000),
            },
          };

          await putArtifact(
            ArtifactKind.LLM_RUN,
            { meta: { contractVersion: '1.0.0' }, ...llmRunPayload },
            {
              learnerId: "public",
              omega: omegaMeta,
            }
          );
        } catch {
          // swallow: logging must never break the endpoint
        }

        return NextResponse.json({
          ok: true,
          bullets: validated.bullets,
          ...(omegaAudit && { omegaAudit }),
          ...(omegaRetry && { omegaRetry }),
          ...(omegaMeta && { omegaMeta })
        });
      } else {
        // Bullets: split by newlines or bullets
        const bullets = trimmedText
          .split(/\n+/)
          .map(line => line.replace(/^[-*•]\s*/, '').trim())
          .filter(line => line.length > 0)
          .slice(0, 8); // Max 8 bullets

        const validated = validateBoundedExplanation(bullets);
        
        // Store as artifact (best-effort, don't fail request)
        try {
          const promptText = JSON.stringify(payload ?? {}, null, 2);
          const outputText = validated.bullets.join("\n- ");

          const llmRunPayload: LLMRunArtifactPayload = {
            kind: "explain",
            createdAtIso: new Date().toISOString(),
            prompt: {
              text: boundText(promptText, 2000),
              hash: hashText(promptText),
            },
            output: {
              text: boundText(outputText, 2000),
            },
          };

          await putArtifact(
            ArtifactKind.LLM_RUN,
            { meta: { contractVersion: '1.0.0' }, ...llmRunPayload },
            {
              learnerId: "public",
              omega: omegaMeta,
            }
          );
        } catch {
          // swallow: logging must never break the endpoint
        }

        return NextResponse.json({
          ok: true,
          bullets: validated.bullets,
          ...(omegaAudit && { omegaAudit }),
          ...(omegaRetry && { omegaRetry }),
          ...(omegaMeta && { omegaMeta })
        });
      }
    }
  } catch (error: any) {
    console.error('Explain error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

