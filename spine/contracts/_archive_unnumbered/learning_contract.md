# Learning & Feedback Loop Contract

This contract ensures Omega continuously improves without silent drift. Learning must be explicit, reversible, and human-aligned.

Version: 1.0  
Effective: 2024-12-13

---

## 1. Learning Principles

Learning must adhere to these principles:

### Learning Improves Judgment, Not Trivia
- Learning focuses on decision-making capability
- Learning improves trade-off analysis, assumption surfacing, uncertainty handling
- Learning does not optimize for trivia, facts, or non-judgment tasks
- All learning must map to judgment improvement

### No Silent Updates
- All learning updates must be visible and explained
- No background learning that changes behavior without disclosure
- No hidden parameter adjustments
- All updates require explicit documentation

### Reversibility Is Mandatory
- Every learning update must be reversible
- Rollback path must be documented before update
- Previous state must be preserved
- Irreversible updates require exceptional justification

### Human Comprehension > Model Optimisation
- Learning must be understandable to humans
- Complex optimizations that cannot be explained are prohibited
- Human comprehension takes priority over model performance gains
- Learning that improves metrics but reduces comprehension is rejected

---

## 2. Learning Sources

Learning may use these sources only:

### Allowed Inputs

#### Outcomes from Decisions
- Results of decisions made using Omega's structures
- Success or failure indicators
- Outcome quality assessments
- Requirements: Documented decisions, measurable outcomes

#### Simulation Results
- Results from scenario simulations
- What-if analysis outcomes
- Model predictions vs. actual outcomes
- Requirements: Validated simulations, documented assumptions

#### Failures & Near-Misses
- Documented failures in decision-making
- Near-miss incidents that indicate gaps
- Systematic error patterns
- Requirements: Root cause analysis, pattern identification

#### Human Feedback (Explicit)
- Direct human feedback on Omega's outputs
- Explicit corrections or improvements
- Human assessments of decision quality
- Requirements: Explicit, documented, traceable to human source

#### Red-Team Findings
- Security analysis results
- Adversarial testing outcomes
- Failure mode discoveries
- Requirements: Documented findings, validated threats

#### Post-Run Validation Signals
- Validation gate results
- Quality checks after execution
- Constraint compliance assessments
- Requirements: Automated or manual validation, documented results

### Disallowed

The following sources are prohibited:
- **Popularity metrics**: Usage frequency, engagement rates, click-through rates
- **Engagement-only signals**: Time spent, completion rates without quality assessment
- **Unverified external claims**: Third-party claims without validation
- **Social signals**: Likes, shares, ratings without substantive feedback

---

## 3. Learning Types

Learning is classified into these types. Each type has distinct update procedures:

### Parameter Updates
- Heuristic weights, decision thresholds, confidence calibrations
- Numerical adjustments to existing parameters
- Requirements: Explanation of change, impact assessment, rollback path

### Prompt Updates
- Changes to prompts, instructions, or templates
- Modifications to how Omega structures decisions
- Requirements: Before/after comparison, rationale, validation

### Routing Adjustments
- Changes to model routing rules
- Updates to work class assignments
- Modifications to escalation paths
- Requirements: Cost impact assessment, quality verification

### Guardrail Refinements
- Updates to safety constraints
- Modifications to stop conditions
- Changes to reversibility rules
- Requirements: Safety impact assessment, explicit approval

### Deprecations / Forgetting
- Removal or de-weighting of unused knowledge
- Archiving of outdated heuristics
- Forgetting of low-signal patterns
- Requirements: Justification for deprecation, preservation of archived content

---

## 4. Update Cadence

Updates follow defined cadences. No ad-hoc global changes are permitted.

### Micro-Updates: Continuous but Gated
- Small parameter adjustments
- Minor prompt refinements
- Low-impact routing tweaks
- **Gating**: Must pass validation gates, logged but not require acknowledgment
- **Frequency**: Continuous as learning occurs
- **Scope**: Local impact only

### Structural Updates: Scheduled
- Major prompt changes
- Routing rule modifications
- Guardrail updates
- **Gating**: Require explanation, human acknowledgment, rollback path
- **Frequency**: Scheduled (configurable, default: weekly review)
- **Scope**: May affect multiple workflows

### Worldview Snapshots: Periodic
- Comprehensive system state capture
- Assumptions, heuristics, safety posture documented
- **Gating**: Read-only once created, no updates
- **Frequency**: Periodic (configurable, default: quarterly)
- **Scope**: System-wide state preservation

### No Ad-Hoc Global Changes
- Global changes outside cadence are prohibited
- Emergency changes require explicit override and justification
- All global changes must follow structural update procedures

---

## 5. Explanation Requirement

Every meaningful update must generate an explanation. No explanation → no update.

### Required Explanation Elements

#### What Changed
- Specific parameter, prompt, rule, or constraint that changed
- Before and after state (if applicable)
- Concrete description, not abstract

#### Why It Changed
- Which learning source triggered the change
- What problem or opportunity the change addresses
- What evidence supports the change

#### What It Affects
- Which decisions, workflows, or outputs are impacted
- Scope of change (local, structural, global)
- Dependencies or cascading effects

#### Risks Introduced
- What new risks or uncertainties are introduced
- What safety considerations apply
- What could go wrong

#### How to Rollback
- Explicit steps to revert the change
- Where to find previous state
- What will be restored

### Explanation Delivery

Explanations must be:
- Generated before update is applied
- Delivered to human operator
- Accessible and searchable
- Linked to the update in logs

Missing any required element prevents update application.

---

## 6. Human Acknowledgment

Updates affecting judgment require human acknowledgment.

### Acknowledgment Requirements

#### Judgment-Affecting Updates
- Parameter updates that change decision outputs
- Prompt updates that modify decision structures
- Guardrail refinements that change safety behavior
- All require explicit human acknowledgment

#### Optional Sandbox Preview
- Human may request sandbox preview before adoption
- Preview shows update impact on sample decisions
- Preview does not commit to adoption
- Preview results inform acknowledgment decision

### Acknowledgment Process

- Update explanation is presented
- Human reviews explanation and (optionally) preview
- Human acknowledges or rejects update
- Acknowledgment is logged with human identifier
- Rejected updates are not applied

### Non-Judgment Updates

Updates that do not affect judgment (cosmetic, formatting, logging) do not require acknowledgment but must still be logged.

---

## 7. Rollback & Decay

Every update has rollback capability. Unused learnings decay.

### Rollback Requirements

#### Every Update Has a Rollback Path
- Rollback procedure documented before update
- Previous state preserved
- Rollback can be executed at any time
- Rollback does not destroy information

#### Rollback Execution
- Human-initiated rollback
- Rollback reason logged
- Previous state restored
- Update marked as rolled back

### Decay Mechanism

#### Unused Learnings Decay Over Time
- Learnings not referenced in decisions decay
- Decay threshold: Configurable (default: 12 months)
- Decay reduces weight, not deletion
- Decayed learnings remain searchable

#### Deprecated Rules Are Archived, Not Deleted
- Rules that are no longer used are archived
- Archived rules are read-only
- Archived rules remain available for audit
- No deletion of deprecated rules

---

## 8. Validation After Learning

After learning updates, validation must occur:

### Regression Checks Against Prior Decisions
- Sample of prior decisions re-evaluated with new learning
- Check for significant output changes
- Verify that improvements are improvements, not regressions
- Document any regressions found

### Safety Invariants Re-Verified
- All safety invariants must still hold after update
- Reversibility, explicit uncertainty, stop-on-ambiguity verified
- Safety constraints still enforced
- No safety degradation allowed

### Uncertainty Handling Unchanged Unless Explicitly Revised
- Uncertainty representation must remain explicit
- Uncertainty tags must still be applied correctly
- Stop-on-uncertainty rules must still function
- Changes to uncertainty handling require explicit approval

### Validation Failure Handling

If validation fails:
- Update is rolled back automatically
- Failure is logged and analyzed
- Update is revised or rejected
- Human is notified of validation failure

---

## 9. Learning Audit Log

Every learning update must log:

### Source
- Which learning source triggered update (outcome, simulation, failure, feedback, red-team, validation)
- Specific event or data that caused learning
- Timestamp of source event

### Type
- Learning type: parameter update, prompt update, routing adjustment, guardrail refinement, deprecation
- Classification of update type
- Scope indicator (micro, structural, snapshot)

### Scope
- What is affected by the update
- Which decisions, workflows, or outputs are impacted
- Local, structural, or global scope

### Explanation Delivered (Yes/No)
- Whether required explanation was generated
- Whether explanation was delivered to human
- Link to explanation content

### Human Acknowledgment (Yes/No)
- Whether human acknowledgment was required
- Whether human acknowledged or rejected
- Human identifier (if acknowledged)
- Timestamp of acknowledgment

### Rollback Available (Yes/No)
- Whether rollback path exists
- Whether rollback has been executed
- Rollback timestamp (if executed)

### Log Format

```
[timestamp] [source] [type] [scope] [explanation] [acknowledged] [rollback_available]
```

Example:
```
2024-12-13T10:23:45Z failure parameter_update local yes yes yes
```

### Log Retention

- All learning updates: Retained permanently
- Rollback actions: Logged and retained
- Validation results: Retained for analysis
- Minimum retention: 10 years for all learning logs

---

## Enforcement

Violations of this contract include:
- Learning from disallowed sources
- Updates without explanation
- Updates without rollback path
- Silent updates that change behavior
- Missing validation after learning
- Missing or incomplete logs

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to learning principles, sources, types, or cadence require:
- Impact assessment on learning quality and human comprehension
- Testing with representative learning scenarios
- Approval from system owner
- Version increment
- Documentation in change logs

---
