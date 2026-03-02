/**
 * Learning Types
 * 
 * Shared types for learning platform UI.
 * 
 * Version: 0.1
 */

import { AgeBand } from '../../spine/learning/platform/LearnerTypes'
import { TutorMode } from '../../spine/learning/platform/dialogue/DialogTypes'

export interface LearningContext {
  ageBand: AgeBand
  isMinor: boolean
  subject: string
  topic: string
  objective: string
  tutorMode: TutorMode
  starterUtterance: string
  missionId?: string
  linkedTeacherId?: string
}

