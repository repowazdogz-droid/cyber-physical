/**
 * Guided Path Runner
 * 
 * Pure helpers to track path progress: current step, completion, etc.
 * Deterministic and bounded.
 * 
 * Version: 0.1
 */

import { GuidedPath, PathStep } from './pathLibrary'

export interface PathProgress {
  pathId: string
  currentStepIndex: number
  stepStartedAt: string
  stepCompletedAt?: string
  completedSteps: string[] // Step IDs that are complete
  pathCompleted: boolean
}

/**
 * Creates initial path progress.
 */
export function createPathProgress(path: GuidedPath): PathProgress {
  return {
    pathId: path.id,
    currentStepIndex: 0,
    stepStartedAt: new Date().toISOString(),
    completedSteps: [],
    pathCompleted: false
  }
}

/**
 * Gets the current step from progress.
 */
export function getCurrentStep(progress: PathProgress, path: GuidedPath): PathStep | undefined {
  if (progress.pathCompleted || progress.currentStepIndex >= path.steps.length) {
    return undefined
  }
  return path.steps[progress.currentStepIndex]
}

/**
 * Checks if a step is complete based on completion criteria and action.
 */
export function isStepComplete(
  step: PathStep,
  action: string,
  hasMessage: boolean
): boolean {
  switch (step.completionCriteria) {
    case "message_sent":
      return hasMessage
    case "try_chip":
      return action === "Let me try" || action === "try_chip"
    case "example_chip":
      return action === "Show an example" || action === "example_chip"
    case "question_chip":
      return action === "Ask me a question" || action === "question_chip"
    default:
      return false
  }
}

/**
 * Advances to the next step if current step is complete.
 */
export function advanceStep(
  progress: PathProgress,
  path: GuidedPath,
  action: string,
  hasMessage: boolean
): PathProgress {
  const currentStep = getCurrentStep(progress, path)
  if (!currentStep) {
    return progress // Already completed or invalid
  }

  // Check if current step is complete
  if (!isStepComplete(currentStep, action, hasMessage)) {
    return progress // Not complete yet
  }

  // Mark current step as complete
  const completedSteps = [...progress.completedSteps, currentStep.id]
  const nextStepIndex = progress.currentStepIndex + 1
  const pathCompleted = nextStepIndex >= path.steps.length

  return {
    ...progress,
    currentStepIndex: pathCompleted ? progress.currentStepIndex : nextStepIndex,
    stepCompletedAt: new Date().toISOString(),
    completedSteps,
    pathCompleted,
    stepStartedAt: pathCompleted ? progress.stepStartedAt : new Date().toISOString()
  }
}

/**
 * Gets progress summary (e.g., "Step 2 of 4").
 */
export function getProgressSummary(progress: PathProgress, path: GuidedPath): string {
  if (progress.pathCompleted) {
    return `Completed: ${path.steps.length} steps`
  }
  return `Step ${progress.currentStepIndex + 1} of ${path.steps.length}`
}

/**
 * Generates session summary when path is completed.
 */
export function generateSessionSummary(
  path: GuidedPath,
  progress: PathProgress,
  topic: string
): string[] {
  const bullets: string[] = []
  
  // What learner practiced
  bullets.push(`Practiced: ${path.title} (${topic})`)
  
  // Steps completed
  const stepsCompleted = progress.completedSteps.length
  bullets.push(`Completed ${stepsCompleted} steps: ${path.steps.map(s => s.title).join(", ")}`)
  
  // What to try next
  if (path.missionId === "understand") {
    bullets.push("Next: Try the practice path to build fluency")
  } else if (path.missionId === "practice") {
    bullets.push("Next: Try explaining concepts back or moving to a new topic")
  }
  
  // Note about progress (no grades/scores)
  bullets.push("Learner showed engagement and completed all steps")
  
  return bullets.slice(0, 4) // Max 4 bullets
}

/**
 * Determines if teach-back should be triggered for a step.
 * Triggers on step completion OR on final step.
 */
export function shouldTriggerTeachBack(
  step: PathStep | undefined,
  progress: PathProgress,
  path: GuidedPath
): boolean {
  if (!step) return false
  
  // Trigger on any step completion
  if (progress.completedSteps.includes(step.id)) {
    return true
  }
  
  // Trigger on final step (even if not completed yet)
  if (progress.currentStepIndex === path.steps.length - 1) {
    return true
  }
  
  return false
}

/**
 * Builds a teach-back utterance for the API.
 */
export function buildTeachBackUtterance(
  userText: string,
  topic: string,
  microTopic?: string
): string {
  const topicPart = microTopic ? `${topic} → ${microTopic}` : topic
  return `Teach it back: Here's my explanation of ${topicPart}: ${userText}. Ask me 1 gentle question to improve it.`
}

