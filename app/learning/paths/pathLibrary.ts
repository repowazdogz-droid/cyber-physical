/**
 * Guided Path Library
 * 
 * Age-banded guided paths (3-6 steps) for structured learning journeys.
 * Each path has clear steps with expected artifacts.
 * 
 * Version: 0.1
 */

import { AgeBand } from '../../../spine/learning/platform/LearnerTypes'
import { MissionId } from '../topics/topicLibrary'

export interface PathStep {
  id: string
  title: string
  description: string
  prompt: string
  expectedArtifact: string // "1 sentence", "1 example", "your attempt", etc.
  completionCriteria: "message_sent" | "try_chip" | "example_chip" | "question_chip"
}

export interface GuidedPath {
  id: string
  ageBand: AgeBand
  missionId: MissionId
  topicId: string
  title: string
  description: string
  steps: PathStep[]
}

/**
 * Get a guided path for the given context.
 * Returns undefined if no path matches.
 */
export function getGuidedPath(
  ageBand: AgeBand,
  missionId: MissionId | undefined,
  topicId: string
): GuidedPath | undefined {
  if (!missionId) return undefined

  // Find matching path
  const paths = getAllPaths()
  return paths.find(
    p => p.ageBand === ageBand && 
         p.missionId === missionId && 
         p.topicId === topicId
  )
}

/**
 * Get all available paths (seeded data).
 */
function getAllPaths(): GuidedPath[] {
  return [
    // Age 6-9: Understand - Addition
    {
      id: "understand-add-6-9",
      ageBand: AgeBand.SIX_TO_NINE,
      missionId: "understand",
      topicId: "addition",
      title: "Understanding Addition",
      description: "Learn how to add numbers step by step",
      steps: [
        {
          id: "step-1",
          title: "Warm-up",
          description: "Let's start with what you know",
          prompt: "Can you tell me what addition means? Use your own words.",
          expectedArtifact: "1 sentence",
          completionCriteria: "message_sent"
        },
        {
          id: "step-2",
          title: "Try one yourself",
          description: "Practice with a simple problem",
          prompt: "Let's try adding 3 + 2. What do you think the answer is?",
          expectedArtifact: "your attempt",
          completionCriteria: "try_chip"
        },
        {
          id: "step-3",
          title: "Explain it back",
          description: "Show you understand",
          prompt: "Great! Can you explain how you got that answer?",
          expectedArtifact: "1 sentence",
          completionCriteria: "message_sent"
        }
      ]
    },
    // Age 6-9: Practice - Addition
    {
      id: "practice-add-6-9",
      ageBand: AgeBand.SIX_TO_NINE,
      missionId: "practice",
      topicId: "addition",
      title: "Practicing Addition",
      description: "Get better at adding numbers",
      steps: [
        {
          id: "step-1",
          title: "Warm-up",
          description: "Start with an easy one",
          prompt: "Let's warm up. What's 2 + 1?",
          expectedArtifact: "your attempt",
          completionCriteria: "try_chip"
        },
        {
          id: "step-2",
          title: "2 reps",
          description: "Try two more problems",
          prompt: "Good! Now try 4 + 3, then 5 + 2.",
          expectedArtifact: "2 attempts",
          completionCriteria: "try_chip"
        },
        {
          id: "step-3",
          title: "1 mixed problem",
          description: "One more to practice",
          prompt: "Last one! What's 6 + 4?",
          expectedArtifact: "your attempt",
          completionCriteria: "try_chip"
        }
      ]
    },
    // Age 10-12: Understand - Fractions
    {
      id: "understand-fractions-10-12",
      ageBand: AgeBand.TEN_TO_TWELVE,
      missionId: "understand",
      topicId: "fractions",
      title: "Understanding Fractions",
      description: "Learn how fractions work",
      steps: [
        {
          id: "step-1",
          title: "What are fractions?",
          description: "Start with the basics",
          prompt: "What do you think a fraction is? Give me an example.",
          expectedArtifact: "1 example",
          completionCriteria: "message_sent"
        },
        {
          id: "step-2",
          title: "Spot the mistake",
          description: "Find what's wrong",
          prompt: "I said 1/2 + 1/2 = 2/4. Is that right? What's wrong?",
          expectedArtifact: "your explanation",
          completionCriteria: "message_sent"
        },
        {
          id: "step-3",
          title: "Try one yourself",
          description: "Practice what you learned",
          prompt: "Now try adding 1/3 + 1/3. What do you get?",
          expectedArtifact: "your attempt",
          completionCriteria: "try_chip"
        },
        {
          id: "step-4",
          title: "Explain it back",
          description: "Show your understanding",
          prompt: "Can you explain how you added those fractions?",
          expectedArtifact: "1 sentence",
          completionCriteria: "message_sent"
        }
      ]
    },
    // Age 10-12: Practice - Fractions
    {
      id: "practice-fractions-10-12",
      ageBand: AgeBand.TEN_TO_TWELVE,
      missionId: "practice",
      topicId: "fractions",
      title: "Practicing Fractions",
      description: "Get better at working with fractions",
      steps: [
        {
          id: "step-1",
          title: "Warm-up",
          description: "Start with what you know",
          prompt: "Let's warm up. What's 1/2 + 1/2?",
          expectedArtifact: "your attempt",
          completionCriteria: "try_chip"
        },
        {
          id: "step-2",
          title: "2 reps",
          description: "Try two more",
          prompt: "Good! Now try 1/4 + 1/4, then 2/5 + 1/5.",
          expectedArtifact: "2 attempts",
          completionCriteria: "try_chip"
        },
        {
          id: "step-3",
          title: "1 mixed problem",
          description: "One more challenge",
          prompt: "Last one! What's 1/3 + 1/3?",
          expectedArtifact: "your attempt",
          completionCriteria: "try_chip"
        }
      ]
    },
    // Age 13-15: Understand - Algebra
    {
      id: "understand-algebra-13-15",
      ageBand: AgeBand.THIRTEEN_TO_FIFTEEN,
      missionId: "understand",
      topicId: "algebra",
      title: "Understanding Algebra",
      description: "Learn how to solve equations",
      steps: [
        {
          id: "step-1",
          title: "Brain dump",
          description: "What do you already know?",
          prompt: "What do you know about solving equations? Share anything that comes to mind.",
          expectedArtifact: "your thoughts",
          completionCriteria: "message_sent"
        },
        {
          id: "step-2",
          title: "Spot the mistake",
          description: "Find the error",
          prompt: "I solved 2x + 5 = 13 by doing 2x = 13, so x = 6.5. What's wrong?",
          expectedArtifact: "your explanation",
          completionCriteria: "message_sent"
        },
        {
          id: "step-3",
          title: "Try one yourself",
          description: "Solve an equation",
          prompt: "Now try solving 3x - 7 = 14. Show your steps.",
          expectedArtifact: "your attempt",
          completionCriteria: "try_chip"
        },
        {
          id: "step-4",
          title: "Explain it back",
          description: "Show your reasoning",
          prompt: "Can you explain your solution process?",
          expectedArtifact: "1-2 sentences",
          completionCriteria: "message_sent"
        }
      ]
    },
    // Age 13-15: Practice - Algebra
    {
      id: "practice-algebra-13-15",
      ageBand: AgeBand.THIRTEEN_TO_FIFTEEN,
      missionId: "practice",
      topicId: "algebra",
      title: "Practicing Algebra",
      description: "Get better at solving equations",
      steps: [
        {
          id: "step-1",
          title: "Warm-up",
          description: "Start with a simple one",
          prompt: "Let's warm up. Solve x + 5 = 12.",
          expectedArtifact: "your attempt",
          completionCriteria: "try_chip"
        },
        {
          id: "step-2",
          title: "2 reps",
          description: "Try two more",
          prompt: "Good! Now solve 2x - 3 = 7, then 4x + 1 = 13.",
          expectedArtifact: "2 attempts",
          completionCriteria: "try_chip"
        },
        {
          id: "step-3",
          title: "1 mixed problem",
          description: "One more challenge",
          prompt: "Last one! Solve 5x - 8 = 17.",
          expectedArtifact: "your attempt",
          completionCriteria: "try_chip"
        }
      ]
    },
    // Age 16-18: Understand - Calculus
    {
      id: "understand-calculus-16-18",
      ageBand: AgeBand.SIXTEEN_TO_EIGHTEEN,
      missionId: "understand",
      topicId: "calculus",
      title: "Understanding Derivatives",
      description: "Learn what derivatives are and how they work",
      steps: [
        {
          id: "step-1",
          title: "Brain dump",
          description: "What do you know?",
          prompt: "What do you know about derivatives? Share your current understanding.",
          expectedArtifact: "your thoughts",
          completionCriteria: "message_sent"
        },
        {
          id: "step-2",
          title: "Spot the mistake",
          description: "Find the error",
          prompt: "I said the derivative of x² is 2x, and the derivative of 2x is 2. Is that right? Check my work.",
          expectedArtifact: "your explanation",
          completionCriteria: "message_sent"
        },
        {
          id: "step-3",
          title: "Try one yourself",
          description: "Find a derivative",
          prompt: "Try finding the derivative of f(x) = 3x² + 2x. Show your steps.",
          expectedArtifact: "your attempt",
          completionCriteria: "try_chip"
        },
        {
          id: "step-4",
          title: "Explain it back",
          description: "Show your reasoning",
          prompt: "Can you explain what a derivative represents?",
          expectedArtifact: "1-2 sentences",
          completionCriteria: "message_sent"
        }
      ]
    },
    // Adult: Understand - Calculus
    {
      id: "understand-calculus-adult",
      ageBand: AgeBand.ADULT,
      missionId: "understand",
      topicId: "calculus",
      title: "Understanding Derivatives",
      description: "Learn what derivatives are and how they work",
      steps: [
        {
          id: "step-1",
          title: "Brain dump",
          description: "What do you know?",
          prompt: "What's your current understanding of derivatives? Share what comes to mind.",
          expectedArtifact: "your thoughts",
          completionCriteria: "message_sent"
        },
        {
          id: "step-2",
          title: "Spot the mistake",
          description: "Find the error",
          prompt: "I calculated the derivative of x³ as 3x². Is that correct? Check my reasoning.",
          expectedArtifact: "your explanation",
          completionCriteria: "message_sent"
        },
        {
          id: "step-3",
          title: "Try one yourself",
          description: "Find a derivative",
          prompt: "Try finding the derivative of f(x) = 2x³ - 5x + 1. Show your work.",
          expectedArtifact: "your attempt",
          completionCriteria: "try_chip"
        },
        {
          id: "step-4",
          title: "Explain it back",
          description: "Show your reasoning",
          prompt: "Can you explain what a derivative represents in your own words?",
          expectedArtifact: "1-2 sentences",
          completionCriteria: "message_sent"
        }
      ]
    },
    // Adult: Practice - Coding
    {
      id: "practice-coding-adult",
      ageBand: AgeBand.ADULT,
      missionId: "practice",
      topicId: "programming-basics",
      title: "Practicing Programming",
      description: "Get better at coding",
      steps: [
        {
          id: "step-1",
          title: "Warm-up",
          description: "Start with basics",
          prompt: "Let's warm up. Write a simple function that adds two numbers.",
          expectedArtifact: "your code",
          completionCriteria: "try_chip"
        },
        {
          id: "step-2",
          title: "2 reps",
          description: "Try two more",
          prompt: "Good! Now write a function that multiplies two numbers, then one that divides.",
          expectedArtifact: "2 functions",
          completionCriteria: "try_chip"
        },
        {
          id: "step-3",
          title: "1 mixed problem",
          description: "One more challenge",
          prompt: "Last one! Write a function that calculates the average of three numbers.",
          expectedArtifact: "your code",
          completionCriteria: "try_chip"
        }
      ]
    }
  ]
}








































