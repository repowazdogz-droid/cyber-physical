/**
 * TeacherMomentEngine: Pure, deterministic functions to generate teacher moments, prompts, and plans.
 * No fetch. No time. No randomness.
 * No grading, no scoring, no judgment.
 */

import { TeacherMoment, TeacherPrompt, PlanStep, MomentType } from './TeacherMomentTypes';

interface SessionEvent {
  t: number;
  type: string;
  payload: any;
}

interface ThoughtObject {
  id: string;
  type: string;
  contentText: string;
  confidence?: string;
  ephemeral?: boolean;
}

interface BoardState {
  pinnedIds?: string[];
  customOrderIds?: string[];
  layoutMode?: string;
}

interface BundleMeta {
  sessionId?: string;
  version?: string;
  createdAtIso?: string;
  modeUsed?: string;
  reduceMotion?: boolean;
  learnerIdHash?: string;
  ageBand?: string;
}

interface EngineInput {
  sessionLog: { events: SessionEvent[] };
  thoughtObjects: ThoughtObject[];
  boardState?: BoardState;
  meta?: BundleMeta;
  calmMode?: boolean;
}

/**
 * Generates teacher moments from session data.
 */
export function generateTeacherMoments(input: EngineInput): TeacherMoment[] {
  const { sessionLog, thoughtObjects, boardState, meta } = input;
  const moments: TeacherMoment[] = [];

  if (!sessionLog?.events || !thoughtObjects) {
    return moments;
  }

  const events = sessionLog.events;
  const ageBand = meta?.ageBand || 'adult';

  // 1. Uncertainty moments
  thoughtObjects.forEach(obj => {
    if (obj.type === 'Uncertainty' || 
        obj.confidence === 'low' || 
        obj.confidence === 'unknown' ||
        obj.contentText.toLowerCase().includes('unsure') ||
        obj.contentText.toLowerCase().includes('not sure')) {
      moments.push({
        id: `uncertainty_${obj.id}`,
        label: 'Expressed uncertainty',
        whyItMatters: 'This is a good moment to offer gentle support or a clarifying question.',
        thoughtId: obj.id,
        momentType: 'Uncertainty'
      });
    }
  });

  // 2. Focus moments
  events.forEach((event, idx) => {
    if (event.type === 'FocusEntered' && event.payload?.thoughtId) {
      const thought = thoughtObjects.find(obj => obj.id === event.payload.thoughtId);
      if (thought) {
        moments.push({
          id: `focus_${event.payload.thoughtId}_${idx}`,
          label: 'Focused on a thought',
          whyItMatters: `They chose to examine "${thought.contentText.substring(0, 50)}..." closely.`,
          thoughtId: event.payload.thoughtId,
          eventIndex: idx,
          momentType: 'Focus'
        });
      }
    }
  });

  // 3. Pin moments
  events.forEach((event, idx) => {
    if (event.type === 'PinToggled' && event.payload?.isPinned === true) {
      const thought = thoughtObjects.find(obj => obj.id === event.payload.thoughtId);
      if (thought) {
        moments.push({
          id: `pin_${event.payload.thoughtId}_${idx}`,
          label: 'Pinned a thought',
          whyItMatters: `They marked "${thought.contentText.substring(0, 50)}..." as important.`,
          thoughtId: event.payload.thoughtId,
          eventIndex: idx,
          momentType: 'Pin'
        });
      }
    }
  });

  // 4. Explain-back moments
  events.forEach((event, idx) => {
    if (event.type === 'ExplainBackShown' && event.payload?.thoughtId) {
      const thought = thoughtObjects.find(obj => obj.id === event.payload.thoughtId);
      if (thought) {
        moments.push({
          id: `explainback_${event.payload.thoughtId}_${idx}`,
          label: 'Explained an idea in their own words',
          whyItMatters: 'They practiced teaching back what they learned, which strengthens understanding.',
          thoughtId: event.payload.thoughtId,
          eventIndex: idx,
          momentType: 'ExplainBack'
        });
      }
    }
  });

  // 5. Stuck loop detection (6+ toggles within 15 events)
  const stuckLoopIndices = detectStuckLoops(events);
  stuckLoopIndices.forEach(idx => {
    moments.push({
      id: `stuckloop_${idx}`,
      label: 'Rapid exploration pattern',
      whyItMatters: 'They explored many options quickly. This might be a good time to pause and reflect.',
      eventIndex: idx,
      momentType: 'StuckLoop'
    });
  });

  // 6. Verification moments
  thoughtObjects.forEach(obj => {
    if (obj.type === 'Evidence' || obj.type === 'Verification') {
      moments.push({
        id: `verification_${obj.id}`,
        label: 'Used evidence or verification',
        whyItMatters: 'They engaged with evidence, which shows critical thinking.',
        thoughtId: obj.id,
        momentType: 'Verification'
      });
    }
  });

  // Limit to max 6 moments
  return moments.slice(0, 6);
}

/**
 * Detects stuck loops (rapid toggling within a short event window).
 */
function detectStuckLoops(events: SessionEvent[]): number[] {
  const loopIndices: number[] = [];
  const windowSize = 15;

  for (let i = 0; i < events.length - windowSize; i++) {
    const window = events.slice(i, i + windowSize);
    const toggleCount = window.filter(e => 
      e.type === 'ClusterChanged' || 
      e.type === 'CardSelected' || 
      e.type === 'FocusEntered' || 
      e.type === 'FocusExited'
    ).length;

    if (toggleCount >= 6) {
      loopIndices.push(i);
    }
  }

  return loopIndices;
}

/**
 * Generates teacher prompts from session data.
 */
export function generateTeacherPrompts(input: EngineInput): TeacherPrompt[] {
  const { sessionLog, thoughtObjects, meta, calmMode = true } = input;
  const prompts: TeacherPrompt[] = [];

  if (!sessionLog?.events || !thoughtObjects) {
    return prompts;
  }

  const ageBand = meta?.ageBand || 'adult';
  const isYoung = ageBand.includes('6-9') || ageBand.includes('10-12');

  // Get moments to generate prompts for
  const moments = generateTeacherMoments(input);

  moments.forEach(moment => {
    const thought = moment.thoughtId 
      ? thoughtObjects.find(obj => obj.id === moment.thoughtId)
      : null;

    switch (moment.momentType) {
      case 'Uncertainty':
        if (thought) {
          prompts.push({
            id: `prompt_uncertainty_${moment.id}`,
            prompt: isYoung 
              ? `Can you tell me one thing you're curious about with this idea?`
              : `What part of this feels unclear? It's okay not to know yet.`,
            target: 'thought',
            thoughtId: moment.thoughtId
          });
        } else {
          prompts.push({
            id: `prompt_uncertainty_general_${moment.id}`,
            prompt: isYoung
              ? `What would help you feel more sure?`
              : `What would be a tiny next step to explore this?`,
            target: 'whole_session'
          });
        }
        break;

      case 'Focus':
        if (thought) {
          prompts.push({
            id: `prompt_focus_${moment.id}`,
            prompt: isYoung
              ? `Can you explain this thought in your own words?`
              : `What makes this idea interesting to you?`,
            target: 'thought',
            thoughtId: moment.thoughtId
          });
        }
        break;

      case 'Pin':
        if (thought) {
          prompts.push({
            id: `prompt_pin_${moment.id}`,
            prompt: isYoung
              ? `Why did you save this one?`
              : `What made this stand out to you?`,
            target: 'thought',
            thoughtId: moment.thoughtId
          });
        }
        break;

      case 'ExplainBack':
        prompts.push({
          id: `prompt_explainback_${moment.id}`,
          prompt: isYoung
            ? `Great job explaining! What's one question you still have?`
            : `Nice explanation. What would you try next?`,
          target: 'whole_session'
        });
        break;

      case 'StuckLoop':
        prompts.push({
          id: `prompt_stuckloop_${moment.id}`,
          prompt: isYoung
            ? `Let's pause for a moment. What's one thing you want to focus on?`
            : `You explored a lot. What feels most important right now?`,
          target: 'whole_session'
        });
        break;

      case 'Verification':
        prompts.push({
          id: `prompt_verification_${moment.id}`,
          prompt: isYoung
            ? `How did you check if this was true?`
            : `What evidence helped you understand this?`,
          target: 'whole_session'
        });
        break;
    }
  });

  // Limit to max 8 prompts
  // In calm mode, ensure all prompts are <= 1 sentence
  let filteredPrompts = prompts.slice(0, 8);
  
  if (calmMode) {
    filteredPrompts = filteredPrompts.filter(p => {
      const sentences = p.prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
      return sentences.length <= 1;
    });
  }

  return filteredPrompts;
}

/**
 * Generates next session plan (3 steps max).
 */
export function generateNextSessionPlan(input: EngineInput): PlanStep[] {
  const { sessionLog, thoughtObjects, meta } = input;
  const ageBand = meta?.ageBand || 'adult';
  const isYoung = ageBand.includes('6-9') || ageBand.includes('10-12');

  const plan: PlanStep[] = [];

  // Step 1: Re-anchor (goal + uncertainty)
  const uncertaintyMoments = generateTeacherMoments(input).filter(m => m.momentType === 'Uncertainty');
  if (uncertaintyMoments.length > 0) {
    plan.push({
      stepTitle: 'Re-anchor',
      stepPrompt: isYoung
        ? `Let's start by thinking about what you want to understand.`
        : `Begin by identifying what you want to explore or clarify.`,
      expectedArtifact: '1 sentence'
    });
  } else {
    plan.push({
      stepTitle: 'Set a goal',
      stepPrompt: isYoung
        ? `What do you want to learn about today?`
        : `What would you like to explore or practice?`,
      expectedArtifact: '1 sentence'
    });
  }

  // Step 2: One attempt (or one example)
  plan.push({
    stepTitle: 'Try one',
    stepPrompt: isYoung
      ? `Try one example or one small attempt.`
      : `Make one attempt or find one example.`,
    expectedArtifact: isYoung ? 'one example' : 'one attempt'
  });

  // Step 3: Teach-back
  plan.push({
    stepTitle: 'Explain it back',
    stepPrompt: isYoung
      ? `Explain what you learned in your own words.`
      : `Teach back what you discovered.`,
    expectedArtifact: '1 sentence'
  });

  return plan.slice(0, 3); // Max 3 steps
}

/**
 * Generates process summary (action-based, not performance-based).
 */
export function generateProcessSummary(input: EngineInput): string[] {
  const { sessionLog, thoughtObjects, boardState } = input;
  const summary: string[] = [];

  if (!sessionLog?.events) {
    return summary;
  }

  const events = sessionLog.events;
  const focusCount = events.filter(e => e.type === 'FocusEntered').length;
  const pinCount = events.filter(e => e.type === 'PinToggled' && e.payload?.isPinned).length;
  const explainBackCount = events.filter(e => e.type === 'ExplainBackShown').length;
  const clusterCount = events.filter(e => e.type === 'ClusterChanged').length;

  if (focusCount > 0) {
    summary.push(`Focused on ${focusCount} thought${focusCount > 1 ? 's' : ''}`);
  }

  if (pinCount > 0) {
    summary.push(`Pinned ${pinCount} important idea${pinCount > 1 ? 's' : ''}`);
  }

  if (explainBackCount > 0) {
    summary.push(`Explained ${explainBackCount} idea${explainBackCount > 1 ? 's' : ''} in their own words`);
  }

  if (clusterCount > 0) {
    summary.push(`Filtered thoughts ${clusterCount} time${clusterCount > 1 ? 's' : ''}`);
  }

  if (summary.length === 0) {
    summary.push('Explored the learning board');
  }

  return summary;
}

/**
 * Main function: generates all teacher recap data.
 */
export function generateTeacherRecapData(input: EngineInput) {
  const moments = generateTeacherMoments(input);
  const prompts = generateTeacherPrompts(input);
  const plan = generateNextSessionPlan(input);
  const summary = generateProcessSummary(input);

  return {
    teacherMoments: moments,
    nextPrompts: prompts,
    nextSessionPlan: plan,
    summary
  };
}








































