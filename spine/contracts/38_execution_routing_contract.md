# Execution Routing Contract

This contract ensures Omega routes tasks to the correct execution path (local vs external, bulk vs high-stakes) consistently and safely.

Version: 1.0  
Effective: 2024-12-13

---

## 1. Task Classification

Every task must be classified as:

### Bulk Generation
- Large-scale content or data generation tasks
- High-volume production or batch processing
- Bulk generation is a distinct task class
- Bulk generation classification is mandatory

### Exploratory Analysis
- Tasks involving exploration and experimentation
- Hypothesis testing and discovery work
- Exploratory analysis is a distinct task class
- Exploratory analysis classification is mandatory

### Learning Synthesis
- Tasks that synthesize information into learning
- Knowledge integration and learning artifact creation
- Learning synthesis is a distinct task class
- Learning synthesis classification is mandatory

### Decision Authoring
- Tasks that structure decisions and judgment
- Decision framework creation and analysis
- Decision authoring is a distinct task class
- Decision authoring classification is mandatory

### Safety / Red-Team
- Safety analysis and adversarial testing tasks
- Risk assessment and failure mode analysis
- Safety/red-team is a distinct task class
- Safety/red-team classification is mandatory

### High-Stakes Judgment
- Tasks with significant consequences or impact
- Strategic decisions and critical reasoning
- High-stakes judgment is a distinct task class
- High-stakes judgment classification is mandatory

### Unclassified Tasks Are Not Executed

- Tasks without classification are not executed
- Unclassified tasks are rejected
- Task classification is required before execution
- Executing unclassified tasks is prohibited

---

## 2. Routing Defaults

Omega must route:

### Bulk Generation → Local Models by Default
- Bulk generation routes to local models by default
- Local models are mandatory for bulk tasks
- Routing to local models is default for bulk
- Using external APIs for bulk is an exception

### Exploratory Analysis → Low-Cost Replaceable Models
- Exploratory analysis routes to low-cost replaceable models
- Low-cost models are used for exploration
- Replaceable models avoid lock-in
- Routing to low-cost replaceable models is default for exploration

### Learning Synthesis → Mid-Tier Models
- Learning synthesis routes to mid-tier models
- Mid-tier models balance cost and quality
- Mid-tier models are appropriate for synthesis
- Routing to mid-tier models is default for learning synthesis

### Decision Authoring → High-Reliability Models
- Decision authoring routes to high-reliability models
- High-reliability models ensure quality
- Reliability is critical for decision work
- Routing to high-reliability models is default for decision authoring

### Safety / Red-Team → Diverse Models
- Safety/red-team routes to diverse models
- Diversity prevents single-point failures
- Diverse models provide independent perspectives
- Routing to diverse models is default for safety/red-team

### High-Stakes Judgment → Premium Models Only
- High-stakes judgment routes to premium models only
- Premium models provide required capability
- Premium models are reserved for high-stakes work
- Routing to premium models is default for high-stakes judgment

### Defaults May Be Overridden with Justification

- Default routing may be overridden
- Overrides require explicit justification
- Justification must explain why default is insufficient
- Unjustified overrides are violations

---

## 3. Local-First Rule

If a local model meets requirements for:

### Accuracy
- Local model accuracy meets task requirements
- Accuracy requirements are satisfied
- Accuracy assessment is mandatory
- Using external APIs when local meets accuracy is prohibited

### Latency
- Local model latency meets task requirements
- Latency requirements are satisfied
- Latency assessment is mandatory
- Using external APIs when local meets latency is prohibited

### Cost
- Local model cost is acceptable
- Cost requirements are satisfied
- Cost assessment is mandatory
- Using external APIs when local meets cost is prohibited

### It Must Be Used Instead of External APIs

- Local models meeting requirements must be used
- External APIs are not used when local meets requirements
- Local-first rule is mandatory
- Violating local-first rule is prohibited

---

## 4. Cost-Aware Execution

Before execution, Omega must:

### Estimate Cost
- Cost is estimated before execution
- Cost estimation is mandatory
- Estimates are based on task characteristics
- Missing cost estimation is a violation

### Check Against Ceilings
- Estimated cost is checked against ceilings
- Ceiling comparison is mandatory
- Cost must not exceed ceilings without approval
- Missing ceiling check is a violation

### Downgrade Route If Limits Are Exceeded
- Route is downgraded if cost limits are exceeded
- Downgrade uses cheaper execution path
- Downgrade is mandatory when limits exceeded
- Exceeding limits without downgrade is prohibited

### Silent Overruns Are Forbidden

- Silent cost overruns are prohibited
- Overruns must be surfaced and logged
- Silent overruns are violations
- All overruns require explicit handling

---

## 5. Reliability Thresholds

Each route must declare:

### Acceptable Error
- Acceptable error rate or tolerance
- Error threshold must be specified
- Acceptable error declaration is mandatory
- Missing acceptable error is a violation

### Fallback Behavior
- Behavior when reliability threshold is not met
- Fallback actions must be specified
- Fallback behavior declaration is mandatory
- Missing fallback behavior is a violation

### Stop Conditions
- Conditions under which execution stops
- Stop conditions must be specified
- Stop condition declaration is mandatory
- Missing stop conditions is a violation

### If Thresholds Are Violated → Halt or Escalate

- Threshold violations trigger halt or escalation
- Halt stops execution immediately
- Escalation moves to higher-capability route
- Violating thresholds without response is prohibited

---

## 6. Fallback Handling

If a routed capability fails:

### Switch to Documented Fallback
- Execution switches to documented fallback
- Fallback must be predefined and documented
- Switching to fallback is mandatory
- Missing fallback is a violation

### Log Degradation
- Degradation is logged when fallback is used
- Logging includes reason for fallback
- Degradation logging is mandatory
- Missing degradation logging is a violation

### Surface Impact to Human
- Impact of fallback is surfaced to human
- Human is informed of capability failure
- Impact surfacing is mandatory
- Hiding fallback impact is prohibited

### No Silent Retries

- Silent retries are prohibited
- Retries must be logged and visible
- Retry attempts are explicit
- Silent retries are violations

---

## 7. Separation of Concerns

Execution routing does not:

### Change Task Intent
- Routing does not change task intent
- Task intent remains unchanged
- Changing task intent is prohibited
- Changing task intent is a violation

### Alter Assumptions
- Routing does not alter assumptions
- Assumptions remain unchanged
- Altering assumptions is prohibited
- Altering assumptions is a violation

### Rewrite Outputs
- Routing does not rewrite outputs
- Outputs remain as generated
- Rewriting outputs is prohibited
- Rewriting outputs is a violation

### Routing Only Selects *How*, Not *What*

- Routing selects execution method only
- Routing does not modify task or output
- Routing scope is limited to execution selection
- Routing beyond execution selection is prohibited

---

## 8. Human Override

Human may:

### Force Local-Only Execution
- Human can force local-only execution
- Local-only mode overrides routing defaults
- Local-only authority is absolute
- Local-only mode cannot be overridden

### Lock Tasks to Specific Routes
- Human can lock tasks to specific routes
- Route locks prevent automatic routing changes
- Route lock authority is absolute
- Route locks cannot be overridden

### Require Manual Approval Per Task
- Human can require manual approval per task
- Manual approval gates execution
- Manual approval authority is absolute
- Manual approval cannot be bypassed

### Inspect Routing Decisions
- Human can inspect all routing decisions
- Routing decision inspection is always available
- Inspection does not require technical expertise
- Inspection authority is absolute

---

## 9. Audit Trail

For every task, record:

### Task Classification
- Task class that was assigned
- Classification used for routing
- Task classification is mandatory in audit trail
- Missing task classification in audit trail is a violation

### Chosen Route
- Execution route that was selected
- Route identifier and type
- Chosen route is mandatory in audit trail
- Missing chosen route in audit trail is a violation

### Model or System Used
- Specific model or system that was used
- Model/system identifier and version
- Model/system used is mandatory in audit trail
- Missing model/system in audit trail is a violation

### Estimated vs Actual Cost
- Estimated cost before execution
- Actual cost after execution
- Cost comparison is mandatory in audit trail
- Missing cost comparison in audit trail is a violation

### Fallback Events
- Any fallback events that occurred
- Reason for fallback and impact
- Fallback events are mandatory in audit trail
- Missing fallback events in audit trail is a violation

### Audit Trail Format

```
[timestamp] [task_id] [classification] [route] [model/system] [cost_est] [cost_actual] [fallback_events]
```

Example:
```
2024-12-13T10:23:45Z task-001 "bulk_generation" "local" "local_model_v2" "$0.10" "$0.12" "none"
```

### Audit Trail Retention

- All execution routing audit trails: Retained for 2 years minimum
- Cost tracking: Retained for budget analysis
- Fallback records: Retained for reliability analysis
- Minimum retention: 2 years for all routing logs

---

## 10. Immutability

### This Contract Changes Only via Explicit Revision

- Contract changes require explicit revision
- No ad-hoc edits to routing rules or defaults
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
- No ad-hoc edits to routing principles or defaults
- Changes require version control
- Changes are traceable and auditable

### Documented Rationale
- Every contract change must include rationale:
  - What changed in the contract
  - Why it changed
  - What it affects
  - Expected impact on routing, cost, and safety

### Rollback Plan
- Every contract change must have rollback plan
- Previous contract versions must be preserved
- Rollback procedure must be documented
- Rollback can be executed at any time

---

## Enforcement

Violations of this contract include:
- Executing unclassified tasks
- Violating local-first rule without justification
- Silent cost overruns
- Missing reliability thresholds
- Silent retries or hidden fallbacks
- Routing logic changing task intent or outputs
- Missing or incomplete audit trails

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to task classification, routing defaults, local-first rule, or cost-aware execution require:
- Impact assessment on routing, cost, and safety
- Testing with representative tasks
- Approval from system owner
- Version increment
- Documentation in change logs

---
