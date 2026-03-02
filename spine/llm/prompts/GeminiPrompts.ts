/**
 * Gemini Prompt Templates
 * 
 * Bounded prompt builders for LLM-assisted features.
 * All prompts enforce: no speculation, bounded outputs, JSON where required.
 * 
 * Version: 1.0.0
 */

export function draftKernelSpecFromText(inputText: string): string {
  return `You are a kernel specification assistant. Convert the following description into a valid KernelSpec JSON.

Requirements:
- Output ONLY valid JSON (no markdown fences, no explanations)
- Match the KernelSpec schema exactly
- If information is missing or unclear, use outcomeId "UNKNOWN" with confidence "Unknown"
- Add any uncertainties to a "warnings" array in the description field
- Keep all strings within their bounds (name ≤ 200, description ≤ 500, etc.)
- Maximum 20 outcomes, 20 policies, 10 overrides, 10 disallows

Input description:
${inputText.substring(0, 20000)}

Output a KernelSpec JSON object with these fields:
- version: string (e.g., "1.0.0")
- kernelId: string (kebab-case identifier)
- adapterId: string (e.g., "spec:demo")
- name: string (≤ 200 chars)
- description: string (≤ 500 chars, include warnings array if uncertain)
- outcomes: array of OutcomeMapping (max 20)
  - Each outcome: { outcomeId, label, conditions[], confidence, rationale }
- policies?: array of PolicySpec (max 20, optional)
- overrides?: array of OverrideSpec (max 10, optional)
- disallows?: array of DisallowSpec (max 10, optional)

Return ONLY the JSON object, no markdown, no code fences.`;
}

export function explainKernelRunBounded(
  runSummary: {
    outcome?: { id?: string; label?: string; subtitle?: string };
    claims?: Array<{ id?: string; text?: string; severity?: string }>;
    policyNotes?: string[];
    reasoningHighlights?: Array<{ title?: string; sentence?: string }>;
  },
  mode: 'bullets' | 'plain' = 'bullets'
): string {
  const summary = JSON.stringify(runSummary, null, 2);
  
  if (mode === 'plain') {
    return `You are an explainability assistant. Explain this kernel run result in plain language for a non-technical audience.

Constraints:
- Write 3-5 short sentences (not bullets)
- Maximum 900 characters total
- No speculation beyond what's in the summary
- Focus on: what happened, why it matters, key factors
- Use simple, clear language

Summary:
${summary}

Provide a plain-language explanation in 3-5 sentences, max 900 chars total.`;
  }
  
  return `You are an explainability assistant. Provide a brief explanation of this kernel run summary.

Constraints:
- Output 5-8 bullet points
- Maximum 900 characters total
- No speculation beyond what's in the summary
- Focus on: outcome, key claims, policy notes, highlights
- Use plain text bullets (no markdown formatting)

Summary:
${summary}

Provide a brief explanation as 5-8 bullet points, max 900 chars total.`;
}

export function explainRegressionDiffBounded(diffSummary: {
  changed?: string[];
  added?: string[];
  removed?: string[];
  critical?: boolean;
}): string {
  const summary = JSON.stringify(diffSummary, null, 2);
  
  return `You are a regression analysis assistant. Explain what changed in this diff summary.

Constraints:
- Output 3-6 bullet points
- Focus on: what changed and why it matters
- No speculation beyond the summary
- Maximum 600 characters total
- Use plain text bullets (no markdown formatting)

Diff summary:
${summary}

Explain what changed and why it matters in 3-6 bullet points, max 600 chars total.`;
}

export function generateDiscussionQuestionsBounded(contextSummary: {
  topic?: string;
  artifacts?: string[];
  outcomes?: string[];
}): string {
  const summary = JSON.stringify(contextSummary, null, 2);
  
  return `You are a discussion facilitator. Generate 3-5 short questions based on this context.

Constraints:
- Output ONLY valid JSON array of strings
- Each question ≤ 120 characters
- 3-5 questions total
- Questions should be open-ended and relevant to the context
- No markdown fences, no explanations, just JSON array

Context:
${summary}

Return a JSON array of 3-5 question strings, each ≤ 120 chars. Example: ["Question 1?", "Question 2?", "Question 3?"]`;
}

