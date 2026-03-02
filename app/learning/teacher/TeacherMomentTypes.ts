/**
 * TeacherMomentTypes: Interfaces for teacher moments, prompts, and plans.
 * No scoring, no grading, no judgment.
 */

export type MomentType = 
  | 'Uncertainty' 
  | 'Focus' 
  | 'Pin' 
  | 'ExplainBack' 
  | 'StuckLoop' 
  | 'Verification';

export interface TeacherMoment {
  id: string;
  label: string;
  whyItMatters: string; // 1 sentence
  thoughtId?: string;
  eventIndex?: number;
  momentType: MomentType;
}

export interface TeacherPrompt {
  id: string;
  prompt: string; // <= 1 sentence in calm mode
  target: 'whole_session' | 'thought';
  thoughtId?: string;
}

export interface PlanStep {
  stepTitle: string;
  stepPrompt: string;
  expectedArtifact: string; // e.g., "1 sentence", "one example", "one attempt"
}

export interface TeacherRecapData {
  allowed: boolean;
  visibilityNote?: string;
  teacherMoments?: TeacherMoment[];
  nextPrompts?: TeacherPrompt[];
  nextSessionPlan?: PlanStep[];
  summary?: string[];
}








































