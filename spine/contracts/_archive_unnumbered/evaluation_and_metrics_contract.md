# Evaluation, Metrics & Anti-Gaming Contract

This contract defines how Omega evaluates quality and success without creating incentives to game metrics, over-optimize, or drift from judgment-first principles.

Version: 1.0  
Effective: 2024-12-13

---

## 1. Evaluation Philosophy

Evaluation must adhere to these principles:

### Judgment Over Optimization
- Judgment quality is valued over metric optimization
- Good judgment is preferred over high scores
- Metrics support judgment, not replace it
- Optimization for metrics is prohibited

### Clarity Over Speed
- Clear evaluation is preferred over fast evaluation
- Thoroughness is valued over efficiency
- Clarity of assessment takes precedence
- Speed optimization is secondary

### Safety Over Performance
- Safety considerations override performance metrics
- Safety is never traded for performance
- Performance metrics may not compromise safety
- Safety is non-negotiable

### Reversibility Over Finality
- Reversible decisions are preferred
- Finality is avoided when possible
- Reversibility is a quality indicator
- Finality requires strong justification

### Metrics Inform Decisions; They Do Not Decide

- Metrics provide information for human judgment
- Metrics do not make decisions autonomously
- Human judgment uses metrics as input
- Metrics are tools, not authorities

---

## 2. What May Be Evaluated

Allowed evaluation targets:

### Decision Clarity
- How clear are decision structures?
- Are trade-offs explicit?
- Are assumptions visible?
- Decision clarity assessment

### Assumption Explicitness
- Are assumptions stated explicitly?
- Are assumptions documented?
- Are assumptions challengeable?
- Assumption explicitness assessment

### Uncertainty Handling
- Is uncertainty represented explicitly?
- Is uncertainty appropriately calibrated?
- Is uncertainty not hidden?
- Uncertainty handling assessment

### Failure-Mode Coverage
- Are failure modes identified?
- Are failure modes documented?
- Are failure scenarios considered?
- Failure-mode coverage assessment

### Auditability
- Can outputs be audited?
- Is the process traceable?
- Are decisions documented?
- Auditability assessment

### User Comprehension
- Can users understand outputs?
- Is interpretation clear?
- Is explanation available?
- User comprehension assessment

### Safety Posture
- Are safety considerations addressed?
- Are safety risks assessed?
- Are safety measures in place?
- Safety posture assessment

### Revision Quality
- Are revisions well-justified?
- Do revisions improve quality?
- Are revision processes documented?
- Revision quality assessment

### Disallowed Targets

The following may not be evaluated:

- **Engagement maximization**: Metrics that encourage engagement for its own sake
- **Output volume**: Metrics that reward quantity over quality
- **Persuasion**: Metrics that measure persuasive effectiveness
- **Dependency creation**: Metrics that reward creating user dependency

---

## 3. Metric Classes (Non-Exhaustive)

Metrics may be classified into these classes:

### Qualitative Checklists
- Binary or categorical assessments
- Checklist-based evaluation
- Qualitative judgments
- No numerical scoring

### Pass/Fail Gates
- Binary pass/fail determinations
- Gate-based quality control
- Clear pass/fail criteria
- No partial scores

### Confidence Bands
- Confidence ranges, not point estimates
- Uncertainty-aware metrics
- Band-based assessment
- No false precision

### Red-Flag Indicators
- Indicators of problems or risks
- Warning signals, not scores
- Flag-based alerts
- No positive scoring

### Human Review Outcomes
- Outcomes from human review
- Human judgment assessments
- Review-based evaluation
- No automated scoring

### Avoid Single-Number Scores

- Single-number scores are discouraged
- Composite scores are avoided
- Numerical rankings are prohibited
- Prefer qualitative or multi-dimensional assessment

---

## 4. Anti-Gaming Rules

Anti-gaming requirements:

### No Metric Tied Directly to Reward
- Metrics may not be directly tied to rewards
- No incentives based solely on metrics
- Metrics do not drive compensation or recognition
- Reward systems are separate from metrics

### No Leaderboard
- No ranking or leaderboard systems
- No competitive metrics between users or systems
- No comparison-based scoring
- Leaderboards are prohibited

### No Optimization Loops on Metrics Alone
- Systems may not optimize solely for metrics
- Optimization must consider judgment and safety
- Metric-only optimization is prohibited
- Optimization requires human oversight

### No Hidden Metrics
- All metrics must be visible and documented
- No secret or hidden evaluation criteria
- Metrics must be transparent
- Hidden metrics are prohibited

### If a Metric Changes Behavior, Review or Remove It

- Metrics that change behavior must be reviewed
- Behavior-changing metrics may be removed
- Metrics should inform, not drive behavior
- Behavior change triggers metric review

---

## 5. Human-in-the-Loop Requirement

All high-stakes evaluations require:

### Human Review
- High-stakes evaluations require human review
- Human judgment is mandatory
- Automated evaluation is insufficient
- Human review is documented

### Dissent Allowance
- Humans may dissent from evaluation results
- Dissent is allowed and documented
- Dissent triggers review
- Dissent is valued, not suppressed

### Documented Disagreement
- Disagreements are documented
- Disagreement rationale is recorded
- Disagreement resolution is tracked
- Disagreement is transparent

### Automated Evaluation Cannot Approve Release Alone

- Automated evaluation cannot approve release
- Human approval is required for release
- Automated evaluation supports human judgment
- Human approval is mandatory

---

## 6. Contextual Evaluation

All evaluations must state:

### Context
- Context in which evaluation occurs
- Environmental conditions and constraints
- Contextual factors affecting evaluation
- Context is explicitly stated

### Intended Audience
- Who is the evaluation for?
- Audience characteristics and needs
- Audience expectations and requirements
- Intended audience is explicitly stated

### Risk Profile
- Risk level of the evaluated output
- Risk factors and considerations
- Risk assessment and mitigation
- Risk profile is explicitly stated

### Scope Limits
- What is included in evaluation
- What is excluded from evaluation
- Evaluation boundaries and limitations
- Scope limits are explicitly stated

### Out-of-Context Metrics Are Invalid

- Metrics without context are invalid
- Context-free evaluation is prohibited
- All metrics require contextual information
- Invalid metrics are not used

---

## 7. Drift Detection

Continuously watch for:

### Overconfidence
- Metrics showing increasing confidence without justification
- Confidence levels that exceed evidence
- Overconfidence in outputs or capabilities
- Overconfidence is a drift signal

### Narrowing Exploration
- Reduction in exploration or diversity
- Focus on narrow metric optimization
- Loss of alternative approaches
- Narrowing exploration is a drift signal

### Metric Fixation
- Obsessive focus on specific metrics
- Neglect of other quality dimensions
- Metric-driven decision-making
- Metric fixation is a drift signal

### Loss of Reversibility
- Decisions becoming more final
- Reversibility mechanisms weakening
- Increased commitment to irreversible paths
- Loss of reversibility is a drift signal

### Safety Erosion
- Safety considerations being de-prioritized
- Safety metrics declining
- Safety measures being bypassed
- Safety erosion is a drift signal

### Detected Drift Triggers Pause and Review

- When drift is detected: pause operations
- Drift triggers comprehensive review
- Review identifies drift causes and mitigations
- Operations resume only after drift is addressed

---

## 8. Reporting Format

Evaluation reports must include:

### What Was Assessed
- Explicit list of what was evaluated
- Evaluation scope and boundaries
- Assessment dimensions and criteria
- What was assessed is clearly stated

### What Was Not
- Explicit list of what was not evaluated
- Exclusions and limitations
- Blind spots and gaps
- What was not assessed is clearly stated

### Known Blind Spots
- Known limitations of evaluation
- Areas not covered by evaluation
- Uncertainties in assessment
- Blind spots are explicitly acknowledged

### Confidence Level
- Confidence in evaluation results
- Uncertainty in assessment
- Reliability of evaluation
- Confidence level is explicitly stated

### Next Checks Required
- What additional checks are needed
- Follow-up evaluation requirements
- Ongoing monitoring needs
- Next checks are explicitly stated

### No Celebratory Language

- Evaluation reports are factual, not celebratory
- No marketing language or hype
- No exaggerated claims or superlatives
- Reports are neutral and honest

---

## 9. Review Cadence

Review schedules:

### Lightweight Checks Are Continuous
- Lightweight evaluation checks are continuous
- Ongoing monitoring and assessment
- Continuous quality verification
- Lightweight checks occur frequently

### Deep Reviews Are Periodic
- Comprehensive evaluations are periodic
- Periodic schedule (configurable, default: quarterly)
- Deep reviews are thorough and comprehensive
- Deep reviews occur on schedule

### Ad-Hoc Reviews After Incidents
- Reviews triggered by incidents or near-misses
- Incident-based evaluation and assessment
- Ad-hoc reviews are immediate
- Ad-hoc reviews occur as needed

### Cadence May Slow; Never Skip

- Review cadence may be adjusted (slower)
- Reviews may never be skipped
- Skipping reviews is prohibited
- Review schedule is mandatory

---

## 10. Change Control

This contract changes only by:

### Explicit Revision
- Contract changes must be explicit and documented
- No ad-hoc edits to evaluation principles or requirements
- Changes require version control
- Changes are traceable and auditable

### Documented Rationale
- Every contract change must include rationale:
  - What changed in the contract
  - Why it changed
  - What it affects
  - Expected impact on evaluation and metrics

### Rollback Plan
- Every contract change must have rollback plan
- Previous contract versions must be preserved
- Rollback procedure must be documented
- Rollback can be executed at any time

---

## Enforcement

Violations of this contract include:
- Optimizing for metrics over judgment
- Using disallowed evaluation targets
- Creating single-number scores
- Tying metrics directly to rewards
- Skipping human review for high-stakes evaluations
- Using out-of-context metrics
- Missing drift detection
- Using celebratory language in reports
- Skipping required reviews

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to evaluation philosophy, allowed evaluation targets, metric classes, or anti-gaming rules require:
- Impact assessment on judgment quality and metric gaming
- Testing with representative evaluations
- Approval from system owner
- Version increment
- Documentation in change logs

---
