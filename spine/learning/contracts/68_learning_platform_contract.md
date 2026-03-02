# Learning Platform Contract

This contract defines the scope, boundaries, and safety rules for the Omega learning platform. It establishes the foundation for all learning platform features including Socratic tutoring, assessments, and XR experiences.

Version: 0.1  
Effective: 2024-12-13  
Status: Active

---

## 1. Mission

The learning platform exists to:

### Improve Judgment Through Structured Dialogue
- Learning platform improves decision-making quality through structured dialogue
- Learning platform enhances reasoning capability through guided inquiry
- Learning platform supports better judgment through scaffolded learning
- Improving judgment is the primary learning platform goal

### Reduce Confusion Through Clarification
- Learning platform clarifies ambiguous concepts through questioning
- Learning platform reduces misunderstanding through iterative refinement
- Learning platform eliminates confusion through explicit uncertainty surfacing
- Reducing confusion is a learning platform goal

### Build Cognitive Skills Over Time
- Learning platform builds cognitive skills incrementally
- Learning platform develops reasoning patterns progressively
- Learning platform improves cognitive capability over time
- Building cognitive skills is a learning platform goal

---

## 2. Non-Goals

The learning platform does not:

### Replace Human Teachers
- Learning platform does not replace human teachers
- Learning platform supplements, not substitutes, human instruction
- Replacing human teachers is prohibited
- Replacing human teachers is a violation

### Diagnose or Label Learners
- Learning platform does not diagnose learning disabilities
- Learning platform does not assign labels or categories to learners
- Diagnosing or labeling learners is prohibited
- Diagnosing or labeling learners is a violation

### Optimize for Completion or Speed
- Learning platform does not optimize for completion rates
- Learning platform does not reward speed over understanding
- Optimizing for completion or speed is prohibited
- Optimizing for completion or speed is a violation

### Act Autonomously
- Learning platform does not initiate learning sessions without human request
- Learning platform does not schedule or plan learning autonomously
- Autonomous action is prohibited
- Autonomous action is a violation

### Execute Actions in the Real World
- Learning platform does not execute actions in the real world
- Learning platform structures learning, does not act
- Executing real-world actions is prohibited
- Executing real-world actions is a violation

---

## 3. Scope Definition

### What the Learning Platform Is

The learning platform is:
- A structured dialogue system for guided inquiry
- An assessment framework that measures process over output
- A cognitive skill tracking system that avoids labeling
- A delivery surface for learning content (per Contract 42)
- A human-controlled system requiring explicit user intent

### What the Learning Platform Is Not

The learning platform is not:
- An autonomous agent that plans or schedules
- A diagnostic tool for learning disabilities
- A grading system that ranks or compares learners
- A gamification platform that uses streaks or leaderboards
- A replacement for human instruction or accountability

---

## 4. Allowed Dependencies

The learning platform may depend on:

### Learning System Contracts
- Contract 29 (Learning Loop & Outcome Discipline)
- Contract 33 (Learning Experience & Feedback)
- Contract 35 (Learning Experience Delivery)
- Contract 39 (Learning Generation)
- Contract 41 (Learning Engagement)
- Contract 42 (Learning Delivery Surfaces)

### Application Layer
- `/app/` directory for UI and API routes
- Next.js application layer for user interfaces
- API routes that call learning system functions

### Spine (Read-Only)
- May read spine decision traces for context
- May reference spine contracts for safety boundaries
- May not modify spine expressions or state

---

## 5. Disallowed Dependencies

The learning platform must not depend on:

### Direct Spine Mutation
- Learning platform does not modify `/spine/expressions/**`
- Learning platform does not alter spine gate behavior
- Direct spine mutation is prohibited
- Direct spine mutation is a violation

### Research Ingestion Direct Updates
- Learning platform does not receive direct updates from research ingestion
- Learning platform respects Contract 43 (Research to Learning Separation)
- Research-to-learning direct updates are prohibited
- Research-to-learning direct updates are violations

### Autonomous Planning Systems
- Learning platform does not use autonomous planning agents
- Learning platform does not schedule or initiate without human intent
- Autonomous planning systems are prohibited
- Autonomous planning systems are violations

---

## 6. Input/Output Schema

### Learning Session Request Schema

```yaml
LearningSessionRequest:
  learner_id: string (required)
  age_band: string (required, enum: ["6-9", "10-12", "13-15", "16-18", "adult"])
  goal: string (required, max_length: 500)
  topic: string (required, max_length: 200)
  constraints:
    time_minutes: int (optional, default: null, min: 1, max: 180)
    difficulty: string (optional, enum: ["beginner", "intermediate", "advanced"])
    accessibility_notes: string (optional, max_length: 1000)
  mode: string (required, enum: ["Socratic", "Coach", "Examiner", "Explainer"])
  safety:
    minor: bool (required)
    institution_mode: bool (required)
  context:
    prior_knowledge: string (optional, max_length: 1000)
    interests: string (optional, max_length: 500)
  output_preferences:
    verbosity: string (optional, enum: ["low", "medium", "high"], default: "medium")
    modality: string (optional, enum: ["text", "voice", "spatial"], default: "text")
```

### Learning Session Output Schema

```yaml
LearningSessionOutput:
  response: string (required, max_length: 5000)
  reasoning_artifacts:
    assumptions: [string] (required, min_items: 0)
    uncertainties: [string] (required, min_items: 0)
    checkpoints: [string] (required, min_items: 0)
  next_actions: [string] (required, min_items: 0, max_items: 5)
  refusal: null | object (optional)
    reason: string (required if refusal present)
    escalation: string (required if refusal present, enum: ["human_review", "parent_notification", "teacher_notification"])
  audit:
    contract_versions: [string] (required, min_items: 1)
    mode: string (required)
    timestamp_utc: string (required, ISO 8601 format)
    session_id: string (required)
```

---

## 7. Autonomy Ceiling Enforcement

### Explicit Human Control Required

All learning platform actions require:

### Explicit User Intent
- Learning sessions require explicit user request
- No automatic session initiation
- Explicit user intent is mandatory
- Automatic initiation is prohibited

### Human Approval for Escalation
- Escalation requires human approval
- No automatic escalation to higher autonomy
- Human approval for escalation is mandatory
- Automatic escalation is prohibited

### No Hidden Objectives
- Learning platform does not pursue hidden objectives
- All goals are explicit and user-declared
- Hidden objectives are prohibited
- Hidden objectives are violations

### No State Mutation Without User Intent
- Learning platform does not mutate state without user intent
- All state changes require explicit user action
- State mutation without user intent is prohibited
- State mutation without user intent is a violation

---

## 8. Safety Boundaries

### Minor Safety

When `safety.minor: true`:

### Required Parental/Teacher Visibility
- All learning sessions are visible to parents/teachers
- Session logs are accessible to authorized adults
- Parental/teacher visibility is mandatory
- Hiding sessions from adults is prohibited

### Restricted Topics
- Certain topics require explicit approval (per Contract 71)
- Sensitive content is blocked by default
- Topic restrictions are mandatory
- Bypassing topic restrictions is prohibited

### Enhanced Guardrails
- Additional safety checks are enforced
- More conservative refusal thresholds
- Enhanced guardrails are mandatory
- Reducing guardrails for minors is prohibited

### Institutional Use Safety

When `safety.institution_mode: true`:

### Audit Trail Requirements
- All sessions must be fully auditable
- Complete interaction history is preserved
- Audit trail requirements are mandatory
- Missing audit trails is prohibited

### Data Retention Policies
- Data retention follows institutional policies
- Student data is protected per institutional requirements
- Data retention compliance is mandatory
- Violating retention policies is prohibited

### Teacher Override Authority
- Teachers have override authority
- Teacher decisions supersede system defaults
- Teacher override authority is absolute
- Preventing teacher override is prohibited

---

## 9. Refusal and Escalation Rules

### When to Refuse

Learning platform must refuse when:

### Missing Required Information
- Required fields are missing from request
- Age band is invalid or missing
- Safety flags are missing
- Missing required information triggers refusal

### Safety Violation Detected
- Request violates age-appropriate boundaries
- Topic is restricted for age band
- Autonomy level exceeds age band limits
- Safety violations trigger refusal

### Uncertainty Cannot Be Handled
- Uncertainty is too high for safe operation
- Required assumptions cannot be made safely
- Uncertainty handling triggers refusal when unsafe

### Refusal Response Format

```yaml
refusal:
  reason: string (required, max_length: 500)
  escalation: string (required, enum: ["human_review", "parent_notification", "teacher_notification", "none"])
  suggested_alternatives: [string] (optional, max_items: 3)
```

### Escalation Paths

### Human Review
- Escalation to human reviewer for complex cases
- Human review is available for all refusals
- Human review escalation is always available

### Parent Notification
- Escalation to parent when minor safety is involved
- Parent notification is mandatory for safety violations
- Parent notification cannot be bypassed

### Teacher Notification
- Escalation to teacher in institution mode
- Teacher notification is mandatory for institutional safety
- Teacher notification cannot be bypassed

---

## 10. Observability Requirements

### Required Logs

All learning sessions must log:

### Session Metadata
- Session ID, timestamp, learner ID
- Age band, mode, topic, goal
- Session metadata logging is mandatory
- Missing session metadata is a violation

### Interaction History
- Complete turn-by-turn interaction log
- All questions, responses, and reasoning artifacts
- Interaction history logging is mandatory
- Missing interaction history is a violation

### Safety Events
- All safety checks and violations
- Escalation events and outcomes
- Safety event logging is mandatory
- Missing safety event logs is a violation

### Refusal Events
- All refusal events with reasons
- Escalation paths taken
- Refusal event logging is mandatory
- Missing refusal event logs is a violation

### Audit Trail Format

```
[timestamp_utc] [session_id] [event_type] [details]
```

Example:
```
2024-12-13T10:23:45Z session-001 "safety_check" "age_band_validation_passed"
2024-12-13T10:24:12Z session-001 "refusal" "topic_restricted_for_age_band" "escalation:parent_notification"
```

### Log Retention

- All learning platform logs: Retained for 2 years minimum
- Safety events: Retained for 5 years minimum
- Institutional mode logs: Per institutional policy (minimum 2 years)
- Audit trail retention is mandatory
- Missing retention compliance is a violation

---

## 11. Versioning and Compatibility

### Contract Versioning

This contract uses semantic versioning:
- Major version: Breaking changes to scope or safety boundaries
- Minor version: New features or capabilities
- Patch version: Clarifications or corrections

### Compatibility Rules

### Backward Compatibility
- New versions must maintain backward compatibility for 2 major versions
- Breaking changes require explicit migration path
- Backward compatibility is mandatory
- Breaking changes without migration path are prohibited

### Version Declaration
- All outputs must declare contract versions used
- Version declaration is mandatory in audit trails
- Missing version declaration invalidates output

### Migration Requirements
- Breaking changes require migration documentation
- Migration tools must be provided for major version changes
- Migration requirements are mandatory
- Breaking changes without migration are prohibited

---

## 12. Interface Boundaries

### What This Contract Owns

This contract owns:
- Learning platform scope and boundaries
- Learning session request/response schemas
- Safety boundaries for minors and institutions
- Autonomy ceiling enforcement rules
- Refusal and escalation protocols

### What This Contract Does Not Own

This contract does not own:
- Spine expressions or decision gates (Contract 28, Spine Contract)
- Research ingestion (Contract 25)
- Learning state updates (Contract 29)
- Delivery surface implementation (Contract 42)
- Assessment rubrics (Contract 70)
- Age band definitions (Contract 71)
- Cognitive skill taxonomy (Contract 72)

---

## 13. Enforcement

Violations of this contract include:
- Autonomous action without human intent
- Direct spine mutation
- Research-to-learning direct updates
- Missing safety checks for minors
- Missing audit trails
- State mutation without user intent
- Hidden objectives or goals

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## 14. Amendments

Changes to scope, safety boundaries, autonomy ceiling, or refusal rules require:
- Impact assessment on learning platform safety and effectiveness
- Testing with representative learning scenarios
- Approval from system owner
- Version increment
- Documentation in change logs
- Migration path if breaking changes

---

## 15. Immutability

### This Contract Changes Only via Explicit Revision

- Contract changes require explicit revision
- No ad-hoc edits to scope, safety, or autonomy rules
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
- No ad-hoc edits to scope, safety, or autonomy principles
- Changes require version control
- Changes are traceable and auditable

### Documented Rationale
Every contract change must include rationale:
- What changed in the contract
- Why it changed
- What it affects
- Expected impact on learning platform safety and effectiveness

### Rollback Plan
- Every contract change must have rollback plan
- Previous contract versions must be preserved
- Rollback procedure must be documented
- Rollback can be executed at any time

---

This document is version 0.1.

