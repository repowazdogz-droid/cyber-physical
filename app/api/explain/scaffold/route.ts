import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '../../../../spine/llm/LLMRouter';
import { OmegaMode } from '../../../../spine/llm/modes/OmegaModes';
import { RoomKey } from '@/app/state/types';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_INPUT_LENGTH = 8000; // Hard limit for reliability

type AnalysisMode = 'claim'; // Always claim mode for short-form

function buildLengthAwarePrompt(sourceContent: string, analysisMode: AnalysisMode): string {
  const basePrompt = `Expose assumptions, evidence boundaries, missing context, and alternative interpretations. Draft only.

Output format (JSON):
{
  "summary": "Plain language rewrite of the claim (no conclusions)",
  "assumptions": ["assumption 1", "assumption 2", ...],
  "evidence": ["evidence item 1", "evidence item 2", ...],
  "constraints": ["constraint 1", "constraint 2", ...],
  "tradeoffs": ["alternative interpretation 1", "alternative interpretation 2", ...],
  "whatWouldChangeAnalysis": ["information type 1", "information type 2", ...]
}

Rules:
- No conclusions
- No advice
- No persuasion
- No questions
- Output format locked
- Structural analysis only

For "whatWouldChangeAnalysis": List information that, if available, would materially affect interpretation of the claim. Do not recommend actions. Do not use imperative language. Use only categories of evidence, clarifying distinctions, boundary conditions, missing contextual information, or dependency disclosures.`;

  const analysisModeRules = `
### ANALYSIS MODE RULES

Treat the input as a single claim or framing.
- Assume the user wants precision
- Identify:
  - assumptions
  - evidence boundaries
  - missing context
- Claim mode must NEVER refuse based on ambiguity
- Surface uncertainty in output instead of refusing`;

  return `${basePrompt}${analysisModeRules}

Source content to analyze:
${sourceContent}`;
}

/**
 * Validates input content for Omega RC scaffold endpoint.
 * Returns error code if invalid, null if valid.
 */
function validateInput(content: string): { error: string; limit?: number } | null {
  if (content.length === 0) {
    return { error: 'empty_input' };
  }

  // Reject URLs (starts with http:// or https://)
  const trimmed = content.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return { error: 'url_not_supported' };
  }

  // Reject content exceeding max length
  if (content.length > MAX_INPUT_LENGTH) {
    return { error: 'too_long', limit: MAX_INPUT_LENGTH };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    // Early env guard BEFORE any model/client init
    const requiredEnv = [
      "OPENAI_API_KEY",
    ];

    for (const k of requiredEnv) {
      if (!process.env[k] || String(process.env[k]).trim() === "") {
        return NextResponse.json(
          {
            ok: false,
            error: `Server misconfigured: missing ${k}. Add it in Vercel Project → Settings → Environment Variables, then redeploy.`,
          },
          { status: 500 }
        );
      }
    }

    const body = await request.json();
    const content = body.sourceContent?.trim() ?? '';
    const only = body.only as string | undefined; // Optional: 'assumptions', 'evidence', etc.
    const mode = body.mode as string | undefined; // Optional: 'refine' for refinement mode, 'variants' for adding variants
    const existing = body.existing as Array<{ id?: string; text: string }> | undefined; // Existing items for refine/variants mode
    const n = body.n as number | undefined; // Number of variants to generate (default 2)

    // Validate input (empty, URL, length)
    const validationError = validateInput(content);
    if (validationError) {
      // Always return 200 with fallback scaffold for URL/too_long (never error-block user)
      if (validationError.error === 'url_not_supported' || validationError.error === 'too_long') {
        return NextResponse.json({
          ok: true,
          scaffold: {
            summary: 'This appears to be a claim or framing that needs clarification.',
            assumptions: ['The claim assumes missing context.'],
            evidence: [],
            constraints: ['What evidence supports this is not shown.'],
            tradeoffs: ['The claim could be interpreted differently depending on context.'],
            whatWouldChangeAnalysis: [],
          },
          fallback: true,
          validationError: validationError.error,
          fallbackMessage: validationError.error === 'too_long' 
            ? 'Text is too long for Omega RC. Please paste a single headline or short claim.'
            : undefined,
        });
      }
      // Only return 400 for empty input
      return NextResponse.json(
        { ok: false, error: validationError.error },
        { status: 400 }
      );
    }

    // Hard-enforce claim mode - do NOT compute dynamically
    const analysisMode: AnalysisMode = 'claim';

    // If "only" parameter is specified, generate only that section
    if (only) {
      // Map UI keys to canonical keys
      const keyMap: Record<string, string> = {
        'claim': 'summary',
        'missing': 'constraints',
        'framings': 'tradeoffs',
      };
      const canonicalKey = keyMap[only] || only;
      
      // Validate against canonical room keys (plus summary for claim)
      const validKeys: (RoomKey | 'summary')[] = ['claim', 'assumptions', 'evidence', 'missing', 'framings', 'whatWouldChangeAnalysis', 'constraints', 'tradeoffs', 'causal', 'summary'];
      if (!validKeys.includes(canonicalKey as RoomKey | 'summary')) {
        return NextResponse.json(
          { ok: false, error: `Invalid "only" parameter. Must be one of: ${validKeys.join(', ')}` },
          { status: 400 }
        );
      }

      // Build focused prompt for single section
      const sectionPrompts: Record<string, string> = {
        assumptions: 'List the hidden premises that must be true for this claim to hold. No conclusions, no advice.',
        evidence: 'List only what is directly shown or sourced in the claim. No inferences.',
        constraints: 'List what limits this claim or what context would change understanding. No recommendations.',
        tradeoffs: 'List alternative ways to interpret the same material. No judgments.',
        whatWouldChangeAnalysis: 'List types of information that, if available, would materially affect interpretation. Do not recommend actions. Use only categories of evidence, clarifying distinctions, boundary conditions, missing contextual information, or dependency disclosures.',
        summary: 'Rewrite the claim in plain language without conclusions.',
      };
      
      const promptKey = canonicalKey;

      // Build refine-specific prompt if in refine mode
      let focusedPrompt = `${sectionPrompts[promptKey]}

Source content:
${content}`;

      if (mode === 'refine' && existing && existing.length > 0) {
        focusedPrompt += `

You are refining an existing analysis section.

Rules:
- Return EXACTLY the same number of items as provided in existing.
- Do NOT change the topic or scope
- Do NOT introduce recommendations or advice
- Do not add new bullets. Do not merge bullets. Do not drop bullets.
- Only rewrite text for clarity and neutrality.
- Output the same list structure

Existing items:
${existing.map((i, idx) => `${idx + 1}. ${i.text}`).join('\n')}`;
      }

      if (mode === 'variants' && existing && existing.length > 0) {
        const variantCount = n || 2;
        focusedPrompt += `

Generate ${variantCount} additional items that fit the same room and stay neutral.

Rules:
- Do NOT rewrite existing items
- Generate ${variantCount} new items (or fewer if not possible)
- Maintain the same tone and neutrality as existing items
- Do not introduce recommendations or advice

Existing items (for context only):
${existing.map((i, idx) => `${idx + 1}. ${i.text}`).join('\n')}`;
      }

      focusedPrompt += `

Output format: JSON array of strings.
Example: ["item 1", "item 2", "item 3"]`;

      try {
        const result = await generateText({
          user: focusedPrompt,
          maxOutputChars: 1000,
          temperature: mode === 'refine' ? 0.2 : 0.3, // Lower temperature for refine mode
          jsonSchema: {
            type: 'array',
            items: { type: 'string' },
          },
          omega: {
            mode: 'R' as OmegaMode,
            retryOnAuditFailure: true,
          },
        });

        if (result.ok && result.text) {
          let items: string[] = [];
          try {
            const parsed = JSON.parse(result.text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, ''));
            items = Array.isArray(parsed) ? parsed : [];
          } catch {
            // Fallback: try to extract array from text
            items = [];
          }

          // Safety guard: enforce exact count matching in refine mode
          if (mode === 'refine' && existing && existing.length > 0) {
            // Enforce exact count: trim or pad to match existing count
            if (items.length !== existing.length) {
              if (items.length > existing.length) {
                // Trim excess items
                items = items.slice(0, existing.length);
              } else {
                // Pad with existing items (fallback preserve)
                while (items.length < existing.length) {
                  items.push(existing[items.length].text);
                }
              }
            }
          }

          // Variants mode: limit to requested count
          if (mode === 'variants') {
            const variantCount = n || 2;
            if (items.length > variantCount) {
              items = items.slice(0, variantCount);
            }
          }

          return NextResponse.json({
            ok: true,
            only: canonicalKey,
            items: items.map((text, idx) => ({
              id: mode === 'refine' ? `refined-${Date.now()}-${idx}` : `regenerated-${Date.now()}-${idx}`,
              text,
              createdAt: Date.now(),
            })),
          });
        }
      } catch (error) {
        console.error('Single section generation failed:', error);
      }

      // Fallback for single section
      return NextResponse.json({
        ok: true,
        only,
        items: [],
      });
    }

    // Build prompt for claim mode (full scaffold)
    const prompt = buildLengthAwarePrompt(content, analysisMode);

    // Output limits for claim mode
    const maxOutputChars = 2000;
    const maxArrayItems = undefined; // No limit for claim mode

    // Build JSON schema with length-aware constraints
    const jsonSchema: any = {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        assumptions: {
          type: 'array',
          items: { type: 'string' },
          ...(maxArrayItems ? { maxItems: maxArrayItems } : {}),
        },
        evidence: {
          type: 'array',
          items: { type: 'string' },
          ...(maxArrayItems ? { maxItems: maxArrayItems } : {}),
        },
        constraints: {
          type: 'array',
          items: { type: 'string' },
          ...(maxArrayItems ? { maxItems: maxArrayItems } : {}),
        },
        tradeoffs: {
          type: 'array',
          items: { type: 'string' },
          ...(maxArrayItems ? { maxItems: maxArrayItems } : {}),
        },
        whatWouldChangeAnalysis: {
          type: 'array',
          items: { type: 'string' },
          ...(maxArrayItems ? { maxItems: maxArrayItems } : {}),
        },
      },
      required: ['summary', 'assumptions', 'evidence', 'constraints', 'tradeoffs'],
    };

    // Call Omega RC with R mode (claim mode always retries on audit failure)
    let result;
    try {
      result = await generateText({
        user: prompt,
        maxOutputChars,
        temperature: 0.3,
        jsonSchema,
        omega: { 
          mode: 'R' as OmegaMode,
          retryOnAuditFailure: true, // Always retry for claim mode
        },
      });
    } catch (llmError: any) {
      console.error('LLM call threw error:', llmError);
      // Return fallback draft instead of failing
      return NextResponse.json({
        ok: true,
        scaffold: {
          summary: 'This appears to be a claim or framing that needs clarification.',
          assumptions: ['The claim assumes missing context.'],
          evidence: [],
          constraints: ['What evidence supports this is not shown.'],
          tradeoffs: ['The claim could be interpreted differently depending on context.'],
          whatWouldChangeAnalysis: [],
        },
        fallback: true,
      });
    }

    if (!result.ok || !result.text) {
      // Log error but return fallback draft instead of failing
      const errorMessage = result.error || 'Failed to generate scaffold';
      console.error('Scaffold generation failed:', {
        error: errorMessage,
        analysisMode,
        omegaAudit: result.omegaAudit,
        omegaMeta: result.omegaMeta,
      });
      
      // Return fallback draft - claim mode must NEVER fail
      return NextResponse.json({
        ok: true,
        scaffold: {
          summary: 'This appears to be a claim or framing that needs clarification.',
          assumptions: ['The claim assumes missing context.'],
          evidence: [],
          constraints: ['What evidence supports this is not shown.'],
          tradeoffs: ['The claim could be interpreted differently depending on context.'],
          whatWouldChangeAnalysis: [],
        },
        fallback: true,
      });
    }

    // Parse JSON response with error handling
    let parseResult;
    try {
      // Try to extract JSON from response (in case LLM wraps it in markdown)
      let jsonText = result.text.trim();
      
      // Remove markdown code fences if present
      if (jsonText.startsWith('```')) {
        const lines = jsonText.split('\n');
        const startIdx = lines.findIndex(l => l.trim().startsWith('```'));
        const endIdx = lines.findIndex((l, i) => i > startIdx && l.trim().startsWith('```'));
        if (startIdx >= 0 && endIdx > startIdx) {
          jsonText = lines.slice(startIdx + 1, endIdx).join('\n');
        }
      }
      
      parseResult = JSON.parse(jsonText);
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError.message);
      console.error('Response text (first 500 chars):', result.text.substring(0, 500));
      // Return fallback draft instead of failing
      return NextResponse.json({
        ok: true,
        scaffold: {
          summary: 'This appears to be a claim or framing that needs clarification.',
          assumptions: ['The claim assumes missing context.'],
          evidence: [],
          constraints: ['What evidence supports this is not shown.'],
          tradeoffs: ['The claim could be interpreted differently depending on context.'],
          whatWouldChangeAnalysis: [],
        },
        fallback: true,
      });
    }
    
    // Validate structure - if invalid, return fallback draft
    if (
      typeof parseResult.summary !== 'string' ||
      !Array.isArray(parseResult.assumptions) ||
      !Array.isArray(parseResult.evidence) ||
      !Array.isArray(parseResult.constraints) ||
      !Array.isArray(parseResult.tradeoffs)
    ) {
      console.error('Invalid response structure from Omega RC');
      // Return fallback draft instead of failing
      return NextResponse.json({
        ok: true,
        scaffold: {
          summary: 'This appears to be a claim or framing that needs clarification.',
          assumptions: ['The claim assumes missing context.'],
          evidence: [],
          constraints: ['What evidence supports this is not shown.'],
          tradeoffs: ['The claim could be interpreted differently depending on context.'],
          whatWouldChangeAnalysis: [],
        },
        fallback: true,
      });
    }

    const scaffold = {
      summary: parseResult.summary || '',
      assumptions: parseResult.assumptions || [],
      evidence: parseResult.evidence || [],
      constraints: parseResult.constraints || [],
      tradeoffs: parseResult.tradeoffs || [],
      whatWouldChangeAnalysis: parseResult.whatWouldChangeAnalysis || [],
    };

    return NextResponse.json({
      ok: true,
      scaffold,
      omegaMeta: result.omegaMeta,
    });
  } catch (error: any) {
    console.error('Unexpected error in scaffold route:', error);
    // Return fallback draft instead of failing - claim mode must NEVER fail
    return NextResponse.json({
      ok: true,
      scaffold: {
        summary: 'This appears to be a claim or framing that needs clarification.',
        assumptions: ['The claim assumes missing context.'],
        evidence: [],
        constraints: ['What evidence supports this is not shown.'],
        tradeoffs: ['The claim could be interpreted differently depending on context.'],
      },
      fallback: true,
    });
  }
}

