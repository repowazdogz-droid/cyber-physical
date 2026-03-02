/**
 * V1 stub LLM: returns structured JSON without calling an external API.
 * Replace with real provider (OpenAI/Anthropic) behind the same interface.
 */
import type { LLMProvider, ProbeContext, GeneratedProbe, AnalyzeContext, ObservationFeatures } from "@omega-tutor/core";

const STUB_PROMPTS: Record<string, string> = {
  force_implies_motion_direct:
    "A book lies at rest on a table. What is the net force on the book? Explain your reasoning in one or two sentences.",
  velocity_implies_force_direct:
    "An object is moving to the right. Does there have to be a force acting on it to the right? Explain.",
  action_reaction_cancel_direct:
    "When you push on a wall, the wall pushes back. Why don't these two forces cancel so that nothing moves?",
  n2_mass_inverse_direct:
    "Two objects experience the same net force. Object A has greater mass than Object B. Which has the greater acceleration? Explain.",
};

export const stubLLM: LLMProvider = {
  async generateProbe(context: ProbeContext): Promise<GeneratedProbe> {
    const ref = context.grammarLabel
      ? `${context.grammarLabel}_${context.surfaceFormFamily ?? "direct"}`
      : "force_implies_motion_direct";
    const promptContent = STUB_PROMPTS[ref] ?? STUB_PROMPTS.force_implies_motion_direct;
    return {
      promptContent,
      surfaceFormFamily: context.surfaceFormFamily ?? "direct_question",
      grammarLabel: context.grammarLabel ?? "force_implies_motion",
      targetConceptId: context.conceptId,
      promptContentRef: ref,
    };
  },

  async analyzeResponse(context: AnalyzeContext): Promise<ObservationFeatures> {
    const text = context.userText.toLowerCase();
    let matchStrength = 0.3;
    if (text.includes("zero") || text.includes("no net") || text.includes("balanced")) matchStrength = 0.85;
    if (text.includes("newton") || text.includes("first law")) matchStrength = Math.max(matchStrength, 0.7);
    return {
      grammarLabel: context.probeGrammarLabel,
      matchStrength,
      parsedFeatures: { length: context.userText.length, hasReasoning: context.userText.length > 20 },
      suggestedNextAction: matchStrength >= 0.7 ? "continue" : "follow_up",
    };
  },
};
