/**
 * Style Enforcer
 * 
 * Applies style profile to tutor turn plans, enforcing age-appropriate
 * and ND-friendly responses. Deterministic rules only.
 * 
 * Version: 0.1
 */

import { TutorTurnPlan } from "../dialogue/DialogTypes"
import { parseStyleHints, ParsedStyleHints } from "./StyleTypes"

/**
 * Applies style profile to tutor turn plan.
 * Modifies message, questions, and tone based on style hints.
 * Deterministic - same input always produces same output.
 */
export function applyStyleToTutorTurn(
  plan: TutorTurnPlan,
  responseStyleHint: string
): TutorTurnPlan {
  if (!responseStyleHint || responseStyleHint.trim() === "") {
    return plan // No style to apply
  }
  
  const hints = parseStyleHints(responseStyleHint)
  let modifiedPlan = { ...plan }
  
  // Enforce question count limits
  if (hints.calmMode || hints.oneQuestion) {
    // Calm mode or one question: max 1 question
    modifiedPlan.questions = modifiedPlan.questions.slice(0, 1)
  } else if (hints.twoQuestionsMax) {
    // Two questions max
    modifiedPlan.questions = modifiedPlan.questions.slice(0, 2)
  }
  
  // Enforce turn length (shorten message if needed)
  if (hints.veryShort) {
    modifiedPlan.message = shortenMessage(modifiedPlan.message, 50) // ~50 words max
  } else if (hints.short) {
    modifiedPlan.message = shortenMessage(modifiedPlan.message, 75) // ~75 words max
  } else if (hints.mediumLength) {
    modifiedPlan.message = shortenMessage(modifiedPlan.message, 120) // ~120 words max
  }
  
  // Apply example-first framing if requested
  if (hints.examplesFirst && !modifiedPlan.message.toLowerCase().includes("example")) {
    modifiedPlan.message = addExampleFirstFraming(modifiedPlan.message, hints)
  }
  
  // Apply tone markers
  if (hints.playfulTone) {
    modifiedPlan.message = addPlayfulTone(modifiedPlan.message)
  } else if (hints.calmMode || hints.encouragingTone) {
    modifiedPlan.message = addCalmTone(modifiedPlan.message)
  }
  
  // Add ND-friendly elements
  if (hints.calmMode) {
    modifiedPlan.message = addNDFriendlyElements(modifiedPlan.message)
  }
  
  // Simplify language if requested
  if (hints.simpleLanguage) {
    modifiedPlan.message = simplifyLanguage(modifiedPlan.message)
  }
  
  return modifiedPlan
}

/**
 * Shortens message to approximately maxWords.
 */
function shortenMessage(message: string, maxWords: number): string {
  const words = message.split(/\s+/)
  if (words.length <= maxWords) {
    return message
  }
  
  // Take first maxWords words, try to end at sentence boundary
  const truncated = words.slice(0, maxWords).join(' ')
  const lastPeriod = truncated.lastIndexOf('.')
  const lastQuestion = truncated.lastIndexOf('?')
  const lastExclamation = truncated.lastIndexOf('!')
  const lastPunctuation = Math.max(lastPeriod, lastQuestion, lastExclamation)
  
  if (lastPunctuation > maxWords * 0.7) {
    // If we have punctuation in the last 30%, use it
    return truncated.substring(0, lastPunctuation + 1)
  }
  
  // Otherwise, add ellipsis
  return truncated + "..."
}

/**
 * Adds example-first framing to message.
 */
function addExampleFirstFraming(message: string, hints: ParsedStyleHints): string {
  const examplePhrases = [
    "Let me show you an example first: ",
    "Here's an example to start: ",
    "Let's look at an example: "
  ]
  
  // Don't add if message already starts with example framing
  const lowerMessage = message.toLowerCase()
  if (lowerMessage.includes("example") || lowerMessage.includes("let's look") || lowerMessage.includes("here's")) {
    return message
  }
  
  // Add example framing at the start
  const phrase = hints.playfulTone ? examplePhrases[1] : examplePhrases[0]
  return phrase + message
}

/**
 * Adds playful tone markers.
 */
function addPlayfulTone(message: string): string {
  // Don't modify if already playful
  if (message.includes("!") || message.includes("😊") || message.toLowerCase().includes("great") || message.toLowerCase().includes("awesome")) {
    return message
  }
  
  // Add encouraging exclamation if appropriate
  const sentences = message.split(/([.!?])\s+/)
  if (sentences.length > 0 && !sentences[0].endsWith('!')) {
    // Add gentle encouragement
    return message.replace(/^([^.!?]+)([.!?])/, (match, first, punct) => {
      if (punct === '.') {
        return first + '!' + (match.length > first.length + 1 ? match.substring(first.length + 1) : '')
      }
      return match
    })
  }
  
  return message
}

/**
 * Adds calm, encouraging tone.
 */
function addCalmTone(message: string): string {
  // Ensure message doesn't feel rushed or pressured
  const calmPhrases = [
    "Take your time",
    "No rush",
    "When you're ready",
    "That's okay"
  ]
  
  // Don't add if already calm
  const lowerMessage = message.toLowerCase()
  if (calmPhrases.some(phrase => lowerMessage.includes(phrase.toLowerCase()))) {
    return message
  }
  
  // Add calm framing if message feels urgent
  if (lowerMessage.includes("hurry") || lowerMessage.includes("quickly") || lowerMessage.includes("fast")) {
    return message.replace(/(hurry|quickly|fast)/gi, "when you're ready")
  }
  
  return message
}

/**
 * Adds ND-friendly elements (explicit permission, break suggestions).
 */
function addNDFriendlyElements(message: string): string {
  let modified = message
  
  // Add explicit "I don't know" permission if not present
  const lowerMessage = message.toLowerCase()
  if (!lowerMessage.includes("don't know") && !lowerMessage.includes("not sure") && !lowerMessage.includes("uncertain")) {
    // Add at end if it's a question
    if (message.trim().endsWith('?')) {
      modified = message + " (It's okay if you're not sure!)"
    }
  }
  
  // Add break suggestion if message is long or complex
  const wordCount = message.split(/\s+/).length
  if (wordCount > 40 && !lowerMessage.includes("pause") && !lowerMessage.includes("break")) {
    modified = modified + " (Want a 30-second pause? Just let me know!)"
  }
  
  return modified
}

/**
 * Simplifies language for younger learners.
 */
function simplifyLanguage(message: string): string {
  // Replace complex words with simpler alternatives
  const replacements: Record<string, string> = {
    "understand": "get",
    "comprehend": "get",
    "demonstrate": "show",
    "illustrate": "show",
    "utilize": "use",
    "facilitate": "help",
    "analyze": "look at",
    "synthesize": "put together",
    "evaluate": "think about"
  }
  
  let simplified = message
  Object.entries(replacements).forEach(([complex, simple]) => {
    const regex = new RegExp(`\\b${complex}\\b`, 'gi')
    simplified = simplified.replace(regex, simple)
  })
  
  // Break up long sentences (simplified approach)
  const words = simplified.split(/\s+/)
  if (words.length > 30) {
    // For very long messages, try to break at sentence boundaries
    const sentences = simplified.split(/([.!?])\s+/)
    if (sentences.length > 1) {
      // Already has sentence breaks, return as is
      return simplified
    }
    // Single long sentence - try to break at commas
    const parts = simplified.split(/,/)
    if (parts.length > 1) {
      return parts.map(p => p.trim()).filter(p => p.length > 0).join('. ') + '.'
    }
  }
  
  return simplified
}

