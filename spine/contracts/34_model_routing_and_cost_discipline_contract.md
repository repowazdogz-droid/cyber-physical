> Status: Superseded by contract 57 [57_model_routing_and_cost_discipline_contract.md]. Retained for audit history.

# Model Routing & Cost Discipline Contract

This contract ensures Omega routes tasks to the correct models (cloud or local) with strict cost, capability, and safety discipline.

Version: 1.0  
Effective: 2024-12-13

---

## 1. Routing Principle

Model selection must optimise for:

### Correctness
- Correctness is the primary optimization target
- Model selection prioritizes accuracy and reliability
- Correctness takes precedence over other factors
- Correctness optimization is mandatory

### Cost Efficiency
- Cost efficiency is a key optimization target
- Model selection minimizes cost while maintaining quality
- Cost efficiency is considered in all routing decisions
- Cost efficiency optimization is mandatory

### Safety
- Safety is a key optimization target
- Model selection prioritizes safe and reliable outputs
- Safety considerations override convenience
- Safety optimization is mandatory

### Privacy
- Privacy is a key optimization target
- Model selection respects data privacy requirements
- Privacy considerations influence routing decisions
- Privacy optimization is mandatory

### Latency (Only When Relevant)
- Latency is optimized only when relevant
- Latency optimization applies to time-sensitive tasks
- Latency is not optimized for non-time-sensitive tasks
- Latency optimization is conditional

### Never Route Based on Novelty or Brand

- Novelty is not a routing factor
- Brand is not a routing factor
- Routing by novelty or brand is prohibited
- Novelty or brand-based routing is a violation

---

## 2. Task Classification

Every task must be classified before execution:

### Reasoning-Critical
- Tasks requiring deep reasoning and complex logic
- Strategic decisions and architecture work
- Reasoning-critical classification is mandatory
- Reasoning-critical tasks require appropriate models

### Generation-Heavy
- Tasks focused on content or data generation
- High-volume output requirements
- Generation-heavy classification is mandatory
- Generation-heavy tasks require appropriate models

### Bulk Production
- Large-scale repetitive production tasks
- Batch processing and high-volume operations
- Bulk production classification is mandatory
- Bulk production tasks require appropriate models

### Exploratory
- Tasks involving exploration and experimentation
- Hypothesis testing and discovery work
- Exploratory classification is mandatory
- Exploratory tasks require appropriate models

### Safety-Critical
- Tasks with safety or risk implications
- Safety analysis and verification work
- Safety-critical classification is mandatory
- Safety-critical tasks require appropriate models

### Private/Confidential
- Tasks involving sensitive or confidential data
- Privacy-sensitive operations
- Private/confidential classification is mandatory
- Private/confidential tasks require appropriate models

### Unclassified Tasks Are Rejected

- Tasks without classification are rejected
- Unclassified tasks do not proceed
- Task classification is required before execution
- Rejection of unclassified tasks is mandatory

---

## 3. Model Tiers

Omega may route to:

### Frontier Cloud Models (High-Stakes Reasoning Only)
- Frontier cloud models are reserved for high-stakes reasoning
- High-stakes reasoning justifies frontier model use
- Frontier models are not used for routine tasks
- Frontier cloud models are tier 1

### Mid-Tier Cloud Models (General Generation)
- Mid-tier cloud models handle general generation tasks
- General generation uses mid-tier models
- Mid-tier models balance cost and capability
- Mid-tier cloud models are tier 2

### Local Models (Bulk, Repeatable, Low-Risk Work)
- Local models handle bulk, repeatable, low-risk work
- Bulk production defaults to local models
- Local models are preferred for routine tasks
- Local models are tier 3

### Bulk Output Defaults to Local Models

- Bulk output tasks default to local models
- Local models are the default for bulk production
- Bulk output routing to local models is mandatory
- Using cloud models for bulk is an exception

---

## 4. Cost Discipline

Omega must:

### Track Cost Per Task
- Cost is tracked for every task
- Per-task cost tracking is mandatory
- Cost tracking is comprehensive and accurate
- Missing cost tracking is a violation

### Enforce Per-Task Budgets
- Per-task budgets are enforced
- Budget enforcement prevents cost overruns
- Budget limits are mandatory
- Exceeding budgets without authorization is prohibited

### Prefer Cheaper Models When Quality Is Sufficient
- Cheaper models are preferred when quality is sufficient
- Cost optimization does not compromise quality
- Model selection balances cost and quality
- Using expensive models unnecessarily is prohibited

### Escalate Only When Failure Risk Justifies Cost
- Escalation to expensive models requires justification
- Failure risk must justify higher cost
- Escalation is exception-based, not default
- Unjustified escalation is prohibited

### Silent Cost Creep Is Forbidden

- Silent cost increases are prohibited
- Cost changes must be visible and logged
- Cost creep must be detected and surfaced
- Silent cost creep is a violation

---

## 5. Local Model Priority

Local models must be used when:

### Tasks Are Repetitive
- Repetitive tasks use local models
- Local models handle repetitive work efficiently
- Repetitive task routing to local models is mandatory
- Using cloud models for repetitive tasks is prohibited

### Outputs Are High-Volume
- High-volume outputs use local models
- Local models handle high-volume efficiently
- High-volume routing to local models is mandatory
- Using cloud models for high-volume is prohibited

### Latency Is Acceptable
- Tasks with acceptable latency use local models
- Local models are used when latency is not critical
- Acceptable latency routing to local models is mandatory
- Using cloud models unnecessarily is prohibited

### Privacy Is Required
- Privacy-sensitive tasks use local models
- Local models preserve privacy by default
- Privacy requirement routing to local models is mandatory
- Using cloud models for private data is prohibited

### Reasoning Depth Is Moderate
- Moderate reasoning depth tasks use local models
- Local models handle moderate reasoning adequately
- Moderate reasoning routing to local models is mandatory
- Using cloud models for moderate reasoning is unnecessary

### Cloud Models Are Exceptions, Not Defaults

- Cloud models are exceptions, not defaults
- Local models are the default choice
- Cloud model use requires justification
- Defaulting to cloud models is prohibited

---

## 6. Safety Routing

Safety-critical tasks must:

### Use Validated Models Only
- Safety-critical tasks use validated models exclusively
- Model validation is required for safety-critical work
- Unvalidated models are prohibited for safety-critical tasks
- Using unvalidated models is a violation

### Avoid Experimental or Untrusted Endpoints
- Safety-critical tasks avoid experimental endpoints
- Safety-critical tasks avoid untrusted endpoints
- Experimental or untrusted endpoints are prohibited
- Using experimental or untrusted endpoints is a violation

### Log Routing Decisions Explicitly
- Safety-critical routing decisions are logged explicitly
- Routing decision logging is mandatory for safety-critical tasks
- Explicit logging is required
- Missing or incomplete logging is a violation

---

## 7. Redundancy & Fallback

For critical tasks:

### Allow Secondary Model Verification
- Critical tasks may use secondary model verification
- Secondary verification improves reliability
- Secondary verification is allowed for critical tasks
- Secondary verification is optional but recommended

### Surface Disagreement Explicitly
- Model disagreements are surfaced explicitly
- Disagreements are not hidden or averaged
- Explicit disagreement surfacing is mandatory
- Hiding disagreements is prohibited

### Never Average Conflicting Outputs Silently
- Conflicting outputs are not averaged silently
- Averaging requires explicit acknowledgment
- Silent averaging is prohibited
- Averaging conflicting outputs silently is a violation

---

## 8. Human Override

Human may:

### Force a Specific Model
- Human can force use of a specific model
- Model forcing overrides default routing
- Forced model selection is absolute
- Model forcing authority is absolute

### Lock Routing for a Task Class
- Human can lock routing for a task class
- Routing locks prevent automatic changes
- Locked routing is permanent until unlocked
- Routing lock authority is absolute

### Impose Hard Cost Ceilings
- Human can impose hard cost ceilings
- Cost ceilings are absolute limits
- Cost ceilings cannot be exceeded
- Cost ceiling authority is absolute

### Inspect Routing Decisions
- Human can inspect all routing decisions
- Routing decision inspection is always available
- Inspection does not require technical expertise
- Inspection authority is absolute

---

## 9. Audit Trail

For every routed task record:

### Task Type
- Task type that was classified
- Task type used for routing
- Task type is mandatory in audit trail
- Missing task type in audit trail is a violation

### Model Used
- Specific model that was used
- Model identifier and version
- Model used is mandatory in audit trail
- Missing model in audit trail is a violation

### Cost Estimate
- Estimated cost before execution
- Cost estimate is mandatory in audit trail
- Missing cost estimate in audit trail is a violation
- Cost estimate enables budget planning

### Actual Cost
- Actual cost after execution
- Actual cost is mandatory in audit trail
- Missing actual cost in audit trail is a violation
- Actual cost enables cost analysis

### Rationale for Selection
- Why this model was selected
- Which routing factors applied
- Rationale is mandatory in audit trail
- Missing rationale in audit trail is a violation

### Audit Trail Format

```
[timestamp] [task_id] [task_type] [model] [cost_estimate] [actual_cost] [rationale]
```

Example:
```
2024-12-13T10:23:45Z task-001 "reasoning_critical" "frontier_cloud_v2" "$0.15" "$0.18" "high_stakes_reasoning_required"
```

### Audit Trail Retention

- All routing audit trails: Retained for 2 years minimum
- Cost tracking: Retained for budget analysis
- Routing decisions: Retained permanently
- Minimum retention: 2 years for all routing logs

---

## 10. Separation of Concerns

Routing logic must not:

### Alter Task Intent
- Routing logic does not change task intent
- Task intent remains unchanged by routing
- Altering task intent is prohibited
- Altering task intent is a violation

### Rewrite Outputs
- Routing logic does not rewrite model outputs
- Outputs remain as generated by models
- Rewriting outputs is prohibited
- Rewriting outputs is a violation

### Optimise Content
- Routing logic does not optimize content
- Content optimization is separate from routing
- Optimizing content in routing logic is prohibited
- Optimizing content is a violation

### It Selects Execution Only

- Routing logic selects execution method only
- Routing is limited to model selection
- Routing does not modify tasks or outputs
- Routing scope is limited to execution selection

---

## Change Control

This contract changes only via explicit revision:

### Explicit Revision
- Contract changes must be explicit and documented
- No ad-hoc edits to routing principles or cost rules
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
- Routing based on novelty or brand
- Unclassified task execution
- Silent cost creep
- Using cloud models as default for bulk
- Using unvalidated models for safety-critical tasks
- Silent averaging of conflicting outputs
- Routing logic altering task intent or outputs
- Missing or incomplete audit trails

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to routing principles, task classification, model tiers, cost discipline, or safety routing require:
- Impact assessment on routing quality, cost, and safety
- Testing with representative tasks
- Approval from system owner
- Version increment
- Documentation in change logs

---