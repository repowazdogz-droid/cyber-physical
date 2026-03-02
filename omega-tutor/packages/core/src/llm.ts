/**
 * Model integration boundary: abstract LLM interface.
 * V1: generate_probe, analyze_response. Swap providers by implementing this interface.
 */

export interface ProbeContext {
  conceptId: string;
  conceptName?: string;
  grammarLabel?: string;
  surfaceFormFamily?: string;
  learnerHistorySummary?: string;
}

export interface GeneratedProbe {
  promptContent: string;
  surfaceFormFamily: string;
  grammarLabel: string;
  targetConceptId: string;
  promptContentRef: string;
}

export interface AnalyzeContext {
  probePrompt: string;
  probeSurfaceFormFamily: string;
  probeGrammarLabel: string;
  conceptId: string;
  userText: string;
}

export interface ObservationFeatures {
  grammarLabel: string;
  matchStrength: number;
  parsedFeatures: Record<string, unknown>;
  suggestedNextAction: "follow_up" | "probe_again" | "repair" | "continue";
}

export interface LLMProvider {
  generateProbe(context: ProbeContext): Promise<GeneratedProbe>;
  analyzeResponse(context: AnalyzeContext): Promise<ObservationFeatures>;
}
