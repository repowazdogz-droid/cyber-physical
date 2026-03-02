# Learning Generation Contract

This contract defines how Omega turns insight into learning and how all system changes are surfaced to the human. It governs learning outputs, update transparency, and alignment over time.

Version: 1.0  
Effective: 2024-12-13

---

## 1. Learning Goals

Learning generation must:

- **Improve judgment, not compliance**: Learning helps humans make better decisions, not follow rules blindly
- **Reduce cognitive load**: Learning must be digestible, not overwhelming
- **Preserve dignity and agency**: Learning respects human autonomy and does not imply deficiency
- **Make learning optional, calm, and reversible**: Learning is available but never forced; engagement is always voluntary

Learning is a service, not a requirement.

---

## 2. Allowed Learning Forms

Learning may be generated in the following forms, ordered from lightest to heaviest:

### Short Text Brief
- Concise summary (1-3 paragraphs)
- Key points only
- No elaboration required
- Use when: Simple insight, low complexity

### Checklist / Prompt
- Actionable items or reflection prompts
- No explanation needed
- Use when: Procedural knowledge, decision support

### Diagram / Map
- Visual representation of relationships
- Spatial or conceptual layout
- Use when: Complex relationships, system understanding

### Scenario Walkthrough
- Step-by-step exploration of a situation
- Interactive or linear
- Use when: Decision practice, failure mode understanding

### Spatial Experience (XR)
- Immersive or augmented reality presentation
- Three-dimensional exploration
- Use when: Complex systems, spatial reasoning required

### Reflection Questions
- Open-ended prompts for consideration
- No expected answers
- Use when: Ethical considerations, trade-off exploration

### Selection Rule

Choose the lightest form that preserves meaning. Do not escalate to heavier forms unless necessary.

---

## 3. Learning Constraints (Non-Negotiable)

All learning must comply with these constraints:

### ND-Safe by Default
- No overwhelming information density
- No time pressure or deadlines
- No forced attention or focus requirements
- Respects neurodivergent processing styles
- Accommodates different learning preferences

### No Urgency, No Streaks, No Gamification Pressure
- No "complete this now" messaging
- No streak counters or completion tracking
- No points, badges, or achievement systems
- No social comparison or leaderboards
- No artificial scarcity or time limits

### No Extraction
- No forced data capture about learning engagement
- No required feedback or ratings
- No tracking of completion or time spent
- No analytics on learning behavior
- Learning engagement is private

### No Shaming or "Self-Improvement" Framing
- No implication that learning is needed due to deficiency
- No "you should" or "you must" language
- No comparison to others or ideal states
- No framing of learning as self-improvement obligation
- Learning is presented as optional information, not correction

---

## 4. Trigger Conditions

Learning is generated only when one of the following conditions is met:

### Decision Made
- A decision is completed using Omega's structures
- Learning surfaces: what was considered, what trade-offs existed, what assumptions were made

### Assumption Changed
- An assumption underlying a decision framework is updated
- Learning surfaces: what changed, why it changed, what it affects

### Failure or Near-Miss Occurs
- A decision leads to an unexpected outcome or close call
- Learning surfaces: what happened, what was missed, what to watch for

### Omega Updates a Rule, Heuristic, or Default
- Omega modifies its own behavior, routing, or defaults
- Learning surfaces: what changed, why, how to use it, how to disable

Learning is not generated:
- On a schedule
- To fill quotas
- To drive engagement
- Without a clear trigger

---

## 5. Update Awareness Protocol (Mandatory)

Every meaningful system change must surface the following information:

### What Changed (Concrete)
- Specific behavior, rule, default, or capability that changed
- Before and after state (if applicable)
- No vague descriptions

### Why It Changed (Trigger)
- What event, decision, or condition caused the change
- What problem it addresses or what improvement it enables
- Traceable to a specific trigger

### What It Affects
- Which decisions, interfaces, or workflows are impacted
- What users or use cases are affected
- What dependencies exist

### How to Use It
- Clear instructions for using the new behavior
- Examples if helpful
- No assumption of prior knowledge

### How to Undo / Disable
- Explicit steps to revert the change
- How to disable the new behavior if it's optional
- Rollback procedure if applicable

### Presentation Requirements

Updates must be:
- Visible (not hidden in logs or documentation)
- Accessible (not buried in settings)
- Clear (no jargon or technical obfuscation)
- Actionable (user can respond, not just observe)

No silent updates are permitted.

---

## 6. Human Control

Humans have complete control over learning and updates:

### Learning Can Be Skipped
- All learning is optional
- No penalty for skipping
- No reminder or follow-up pressure
- Learning can be dismissed permanently

### Updates Can Be Deferred
- System changes can be deferred
- No forced acceptance
- Deferred updates remain available but do not block usage
- Updates can be reviewed later

### Nothing Forces Engagement
- No required interactions
- No forced acknowledgments
- No mandatory reviews
- System remains fully functional without engagement

### Opt-Out Options

Users can:
- Disable learning generation entirely
- Disable update notifications
- Set preferences for learning forms
- Control update frequency and presentation

All opt-out options must be:
- Easy to find
- Easy to change
- Reversible
- Documented

---

## 7. Logging

For each learning artifact, the system must log:

### Trigger
- Which condition triggered learning generation (decision, assumption change, failure, system update)
- Specific event or change that caused it
- Timestamp of trigger

### Format
- Which learning form was used (text brief, checklist, diagram, etc.)
- Why this form was selected
- Alternative forms considered

### Scope
- What decisions, systems, or knowledge areas the learning covers
- Who or what is affected
- Breadth and depth of coverage

### Linked Decision or Change
- Which decision, assumption, failure, or system update the learning relates to
- Traceable link to source event
- Context preserved

### Log Format

```
[timestamp] [trigger] [format] [scope] [linked_id] [user_action]
```

Example:
```
2024-12-13T10:23:45Z decision checklist "trade-off analysis" dec-001 skipped
```

### Log Retention

- Learning artifacts: Retained for auditability
- User actions: Logged but not used for pressure or tracking
- Minimum retention: 2 years for learning generation logs

---

## Enforcement

Violations of this contract include:
- Generating learning without a trigger
- Using urgency, streaks, or gamification
- Forcing engagement or data capture
- Silent system updates
- Missing update awareness information
- Blocking system usage until learning is completed

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to learning forms, constraints, or update protocols require:
- Impact assessment on user experience and agency
- Testing with representative users
- Approval from system owner
- Version increment
- Documentation in change logs

---
