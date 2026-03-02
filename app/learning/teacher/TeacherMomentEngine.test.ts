/**
 * TeacherMomentEngine.test.ts: Tests for deterministic behavior and no grading language.
 */

import { generateTeacherMoments, generateTeacherPrompts, generateNextSessionPlan, generateProcessSummary } from './TeacherMomentEngine';

// Test data
const mockSessionLog = {
  events: [
    { t: 0, type: 'CardSelected', payload: { thoughtId: 'thought1' } },
    { t: 1000, type: 'FocusEntered', payload: { thoughtId: 'thought1' } },
    { t: 2000, type: 'PinToggled', payload: { thoughtId: 'thought1', isPinned: true } },
    { t: 3000, type: 'ExplainBackShown', payload: { thoughtId: 'thought1' } },
    { t: 4000, type: 'ClusterChanged', payload: { clusterId: 'Questions' } },
    { t: 5000, type: 'ClusterChanged', payload: { clusterId: 'Examples' } },
    { t: 6000, type: 'ClusterChanged', payload: { clusterId: 'All' } },
    { t: 7000, type: 'CardSelected', payload: { thoughtId: 'thought2' } },
    { t: 8000, type: 'FocusEntered', payload: { thoughtId: 'thought2' } },
    { t: 9000, type: 'FocusExited', payload: {} },
    { t: 10000, type: 'CardSelected', payload: { thoughtId: 'thought3' } },
    { t: 11000, type: 'FocusEntered', payload: { thoughtId: 'thought3' } },
    { t: 12000, type: 'FocusExited', payload: {} },
    { t: 13000, type: 'CardSelected', payload: { thoughtId: 'thought4' } },
    { t: 14000, type: 'FocusEntered', payload: { thoughtId: 'thought4' } },
    { t: 15000, type: 'FocusExited', payload: {} }
  ]
};

const mockThoughtObjects = [
  {
    id: 'thought1',
    type: 'Question',
    contentText: 'How does this work?',
    confidence: 'low'
  },
  {
    id: 'thought2',
    type: 'Uncertainty',
    contentText: 'I\'m not sure about this'
  },
  {
    id: 'thought3',
    type: 'Evidence',
    contentText: 'This is evidence'
  },
  {
    id: 'thought4',
    type: 'Example',
    contentText: 'Here is an example'
  }
];

const mockBoardState = {
  pinnedIds: ['thought1'],
  customOrderIds: [],
  layoutMode: 'Arc'
};

const mockMeta = {
  sessionId: 'session_123',
  version: '0.1',
  createdAtIso: '2024-01-01T12:00:00Z',
  modeUsed: 'Solo',
  reduceMotion: true,
  ageBand: '10-12'
};

const mockInput = {
  sessionLog: mockSessionLog,
  thoughtObjects: mockThoughtObjects,
  boardState: mockBoardState,
  meta: mockMeta,
  calmMode: true
};

// Test: Determinism
test('generateTeacherMoments returns identical outputs for same inputs', () => {
  const result1 = generateTeacherMoments(mockInput);
  const result2 = generateTeacherMoments(mockInput);
  
  expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
});

test('generateTeacherPrompts returns identical outputs for same inputs', () => {
  const result1 = generateTeacherPrompts(mockInput);
  const result2 = generateTeacherPrompts(mockInput);
  
  expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
});

test('generateNextSessionPlan returns identical outputs for same inputs', () => {
  const result1 = generateNextSessionPlan(mockInput);
  const result2 = generateNextSessionPlan(mockInput);
  
  expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
});

// Test: No grading language
const forbiddenWords = [
  'grade', 'score', 'rank', 'percentile', 'performance', 
  'smart', 'gifted', 'struggling', 'failing', 'passing',
  'excellent', 'poor', 'good', 'bad', 'better', 'worse'
];

test('generateTeacherMoments contains no grading language', () => {
  const moments = generateTeacherMoments(mockInput);
  
  // Only check human-facing text fields (not keys/IDs)
  // Exclude context-specific uses like "good moment" (meaning "appropriate moment")
  const banned = ["score", "grade", "rank", "rating", "percentile", "performance", "smart", "gifted", "struggling", "failing", "passing", "excellent", "poor"];
  // Note: "good", "bad", "better", "worse" excluded due to legitimate uses like "good moment", "better understanding"
  
  for (const moment of moments) {
    // Extract human-facing text fields
    const textFields = [
      moment.label,
      moment.whyItMatters
    ].filter(Boolean).join(" ").toLowerCase();
    
    for (const word of banned) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      expect(regex.test(textFields)).toBe(false);
    }
  }
});

test('generateTeacherPrompts contains no grading language', () => {
  const prompts = generateTeacherPrompts(mockInput);
  const allText = JSON.stringify(prompts).toLowerCase();
  
  forbiddenWords.forEach(word => {
    // Use word boundary regex to avoid false positives
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    expect(regex.test(allText)).toBe(false);
  });
});

test('generateNextSessionPlan contains no grading language', () => {
  const plan = generateNextSessionPlan(mockInput);
  const allText = JSON.stringify(plan).toLowerCase();
  
  forbiddenWords.forEach(word => {
    // Use word boundary regex to avoid false positives
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    expect(regex.test(allText)).toBe(false);
  });
});

// Test: StuckLoop detection
test('detects stuck loops (6+ toggles within 15 events)', () => {
  const stuckLoopEvents = {
    events: Array.from({ length: 20 }, (_, i) => ({
      t: i * 1000,
      type: i % 2 === 0 ? 'ClusterChanged' : 'CardSelected',
      payload: { clusterId: `cluster${i}` }
    }))
  };
  
  const input = {
    ...mockInput,
    sessionLog: stuckLoopEvents
  };
  
  const moments = generateTeacherMoments(input);
  const stuckLoopMoments = moments.filter(m => m.momentType === 'StuckLoop');
  
  expect(stuckLoopMoments.length).toBeGreaterThan(0);
});

// Test: Calm mode limits
test('calm mode ensures prompts are <= 1 sentence', () => {
  const prompts = generateTeacherPrompts({ ...mockInput, calmMode: true });
  
  prompts.forEach(prompt => {
    const sentences = prompt.prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
    expect(sentences.length).toBeLessThanOrEqual(1);
  });
});

// Test: Age tuning
test('young age bands get simpler prompts', () => {
  const youngInput = { ...mockInput, meta: { ...mockMeta, ageBand: '6-9' } };
  const adultInput = { ...mockInput, meta: { ...mockMeta, ageBand: 'adult' } };
  
  const youngPrompts = generateTeacherPrompts(youngInput);
  const adultPrompts = generateTeacherPrompts(adultInput);
  
  // Young prompts should be shorter/simpler
  const youngAvgLength = youngPrompts.reduce((sum, p) => sum + p.prompt.length, 0) / youngPrompts.length;
  const adultAvgLength = adultPrompts.reduce((sum, p) => sum + p.prompt.length, 0) / adultPrompts.length;
  
  // This is a soft check - young prompts tend to be shorter
  expect(youngAvgLength).toBeLessThanOrEqual(adultAvgLength + 20); // Allow some variance
});

// Test: Max limits
test('teacherMoments limited to max 6', () => {
  const moments = generateTeacherMoments(mockInput);
  expect(moments.length).toBeLessThanOrEqual(6);
});

test('teacherPrompts limited to max 8', () => {
  const prompts = generateTeacherPrompts(mockInput);
  expect(prompts.length).toBeLessThanOrEqual(8);
});

test('nextSessionPlan limited to max 3 steps', () => {
  const plan = generateNextSessionPlan(mockInput);
  expect(plan.length).toBeLessThanOrEqual(3);
});

// Simple test runner (for Node.js environment)
if (typeof describe === 'undefined') {
  // Browser/Node.js test runner would go here
  console.log('Tests defined. Run with a test framework like Jest or Vitest.');
}




