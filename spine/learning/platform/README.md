# Learning Platform - Skill Graph Implementation

Implementation of the Cognitive Skill Graph engine per Contract 72.

## Files

- `LearnerTypes.ts` - Learner profile and observation types
- `SkillGraphTypes.ts` - Skill graph data structures
- `SkillGraphUpdater.ts` - Core updater logic
- `__tests__/skill_graph_updater.test.ts` - Test suite

## Usage Example

```typescript
import { createEmptySkillGraph } from "./SkillGraphTypes";
import { applyObservations } from "./SkillGraphUpdater";
import { AgeBand, createTestProfile, createTestObservation } from "./LearnerTypes";

// Create a learner profile
const profile = {
  learnerId: "learner-123",
  ageBand: AgeBand.ADULT,
  safety: {
    minor: false,
    institutionMode: false
  }
};

// Create an empty skill graph
const graph = createEmptySkillGraph("learner-123");

// Create observations from a learning session
const observations = [
  {
    type: "StatedUncertainty",
    timestamp: new Date().toISOString(),
    strength: 0.8,
    sessionId: "session-1"
  },
  {
    type: "ProvidedEvidence",
    timestamp: new Date().toISOString(),
    strength: 0.9,
    sessionId: "session-1"
  }
];

// Apply observations to update the skill graph
const result = applyObservations(profile, graph, observations);

// Access updated skill states
const uncertaintySkill = result.graph.skills.get(CognitiveSkillId.UncertaintyHandling);
console.log(`Exposures: ${uncertaintySkill?.exposures}`);
console.log(`Confidence: ${uncertaintySkill?.confidenceBand}`);

// Review audit trail
result.audit.forEach(entry => {
  console.log(`${entry.skillId}: ${entry.reason}`);
});
```

## Skill Taxonomy

The implementation includes these cognitive skills:

- **QuestionQuality** - Quality of questions asked
- **UncertaintyHandling** - How uncertainty is acknowledged and handled
- **EvidenceUse** - Use of evidence to support claims
- **Synthesis** - Ability to synthesize information
- **ErrorCorrection** - Recognition and correction of errors
- **AssumptionTracking** - Identification and tracking of assumptions
- **ArgumentCritique** - Critical analysis of arguments
- **TeachBackClarity** - Clarity when explaining concepts
- **VerificationHabits** - Habits of verifying claims with sources

## Key Features

- **Deterministic**: Same inputs always produce same outputs
- **Bounded**: Fixed-size arrays prevent unbounded growth
- **Explainable**: Audit trail explains all updates
- **No Labeling**: No scores, grades, ranks, or diagnostic labels
- **Age-Aware**: Different persistence rules for different age bands

## Testing

Run tests with:
```bash
npm test -- spine/learning/platform/__tests__/skill_graph_updater.test.ts
```

Tests cover:
- Determinism
- Guardrails (no labeling, no diagnosis)
- Bounded state management
- Confidence band computation
- Age band restrictions
- Audit trail generation








































