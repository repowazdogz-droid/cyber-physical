/**
 * Thought Extractors
 * 
 * Deterministic extraction of thought cards from tutor turns.
 * Simple parsing rules, max 3 cards per turn.
 * 
 * Version: 0.1
 */

import { ThoughtCard, ThoughtCardType } from './ThoughtTypes'
import { LearningStyleProfile } from '../styles/LearningStyleProfile'

/**
 * Extracts thought cards from a tutor turn message.
 * Deterministic, max 3 cards.
 */
export function extractThoughtCardsFromTutorTurn(
  tutorMessage: string,
  turnIndex: number,
  styleProfile: LearningStyleProfile
): ThoughtCard[] {
  const cards: ThoughtCard[] = []
  const timestamp = new Date().toISOString()
  
  // Simple parsing rules (deterministic)
  const sentences = tutorMessage.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  // Rule 1: Questions (sentences ending with ?)
  const questions = sentences.filter(s => s.trim().endsWith('?'))
  if (questions.length > 0) {
    // Take first question (most important)
    cards.push({
      id: `card-${turnIndex}-q-${Date.now()}`,
      type: "Question",
      text: questions[0].trim(),
      createdAtIso: timestamp,
      sourceTurnIndex: turnIndex
    })
  }
  
  // Rule 2: Examples (sentences containing "example", "for instance", "like")
  const exampleKeywords = ['example', 'for instance', 'like', 'such as', 'imagine']
  const exampleSentences = sentences.filter(s => 
    exampleKeywords.some(keyword => s.toLowerCase().includes(keyword))
  )
  if (exampleSentences.length > 0 && cards.length < 3) {
    cards.push({
      id: `card-${turnIndex}-ex-${Date.now()}`,
      type: "Example",
      text: exampleSentences[0].trim(),
      createdAtIso: timestamp,
      sourceTurnIndex: turnIndex
    })
  }
  
  // Rule 3: Hints (sentences containing "hint", "try", "consider", "think about")
  const hintKeywords = ['hint', 'try', 'consider', 'think about', 'remember', 'note']
  const hintSentences = sentences.filter(s => 
    hintKeywords.some(keyword => s.toLowerCase().includes(keyword))
  )
  if (hintSentences.length > 0 && cards.length < 3) {
    cards.push({
      id: `card-${turnIndex}-h-${Date.now()}`,
      type: "Hint",
      text: hintSentences[0].trim(),
      createdAtIso: timestamp,
      sourceTurnIndex: turnIndex
    })
  }
  
  // Rule 4: Rules (sentences containing "always", "never", "must", "should")
  const ruleKeywords = ['always', 'never', 'must', 'should', 'rule', 'principle']
  const ruleSentences = sentences.filter(s => 
    ruleKeywords.some(keyword => s.toLowerCase().includes(keyword))
  )
  if (ruleSentences.length > 0 && cards.length < 3) {
    cards.push({
      id: `card-${turnIndex}-r-${Date.now()}`,
      type: "Rule",
      text: ruleSentences[0].trim(),
      createdAtIso: timestamp,
      sourceTurnIndex: turnIndex
    })
  }
  
  // Rule 5: Next steps (sentences containing "next", "then", "after", "now")
  const nextStepKeywords = ['next', 'then', 'after', 'now', 'step']
  const nextStepSentences = sentences.filter(s => 
    nextStepKeywords.some(keyword => s.toLowerCase().includes(keyword))
  )
  if (nextStepSentences.length > 0 && cards.length < 3) {
    cards.push({
      id: `card-${turnIndex}-ns-${Date.now()}`,
      type: "NextStep",
      text: nextStepSentences[0].trim(),
      createdAtIso: timestamp,
      sourceTurnIndex: turnIndex
    })
  }
  
  // Return max 3 cards
  return cards.slice(0, 3)
}

/**
 * Creates a learner attempt card.
 */
export function createLearnerAttemptCard(
  learnerText: string,
  turnIndex: number
): ThoughtCard {
  return {
    id: `card-${turnIndex}-attempt-${Date.now()}`,
    type: "LearnerAttempt",
    text: learnerText,
    createdAtIso: new Date().toISOString(),
    sourceTurnIndex: turnIndex
  }
}

/**
 * Creates a checkpoint card from a guided path step.
 */
export function createCheckpointCard(
  stepTitle: string,
  expectedArtifact: string,
  stepId: string
): ThoughtCard {
  return {
    id: `card-checkpoint-${stepId}-${Date.now()}`,
    type: "Rule", // Checkpoints are rules/guidelines
    text: `${stepTitle}: ${expectedArtifact}`,
    createdAtIso: new Date().toISOString(),
    stepId
  }
}








































