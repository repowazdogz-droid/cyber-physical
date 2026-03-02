# Assessment Redesign Contract

This contract defines assessment primitives that make "cheating" irrelevant by focusing on process, reasoning, and interaction history rather than final answers.

Version: 0.1  
Effective: 2024-12-13  
Status: Active

---

## 1. Purpose

This contract ensures:
- Assessment focuses on reasoning process, not output
- Multiple valid assessment types prevent cheating relevance
- Rubrics measure cognitive skills, not memorization
- Integrity is maintained through interaction history requirements
- Prohibited metrics are explicitly excluded

---

## 2. Assessment Types

### Critique Assessment

Critique assessment:
- Learner critiques a given argument or solution
- Assessment measures critical thinking and analysis
- Multiple valid critiques are possible
- Critique assessment is appropriate for judgment tasks

### Oral Reasoning Assessment

Oral reasoning assessment:
- Learner explains reasoning process verbally
- Assessment measures ability to articulate thinking
- Process is primary, not correctness
- Oral reasoning assessment is appropriate for complex reasoning

### Iteration Log Assessment

Iteration log assessment:
- Learner shows complete iteration history
- Assessment measures revision and refinement process
- Iterations are valued positively
- Iteration log assessment is appropriate for problem-solving

### Synthesis Assessment

Synthesis assessment:
- Learner synthesizes multiple sources or concepts
- Assessment measures integration and connection-making
- Synthesis quality is measured, not completeness
- Synthesis assessment is appropriate for advanced learning

### Teach-Back Assessment

Teach-back assessment:
- Learner teaches concept back to platform or peer
- Assessment measures understanding through explanation
- Teaching quality indicates understanding depth
- Teach-back assessment is appropriate for concept mastery

### Assessment Type Selection

Assessment type selection:
- Type is selected based on learning goal
- Multiple types may be used in single session
- Type selection is mandatory
- Missing type selection is a violation

---

## 3. Rubric Dimensions

### Clarity Dimension

Clarity measures:
- How clearly learner expresses ideas
- How well learner communicates reasoning
- How understandable learner's explanations are
- Clarity is a required rubric dimension

Clarity indicators:
- Clear articulation of reasoning steps
- Logical flow of explanation
- Appropriate use of examples
- Clarity indicators are used for assessment

### Evidence Use Dimension

Evidence use measures:
- How well learner uses evidence to support claims
- How appropriately learner cites sources
- How critically learner evaluates evidence
- Evidence use is a required rubric dimension

Evidence use indicators:
- Appropriate evidence selection
- Critical evaluation of evidence quality
- Proper distinction between evidence and opinion
- Evidence use indicators are used for assessment

### Uncertainty Dimension

Uncertainty measures:
- How well learner acknowledges uncertainty
- How appropriately learner expresses confidence levels
- How honestly learner handles unknown information
- Uncertainty is a required rubric dimension

Uncertainty indicators:
- Explicit acknowledgment of uncertainty
- Appropriate confidence calibration
- Honest admission when information is unknown
- Uncertainty indicators are used for assessment

### Revisions Dimension

Revisions measure:
- How well learner revises based on new information
- How appropriately learner updates understanding
- How positively learner responds to feedback
- Revisions is a required rubric dimension

Revision indicators:
- Willingness to revise when evidence changes
- Quality of revision reasoning
- Improvement over iterations
- Revision indicators are used for assessment

### Trade-Offs Dimension

Trade-offs measure:
- How well learner identifies trade-offs
- How appropriately learner weighs alternatives
- How clearly learner explains decision rationale
- Trade-offs is a required rubric dimension

Trade-off indicators:
- Identification of relevant trade-offs
- Appropriate weighing of alternatives
- Clear explanation of decision rationale
- Trade-off indicators are used for assessment

### Rubric Application

Rubric application:
- All dimensions are assessed for each assessment
- Dimensions are weighted based on assessment type
- Dimension scores are combined for overall assessment
- Rubric application is mandatory
- Missing rubric application is a violation

---

## 4. Disallowed Metrics

### Speed Metrics

Speed metrics are prohibited:
- Time to completion is not a primary metric
- Speed of response is not rewarded
- Time pressure is not used as assessment tool
- Speed metrics are prohibited
- Using speed metrics is a violation

### Volume Metrics

Volume metrics are prohibited:
- Amount of content produced is not a primary metric
- Word count or response length is not rewarded
- Volume does not indicate understanding
- Volume metrics are prohibited
- Using volume metrics is a violation

### Streak Metrics

Streak metrics are prohibited:
- Consecutive correct answers are not tracked
- Streak-based rewards are not used
- Streak maintenance is not incentivized
- Streak metrics are prohibited
- Using streak metrics is a violation

### Completion Percentage

Completion percentage is prohibited:
- Percentage of content completed is not a metric
- Completion rate is not rewarded
- Incomplete work is not penalized if reasoning is sound
- Completion percentage is prohibited
- Using completion percentage is a violation

### Comparative Rankings

Comparative rankings are prohibited:
- Learners are not ranked against each other
- Leaderboards are not used
- Relative performance is not emphasized
- Comparative rankings are prohibited
- Using comparative rankings is a violation

---

## 5. Integrity Requirements

### Interaction History Requirement

All assessments require:

### Complete Interaction History
- Full turn-by-turn interaction log is required
- All questions, responses, and reasoning steps are recorded
- Complete interaction history is mandatory
- Assessment without history is invalid

### Reasoning Chain Documentation
- Reasoning chain must be documented step-by-step
- Each reasoning step must be traceable
- Reasoning chain documentation is mandatory
- Missing reasoning chain invalidates assessment

### Revision History
- All revisions and iterations must be preserved
- Revision reasoning must be documented
- Revision history is mandatory
- Missing revision history invalidates assessment

### Final Answer Insufficiency

Final answers alone are insufficient:
- Final answer without process is not assessable
- Reasoning process is required for assessment
- Process requirement is mandatory
- Assessment based solely on final answer is prohibited

### Integrity Verification

Integrity is verified through:
- Consistency of reasoning across interactions
- Alignment of final answer with reasoning process
- Appropriate use of evidence and sources
- Integrity verification is mandatory
- Missing integrity verification is a violation

---

## 6. Assessment Output Schema

### Assessment Result Schema

```yaml
AssessmentResult:
  assessment_id: string (required)
  assessment_type: string (required, enum: ["critique", "oral_reasoning", "iteration_log", "synthesis", "teach_back"])
  learner_id: string (required)
  session_id: string (required)
  timestamp_utc: string (required, ISO 8601)
  
  rubric_scores:
    clarity: float (required, 0.0 to 1.0)
    evidence_use: float (required, 0.0 to 1.0)
    uncertainty: float (required, 0.0 to 1.0)
    revisions: float (required, 0.0 to 1.0)
    trade_offs: float (required, 0.0 to 1.0)
  
  interaction_history:
    turns: [Turn] (required, min_items: 1)
    reasoning_chains: [ReasoningChain] (required, min_items: 1)
    revisions: [Revision] (required, min_items: 0)
  
  strengths:
    - dimension: string (required)
      evidence: string (required)
      examples: [string] (required, min_items: 1)
  
  growth_areas:
    - dimension: string (required)
      evidence: string (required)
      suggestions: [string] (required, min_items: 1)
  
  integrity_verification:
    consistency_score: float (required, 0.0 to 1.0)
    process_alignment: float (required, 0.0 to 1.0)
    evidence_appropriateness: float (required, 0.0 to 1.0)
    verified: bool (required)
  
  prohibited_metrics_used: [] (required, must be empty)
  
  audit:
    contract_versions: [string] (required, min_items: 1)
    assessor_mode: string (required)
    timestamp_utc: string (required, ISO 8601)
```

### Turn Schema (for interaction history)

```yaml
Turn:
  turn_id: string (required)
  sequence_number: int (required)
  question: string (required)
  response: string (required)
  reasoning_attempt: string (required)
  timestamp: string (required, ISO 8601)
```

### ReasoningChain Schema

```yaml
ReasoningChain:
  chain_id: string (required)
  steps: [ReasoningStep] (required, min_items: 2)
  conclusion: string (required)
  uncertainties: [string] (required, min_items: 0)
```

### ReasoningStep Schema

```yaml
ReasoningStep:
  step_id: string (required)
  statement: string (required)
  evidence: string (optional)
  assumption: bool (required)
  certainty: float (required, 0.0 to 1.0)
```

### Revision Schema

```yaml
Revision:
  revision_id: string (required)
  original_statement: string (required)
  revised_statement: string (required)
  reasoning: string (required)
  trigger: string (required, enum: ["new_evidence", "feedback", "reflection"])
  timestamp: string (required, ISO 8601)
```

---

## 7. Assessment Process

### Pre-Assessment Requirements

Before assessment begins:

### Learning Goal Declaration
- Learning goal must be explicitly declared
- Goal declaration is mandatory
- Assessment without goal declaration is invalid

### Assessment Type Selection
- Assessment type must be selected
- Type selection rationale must be provided
- Type selection is mandatory
- Assessment without type selection is invalid

### Rubric Dimension Weighting
- Rubric dimensions must be weighted
- Weighting rationale must be provided
- Dimension weighting is mandatory
- Assessment without weighting is invalid

### During Assessment

During assessment:

### Interaction History Recording
- All interactions must be recorded in real-time
- Recording cannot be retroactively modified
- Real-time recording is mandatory
- Retroactive modification is prohibited

### Reasoning Artifact Collection
- Reasoning artifacts must be collected as they occur
- Artifacts cannot be added after the fact
- Real-time collection is mandatory
- Post-hoc artifact addition is prohibited

### Assessment Execution

Assessment execution:
- Assessment follows declared process
- No hidden criteria or surprise requirements
- Process transparency is mandatory
- Hidden criteria are prohibited

### Post-Assessment

After assessment:

### Result Generation
- Assessment result is generated immediately
- Result includes all required schema fields
- Immediate generation is mandatory
- Delayed generation is prohibited

### Feedback Provision
- Feedback is provided based on rubric dimensions
- Feedback focuses on strengths and growth areas
- Feedback provision is mandatory
- Missing feedback is a violation

---

## 8. Anti-Cheating Mechanisms

### Process Focus

Anti-cheating through process focus:
- Assessment measures reasoning process, not answers
- Process cannot be faked or copied
- Process focus makes cheating irrelevant
- Process focus is mandatory

### Interaction History Requirement

Anti-cheating through history requirement:
- Complete interaction history is required
- History shows reasoning development over time
- History cannot be fabricated convincingly
- History requirement makes cheating difficult

### Revision Valuation

Anti-cheating through revision valuation:
- Revisions are valued positively
- Changing answers based on reasoning is encouraged
- Revision valuation reduces pressure to get it right first time
- Revision valuation is mandatory

### Multiple Valid Paths

Anti-cheating through multiple valid paths:
- Multiple valid reasoning paths are accepted
- No single "correct" answer for judgment tasks
- Path diversity makes copying ineffective
- Multiple valid paths are mandatory

---

## 9. Interface Boundaries

### What This Contract Owns

This contract owns:
- Assessment type definitions
- Rubric dimension specifications
- Assessment output schemas
- Integrity verification requirements
- Prohibited metrics definitions

### What This Contract Does Not Own

This contract does not own:
- Learning platform scope (Contract 68)
- Socratic dialogue protocol (Contract 69)
- Age band definitions (Contract 71)
- Cognitive skill taxonomy (Contract 72)
- Delivery surface implementation (Contract 42)
- Learning state updates (Contract 29)

---

## 10. Enforcement

Violations of this contract include:
- Using prohibited metrics (speed, volume, streaks, completion percentage, rankings)
- Assessing based solely on final answers
- Missing interaction history requirements
- Missing reasoning chain documentation
- Hidden assessment criteria
- Missing feedback provision

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## 11. Amendments

Changes to assessment types, rubric dimensions, integrity requirements, or prohibited metrics require:
- Impact assessment on assessment validity and anti-cheating effectiveness
- Testing with representative assessment scenarios
- Approval from system owner
- Version increment
- Documentation in change logs

---

## 12. Immutability

### This Contract Changes Only via Explicit Revision

- Contract changes require explicit revision
- No ad-hoc edits to assessment types or rubric dimensions
- Explicit revision is mandatory
- Ad-hoc changes are prohibited

### Revision Requirements

- Contract revisions must be documented
- Revisions require version control
- Revisions are traceable and auditable
- Undocumented revisions are violations

---

## Change Control

This contract changes only via explicit revision:

### Explicit Revision
- Contract changes must be explicit and documented
- No ad-hoc edits to assessment principles or integrity rules
- Changes require version control
- Changes are traceable and auditable

### Documented Rationale
Every contract change must include rationale:
- What changed in the contract
- Why it changed
- What it affects
- Expected impact on assessment validity and anti-cheating effectiveness

### Rollback Plan
- Every contract change must have rollback plan
- Previous contract versions must be preserved
- Rollback procedure must be documented
- Rollback can be executed at any time

---

This document is version 0.1.








































