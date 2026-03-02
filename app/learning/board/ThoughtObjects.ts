/**
 * Thought Objects
 * 
 * Pure data types for thought objects in the learning board.
 * No UI, no logic, no judgments.
 * XR-ready by design.
 * 
 * Version: 0.1
 * 
 * TODO: Future migration to /spine/contracts/ThoughtObjectContracts.ts
 * - ThoughtObject → ThoughtObjectContract (add contractVersion)
 * - ThoughtObjectType → ThoughtObjectType enum from contracts
 * - ThoughtObjectSource → ThoughtObjectSource enum from contracts
 */

export type ThoughtObjectType = 
  | "LearnerAttempt"
  | "TutorHint"
  | "Example"
  | "Question"
  | "Evidence"
  | "Uncertainty"
  | "Reflection"

export type ThoughtObjectSource = "learner" | "tutor" | "system"

export type ConfidenceLevel = "low" | "medium" | "high" | "unknown"

/**
 * Base ThoughtObject interface.
 * All thought objects must include these fields.
 * 
 * TODO: Migrate to ThoughtObjectContract from /spine/contracts/ThoughtObjectContracts.ts
 */
export interface ThoughtObject {
  id: string
  type: ThoughtObjectType
  content: string | StructuredContent
  source: ThoughtObjectSource
  timestamp: string
  confidence?: ConfidenceLevel
  relatedStepId?: string
  ephemeral?: boolean
}

/**
 * Structured content for complex thought objects.
 */
export interface StructuredContent {
  title?: string
  body: string
  items?: string[]
}

/**
 * LearnerAttempt: A learner's attempt at solving or explaining.
 */
export interface LearnerAttempt extends ThoughtObject {
  type: "LearnerAttempt"
  source: "learner"
}

/**
 * TutorHint: A hint or guidance from the tutor.
 */
export interface TutorHint extends ThoughtObject {
  type: "TutorHint"
  source: "tutor"
}

/**
 * Example: An example provided by tutor or learner.
 */
export interface Example extends ThoughtObject {
  type: "Example"
  source: "learner" | "tutor"
}

/**
 * Question: A question asked by learner or tutor.
 */
export interface Question extends ThoughtObject {
  type: "Question"
  source: "learner" | "tutor"
}

/**
 * Evidence: Evidence or reasoning provided.
 */
export interface Evidence extends ThoughtObject {
  type: "Evidence"
  source: "learner" | "tutor"
}

/**
 * Uncertainty: An expression of uncertainty or doubt.
 */
export interface Uncertainty extends ThoughtObject {
  type: "Uncertainty"
  source: "learner" | "tutor"
  confidence: "low" | "unknown" // Uncertainty is always low/unknown confidence
}

/**
 * Reflection: A reflection on learning or process.
 */
export interface Reflection extends ThoughtObject {
  type: "Reflection"
  source: "learner" | "tutor"
}

/**
 * Type guard to check if content is structured.
 */
export function isStructuredContent(content: string | StructuredContent): content is StructuredContent {
  return typeof content === 'object' && content !== null && 'body' in content
}

/**
 * Extracts plain text from content (for display/search).
 */
export function extractText(content: string | StructuredContent): string {
  if (typeof content === 'string') {
    return content
  }
  
  let text = content.body
  if (content.title) {
    text = `${content.title}: ${text}`
  }
  if (content.items && content.items.length > 0) {
    text += '\n' + content.items.join('\n')
  }
  
  return text
}

