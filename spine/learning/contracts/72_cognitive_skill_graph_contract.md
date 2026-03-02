# Cognitive Skill Graph Contract

This contract defines a lifelong cognitive skills map that tracks skill development without labeling learners, diagnosing conditions, or using shame or coercion.

Version: 0.1  
Effective: 2024-12-13  
Status: Active

---

## 1. Purpose

This contract ensures:
- Cognitive skills are tracked over time
- Skills are measured through evidence, not assumptions
- Learners are never labeled or diagnosed
- Shame and coercion are prohibited
- Skills graph supports lifelong learning

---

## 2. Skills Taxonomy (Initial Minimal Set)

### Critical Thinking Skills

Critical thinking skills include:
- Argument analysis
- Evidence evaluation
- Logical reasoning
- Assumption identification
- Trade-off recognition

Critical thinking is a core skill category.

### Communication Skills

Communication skills include:
- Clarity of expression
- Reasoning articulation
- Question formulation
- Active listening
- Feedback integration

Communication is a core skill category.

### Metacognitive Skills

Metacognitive skills include:
- Self-awareness of understanding
- Learning strategy selection
- Error recognition and correction
- Uncertainty acknowledgment
- Reflection and revision

Metacognition is a core skill category.

### Information Literacy Skills

Information literacy skills include:
- Source evaluation
- Evidence quality assessment
- Bias recognition
- Verification strategies
- Uncertainty handling

Information literacy is a core skill category.

### Problem-Solving Skills

Problem-solving skills include:
- Problem decomposition
- Solution iteration
- Hypothesis generation and testing
- Constraint identification
- Alternative exploration

Problem-solving is a core skill category.

### Skill Taxonomy Schema

```yaml
SkillCategory:
  category_id: string (required)
  label: string (required)
  description: string (required)
  skills: [Skill] (required, min_items: 1)

Skill:
  skill_id: string (required)
  label: string (required)
  description: string (required)
  evidence_types: [string] (required, min_items: 1)
  growth_indicators: [string] (required, min_items: 1)
```

---

## 3. Evidence Signals

### What Counts as Growth Evidence

Growth evidence includes:

### Improved Reasoning Quality
- More sophisticated reasoning chains
- Better use of evidence
- More appropriate uncertainty handling
- Improved reasoning quality indicates growth

### Increased Clarity
- Clearer expression of ideas
- Better articulation of reasoning
- More effective communication
- Increased clarity indicates growth

### Better Revision Practices
- More thoughtful revisions
- Better integration of feedback
- More appropriate assumption updates
- Better revision practices indicate growth

### Enhanced Critical Thinking
- More critical source evaluation
- Better bias recognition
- More sophisticated trade-off analysis
- Enhanced critical thinking indicates growth

### Evidence Collection Requirements

Evidence collection:
- Evidence must be observable and measurable
- Evidence must be linked to specific skills
- Evidence collection is mandatory
- Speculative evidence is prohibited

### Evidence Schema

```yaml
Evidence:
  evidence_id: string (required)
  skill_id: string (required)
  evidence_type: string (required)
  observation: string (required, max_length: 1000)
  context: string (required, max_length: 500)
  timestamp_utc: string (required, ISO 8601)
  session_id: string (required)
  artifact_references: [string] (optional)
  confidence: float (required, 0.0 to 1.0)
```

---

## 4. Prohibited Outcomes

### Labeling Learners

Labeling is prohibited:
- Learners are not labeled as "gifted," "struggling," or similar
- No categorical labels are assigned
- Labeling learners is prohibited
- Using labels is a violation

### Diagnosing Conditions

Diagnosing is prohibited:
- Learning disabilities are not diagnosed
- Cognitive conditions are not diagnosed
- Medical or psychological conditions are not diagnosed
- Diagnosing conditions is prohibited
- Attempting diagnosis is a violation

### Shame or Deficiency Implication

Shame is prohibited:
- Learners are not shamed for performance
- Deficiency is not implied
- Failure is not emphasized
- Shame or deficiency implication is prohibited
- Using shame is a violation

### Coercion

Coercion is prohibited:
- Learners are not coerced into learning
- Pressure is not applied
- Forced engagement is not used
- Coercion is prohibited
- Using coercion is a violation

### Comparative Rankings

Rankings are prohibited:
- Learners are not ranked against each other
- Relative performance is not emphasized
- Leaderboards are not used
- Comparative rankings are prohibited
- Using rankings is a violation

---

## 5. Storage Schema

### What Is Persisted

Persisted data includes:

### Skill Evidence Records
- All evidence observations are persisted
- Evidence is linked to skills and sessions
- Evidence persistence is mandatory
- Missing evidence persistence is a violation

### Skill Development Trajectories
- Skill development over time is tracked
- Trajectories show growth patterns
- Trajectory tracking is mandatory
- Missing trajectory tracking is a violation

### Session Artifacts
- Reasoning artifacts from sessions are persisted
- Artifacts support evidence claims
- Artifact persistence is mandatory
- Missing artifact persistence is a violation

### What Is Ephemeral

Ephemeral data includes:

### Temporary Session State
- In-progress session state is temporary
- State is persisted only on session completion
- Temporary state is ephemeral
- Ephemeral state is not persisted

### Draft Reasoning
- Draft reasoning attempts are not persisted
- Only final or significant reasoning is persisted
- Draft reasoning is ephemeral
- Draft reasoning is not persisted

### Storage Schema

```yaml
SkillGraph:
  learner_id: string (required)
  skills: [SkillRecord] (required)
  last_updated: string (required, ISO 8601)
  version: string (required)

SkillRecord:
  skill_id: string (required)
  category_id: string (required)
  evidence_history: [Evidence] (required, min_items: 0)
  current_level: string (optional, enum: ["emerging", "developing", "proficient", "advanced"])
  growth_trajectory: [GrowthPoint] (required, min_items: 0)
  last_evidence_timestamp: string (optional, ISO 8601)

GrowthPoint:
  timestamp_utc: string (required, ISO 8601)
  evidence_count: int (required)
  quality_indicator: float (required, 0.0 to 1.0)
  growth_direction: string (required, enum: ["improving", "stable", "declining"])
```

---

## 6. Skill Level Definitions

### Emerging Level

Emerging level:
- Skill is beginning to develop
- Evidence shows initial attempts
- Consistency is not yet established
- Emerging level indicates early development

### Developing Level

Developing level:
- Skill is developing with some consistency
- Evidence shows regular application
- Quality is improving over time
- Developing level indicates active growth

### Proficient Level

Proficient level:
- Skill is applied consistently
- Evidence shows reliable application
- Quality is consistently good
- Proficient level indicates established competency

### Advanced Level

Advanced level:
- Skill is applied with sophistication
- Evidence shows advanced application
- Quality is consistently high
- Advanced level indicates mastery

### Level Assignment Rules

Level assignment:
- Levels are assigned based on evidence patterns
- Levels are not fixed or permanent
- Level assignment is evidence-based
- Speculative level assignment is prohibited

---

## 7. Growth Measurement

### Growth Indicators

Growth is indicated by:

### Increased Evidence Frequency
- More frequent evidence of skill application
- Regular use of skill in sessions
- Increased frequency indicates growth

### Improved Evidence Quality
- Higher quality evidence over time
- More sophisticated skill application
- Improved quality indicates growth

### Expanded Skill Application
- Skill applied in more contexts
- Broader range of applications
- Expanded application indicates growth

### Growth Measurement Schema

```yaml
GrowthMeasurement:
  skill_id: string (required)
  measurement_period_start: string (required, ISO 8601)
  measurement_period_end: string (required, ISO 8601)
  evidence_count: int (required)
  quality_average: float (required, 0.0 to 1.0)
  growth_direction: string (required, enum: ["improving", "stable", "declining"])
  growth_rate: float (optional, can be negative)
  confidence: float (required, 0.0 to 1.0)
```

---

## 8. Skill Graph Queries

### Allowed Queries

Allowed queries include:

### Skill Development Over Time
- Query skill development trajectory
- View growth patterns
- Analyze evidence trends
- Skill development queries are allowed

### Current Skill Levels
- Query current skill levels
- View skill categories
- See evidence summaries
- Current level queries are allowed

### Evidence History
- Query evidence history for skills
- View specific evidence observations
- Review artifact references
- Evidence history queries are allowed

### Prohibited Queries

Prohibited queries include:

### Comparative Rankings
- Queries that rank learners are prohibited
- Relative performance queries are prohibited
- Leaderboard generation is prohibited
- Comparative queries are violations

### Diagnostic Queries
- Queries that attempt diagnosis are prohibited
- Medical or psychological inference is prohibited
- Condition identification is prohibited
- Diagnostic queries are violations

---

## 9. Skill Graph Updates

### Update Triggers

Skill graph updates occur when:

### New Evidence Collected
- New evidence triggers graph update
- Evidence is linked to skills
- Update is automatic on evidence collection
- Evidence-based updates are mandatory

### Session Completion
- Completed sessions trigger graph review
- Session artifacts are analyzed
- Graph is updated with new evidence
- Session-based updates are mandatory

### Update Rules

Update rules:
- Updates are evidence-based only
- Updates do not use speculation
- Evidence-based updates are mandatory
- Speculative updates are prohibited

### Update Schema

```yaml
SkillGraphUpdate:
  update_id: string (required)
  learner_id: string (required)
  timestamp_utc: string (required, ISO 8601)
  update_type: string (required, enum: ["evidence_added", "level_changed", "trajectory_updated"])
  skills_affected: [string] (required, min_items: 1)
  evidence_added: [Evidence] (optional)
  level_changes: [LevelChange] (optional)
  audit:
    contract_versions: [string] (required, min_items: 1)
    update_reason: string (required)
```

---

## 10. Interface Boundaries

### What This Contract Owns

This contract owns:
- Cognitive skills taxonomy
- Evidence signal definitions
- Skill graph storage schema
- Growth measurement definitions
- Prohibited outcome specifications

### What This Contract Does Not Own

This contract does not own:
- Learning platform scope (Contract 68)
- Socratic dialogue protocol (Contract 69)
- Assessment rubrics (Contract 70)
- Age band definitions (Contract 71)
- Delivery surface implementation (Contract 42)
- Learning state updates (Contract 29)

---

## 11. Enforcement

Violations of this contract include:
- Labeling or diagnosing learners
- Using shame or coercion
- Creating comparative rankings
- Speculative evidence collection
- Missing evidence persistence
- Prohibited query types

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## 12. Amendments

Changes to skills taxonomy, evidence signals, storage schema, or prohibited outcomes require:
- Impact assessment on skill tracking validity and learner safety
- Testing with representative skill development scenarios
- Approval from system owner
- Version increment
- Documentation in change logs

---

## 13. Immutability

### This Contract Changes Only via Explicit Revision

- Contract changes require explicit revision
- No ad-hoc edits to skills taxonomy or evidence rules
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
- No ad-hoc edits to skill taxonomy or evidence principles
- Changes require version control
- Changes are traceable and auditable

### Documented Rationale
Every contract change must include rationale:
- What changed in the contract
- Why it changed
- What it affects
- Expected impact on skill tracking validity and learner safety

### Rollback Plan
- Every contract change must have rollback plan
- Previous contract versions must be preserved
- Rollback procedure must be documented
- Rollback can be executed at any time

---

This document is version 0.1.








































