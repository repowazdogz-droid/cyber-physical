/**
 * Style Types
 * 
 * Defines types for style-aware tutor responses.
 * 
 * Version: 0.1
 */

export type TurnLength = "short" | "medium" | "long"
export type Tone = "playful" | "calm" | "neutral"
export type ScaffoldAggressiveness = "low" | "medium" | "high"

/**
 * Style profile derived from age band, mission, and calm mode.
 */
export interface StyleProfile {
  turnLength: TurnLength
  questionCountMax: number // 1-3
  optionsCountMax: number // 3-5 chips
  tone: Tone
  scaffoldAggressiveness: ScaffoldAggressiveness
  showExamplesFirst: boolean
  responseStyleHint: string // Comma-separated hints like "very_short, one_question, examples_first, playful_tone"
}

/**
 * Parses responseStyleHint string into structured hints.
 */
export interface ParsedStyleHints {
  veryShort?: boolean
  short?: boolean
  mediumLength?: boolean
  fullLength?: boolean
  oneQuestion?: boolean
  twoQuestionsMax?: boolean
  examplesFirst?: boolean
  explanationFocused?: boolean
  practiceMode?: boolean
  playfulTone?: boolean
  calmMode?: boolean
  encouragingTone?: boolean
  simpleLanguage?: boolean
  critiqueFriendly?: boolean
  assessmentReady?: boolean
  verificationFocused?: boolean
  flexibleScaffolding?: boolean
}

/**
 * Parses responseStyleHint string into structured hints.
 */
export function parseStyleHints(hint: string): ParsedStyleHints {
  const hints: ParsedStyleHints = {}
  const parts = hint.split(',').map(p => p.trim().toLowerCase())
  
  parts.forEach(part => {
    if (part === "very_short") hints.veryShort = true
    if (part === "short") hints.short = true
    if (part === "medium_length") hints.mediumLength = true
    if (part === "full_length") hints.fullLength = true
    if (part === "one_question") hints.oneQuestion = true
    if (part === "two_questions_max") hints.twoQuestionsMax = true
    if (part === "examples_first") hints.examplesFirst = true
    if (part === "explanation_focused") hints.explanationFocused = true
    if (part === "practice_mode") hints.practiceMode = true
    if (part === "playful_tone") hints.playfulTone = true
    if (part === "calm_mode") hints.calmMode = true
    if (part === "encouraging_tone") hints.encouragingTone = true
    if (part === "simple_language") hints.simpleLanguage = true
    if (part === "critique_friendly") hints.critiqueFriendly = true
    if (part === "assessment_ready") hints.assessmentReady = true
    if (part === "verification_focused") hints.verificationFocused = true
    if (part === "flexible_scaffolding") hints.flexibleScaffolding = true
  })
  
  return hints
}








































