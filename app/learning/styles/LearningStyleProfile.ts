/**
 * Learning Style Profile
 * 
 * Derives UI and interaction style from age band, ND needs, and session goals.
 * Shapes input/output without modifying core engines.
 * 
 * Version: 0.1
 */

import { AgeBand } from '../../../spine/learning/platform/LearnerTypes'
import { MissionId } from '../topics/topicLibrary'

export type TurnLength = "short" | "medium" | "long"
export type Tone = "playful" | "calm" | "neutral"
export type ScaffoldAggressiveness = "low" | "medium" | "high"

export interface LearningStyleProfile {
  turnLength: TurnLength
  questionCountMax: number // 1-3
  optionsCountMax: number // 3-5 chips
  tone: Tone
  scaffoldAggressiveness: ScaffoldAggressiveness
  showExamplesFirst: boolean
  showSkillsPanel: boolean // Hide in calm mode
  showAssessmentPanel: boolean // Hide in calm mode
  responseStyleHint: string // Passed to API as hint
}

/**
 * Derives learning style profile from context.
 */
export function deriveStyleProfile(
  ageBand: AgeBand,
  missionId: MissionId | undefined,
  calmMode: boolean = false,
  readingLevel?: "beginner" | "intermediate" | "advanced"
): LearningStyleProfile {
  const isMinor = ageBand !== AgeBand.ADULT
  const isVeryYoung = ageBand === AgeBand.SIX_TO_NINE || ageBand === AgeBand.TEN_TO_TWELVE
  
  // Default to calm mode for minors
  const effectiveCalmMode = calmMode || isMinor
  
  // Age-based defaults
  let turnLength: TurnLength = "medium"
  let questionCountMax = 2
  let optionsCountMax = 5
  let tone: Tone = "neutral"
  let scaffoldAggressiveness: ScaffoldAggressiveness = "medium"
  let showExamplesFirst = false
  let responseStyleHint = ""
  
  switch (ageBand) {
    case AgeBand.SIX_TO_NINE:
      turnLength = "short"
      questionCountMax = 1
      optionsCountMax = 3
      tone = "playful"
      scaffoldAggressiveness = "high"
      showExamplesFirst = true
      responseStyleHint = "very_short, one_question, examples_first, playful_tone"
      break
      
    case AgeBand.TEN_TO_TWELVE:
      turnLength = "short"
      questionCountMax = 1
      optionsCountMax = 4
      tone = "playful"
      scaffoldAggressiveness = "high"
      showExamplesFirst = true
      responseStyleHint = "short, one_question, examples_first, encouraging_tone"
      break
      
    case AgeBand.THIRTEEN_TO_FIFTEEN:
      turnLength = "medium"
      questionCountMax = 2
      optionsCountMax = 5
      tone = "neutral"
      scaffoldAggressiveness = "medium"
      showExamplesFirst = false
      responseStyleHint = "medium_length, two_questions_max, critique_friendly"
      break
      
    case AgeBand.SIXTEEN_TO_EIGHTEEN:
      turnLength = "medium"
      questionCountMax = 2
      optionsCountMax = 5
      tone = "neutral"
      scaffoldAggressiveness = "low"
      showExamplesFirst = false
      responseStyleHint = "medium_length, assessment_ready, verification_focused"
      break
      
    case AgeBand.ADULT:
      turnLength = "long"
      questionCountMax = 3
      optionsCountMax = 5
      tone = "neutral"
      scaffoldAggressiveness = "low"
      showExamplesFirst = false
      responseStyleHint = "full_length, flexible_scaffolding"
      break
  }
  
  // Mission-based adjustments
  if (missionId === "practice") {
    scaffoldAggressiveness = "high"
    showExamplesFirst = true
    responseStyleHint += ", practice_mode"
  } else if (missionId === "understand") {
    responseStyleHint += ", explanation_focused"
  }
  
  // Calm mode adjustments (ND-friendly)
  if (effectiveCalmMode) {
    optionsCountMax = Math.min(optionsCountMax, 3) // Max 3 visible chips
    tone = "calm"
    responseStyleHint += ", calm_mode"
  }
  
  // Reading level adjustments
  if (readingLevel === "beginner") {
    turnLength = "short"
    questionCountMax = 1
    responseStyleHint += ", simple_language"
  }
  
  return {
    turnLength,
    questionCountMax,
    optionsCountMax,
    tone,
    scaffoldAggressiveness,
    showExamplesFirst,
    showSkillsPanel: !effectiveCalmMode, // Hide in calm mode
    showAssessmentPanel: !effectiveCalmMode, // Hide in calm mode
    responseStyleHint: responseStyleHint.trim()
  }
}

/**
 * Generates "next best step" guidance based on style profile and last action.
 */
export function getNextBestStep(
  styleProfile: LearningStyleProfile,
  lastAction?: string,
  tutorMessage?: string
): string {
  if (styleProfile.tone === "playful") {
    if (lastAction === "Ask me a question") {
      return "Think about what you already know, then share your thoughts!"
    }
    if (lastAction === "Give me a hint") {
      return "Try using the hint to make a guess, even if you're not sure!"
    }
    if (lastAction === "Let me try") {
      return "Great! Explain your thinking step by step."
    }
    return "What would you like to try next?"
  }
  
  if (styleProfile.tone === "calm") {
    if (lastAction === "Ask me a question") {
      return "Take your time to think, then respond when ready."
    }
    if (lastAction === "Give me a hint") {
      return "Use the hint to guide your thinking, no rush."
    }
    if (lastAction === "Let me try") {
      return "Share your approach, we'll work through it together."
    }
    return "Choose what feels right for you."
  }
  
  // Neutral/default
  if (lastAction === "Ask me a question") {
    return "Consider the question and share your reasoning."
  }
  if (lastAction === "Give me a hint") {
    return "Use the hint to guide your next step."
  }
  if (lastAction === "Let me try") {
    return "Explain your approach and we can refine it together."
  }
  return "What would you like to explore next?"
}








































