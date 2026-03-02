> Status: Superseded by contract 57 [57_model_routing_and_cost_discipline_contract.md]. Retained for audit history.

# Model Routing & Cost Discipline Contract

This contract ensures Omega routes work across models deliberately, safely, and cost-efficiently without degrading judgment quality.

Version: 1.0  
Effective: 2024-12-13

---

## 1. Routing Principle

### Model Choice Is a Decision, Not a Default

- Model choice is an explicit decision
- No automatic or default model selection
- Model choice requires deliberation
- Default model selection is prohibited

### Routing Must Be Intentional

- Routing decisions are intentional
- Intentional routing requires explicit consideration
- Intentional routing is mandatory
- Unintentional routing is prohibited

### Routing Must Be Auditable

- Routing decisions are auditable
- Audit trail is comprehensive and accessible
- Auditable routing is mandatory
- Non-auditable routing is prohibited

### Routing Must Be Reversible

- Routing decisions are reversible
- Reversal restores previous routing state
- Reversible routing is mandatory
- Irreversible routing is prohibited

---

## 2. Capability Matching

Tasks must be routed based on:

### Required Reasoning Depth
- Routing considers required reasoning depth
- Reasoning depth determines model selection
- Reasoning depth assessment is mandatory
- Missing reasoning depth assessment is a violation

### Uncertainty Tolerance
- Routing considers uncertainty tolerance
- Uncertainty tolerance affects model selection
- Uncertainty tolerance assessment is mandatory
- Missing uncertainty tolerance assessment is a violation

### Modality Needs
- Routing considers modality needs
- Modality requirements determine model selection
- Modality needs assessment is mandatory
- Missing modality needs assessment is a violation

### Safety Sensitivity
- Routing considers safety sensitivity
- Safety sensitivity affects model selection
- Safety sensitivity assessment is mandatory
- Missing safety sensitivity assessment is a violation

### Latency Constraints
- Routing considers latency constraints
- Latency requirements affect model selection
- Latency constraints assessment is mandatory
- Missing latency constraints assessment is a violation

### Overpowered Models Are Not Used by Default

- Overpowered models are not default choice
- Model selection matches task requirements
- Using overpowered models by default is prohibited
- Defaulting to overpowered models is a violation

---

## 3. Cost Discipline

Omega must:

### Prefer Lowest-Capable Model That Meets Requirements
- Lowest-capable model meeting requirements is preferred
- Cost efficiency is primary consideration
- Preferring lowest-capable model is mandatory
- Using more capable models unnecessarily is prohibited

### Batch Non-Urgent Work
- Non-urgent work is batched together
- Batching reduces cost and improves efficiency
- Batching non-urgent work is mandatory
- Processing non-urgent work individually is prohibited

### Use Local Models for Bulk Generation
- Local models are used for bulk generation
- Bulk generation defaults to local models
- Using local models for bulk is mandatory
- Using remote models for bulk is prohibited

### Reserve Frontier Models for High-Stakes Reasoning
- Frontier models are reserved for high-stakes reasoning
- High-stakes reasoning justifies frontier model use
- Reserving frontier models is mandatory
- Using frontier models for non-high-stakes is prohibited

### Cost Is a First-Class Constraint

- Cost is treated as first-class constraint
- Cost considerations are primary, not secondary
- Cost as first-class constraint is mandatory
- Treating cost as secondary is prohibited

---

## 4. Local-First Policy

Where feasible:

### Bulk Synthesis
- Bulk synthesis defaults to local or open models
- Local models are preferred for bulk synthesis
- Bulk synthesis local-first is mandatory
- Using remote models for bulk synthesis is prohibited

### Data Generation
- Data generation defaults to local or open models
- Local models are preferred for data generation
- Data generation local-first is mandatory
- Using remote models for data generation is prohibited

### Formatting
- Formatting defaults to local or open models
- Local models are preferred for formatting
- Formatting local-first is mandatory
- Using remote models for formatting is prohibited

### Summarisation
- Summarisation defaults to local or open models
- Local models are preferred for summarisation
- Summarisation local-first is mandatory
- Using remote models for summarisation is prohibited

### Enumeration
- Enumeration defaults to local or open models
- Local models are preferred for enumeration
- Enumeration local-first is mandatory
- Using remote models for enumeration is prohibited

### Remote Frontier Models Are Exceptions, Not Baseline

- Remote frontier models are exceptions
- Frontier models are not baseline choice
- Frontier models as exceptions is mandatory
- Using frontier models as baseline is prohibited

---

## 5. Safety Routing

Tasks involving:

### Irreversible Decisions
- Irreversible decisions route to highest-reliability models
- Highest-reliability models are mandatory
- Routing to lower-reliability models is prohibited
- Irreversible decision routing is safety-critical

### Human Impact
- Tasks with human impact route to highest-reliability models
- Highest-reliability models are mandatory
- Routing to lower-reliability models is prohibited
- Human impact routing is safety-critical

### Governance
- Governance tasks route to highest-reliability models
- Highest-reliability models are mandatory
- Routing to lower-reliability models is prohibited
- Governance routing is safety-critical

### Deployment Gates
- Deployment gate tasks route to highest-reliability models
- Highest-reliability models are mandatory
- Routing to lower-reliability models is prohibited
- Deployment gate routing is safety-critical

### Must Route to Highest-Reliability Models Regardless of Cost

- Safety-critical tasks use highest-reliability models
- Cost is not a factor for safety routing
- Highest-reliability routing is mandatory
- Cost-based routing for safety tasks is prohibited

---

## 6. Redundancy Checks

For critical outputs:

### Use at Least Two Independent Models
- Critical outputs use at least two independent models
- Model independence prevents correlated errors
- Using two independent models is mandatory
- Using single model for critical outputs is prohibited

### Compare Disagreements
- Model disagreements are compared
- Disagreement comparison is explicit
- Comparing disagreements is mandatory
- Ignoring disagreements is prohibited

### Surface Divergence Explicitly
- Divergence between models is surfaced explicitly
- Divergence is visible and not hidden
- Surfacing divergence is mandatory
- Hiding divergence is prohibited

### Do Not Auto-Resolve Conflicts

- Conflicts are not auto-resolved
- Human decision is required for conflicts
- Auto-resolving conflicts is prohibited
- Auto-resolving conflicts is a violation

---

## 7. No Silent Upgrades

Model changes must:

### Be Explicit
- Model changes are explicit
- Changes are declared and visible
- Explicit model changes are mandatory
- Silent model changes are prohibited

### Be Logged
- Model changes are logged
- Logging is comprehensive and accessible
- Logging model changes is mandatory
- Missing model change logs is a violation

### Preserve Prior Behavior Expectations

- Model changes preserve prior behavior expectations
- Behavior expectations remain consistent
- Preserving behavior expectations is mandatory
- Breaking behavior expectations is prohibited

### Routing Drift Is Treated as System Risk

- Routing drift is treated as system risk
- Drift detection and prevention is mandatory
- Routing drift is a risk factor
- Ignoring routing drift is prohibited

---

## 8. Human Controls

Human may:

### Pin Tasks to Specific Models
- Human can pin tasks to specific models
- Pinning overrides default routing
- Pin authority is absolute
- Pinning cannot be overridden

### Cap Spending by Task Class
- Human can cap spending by task class
- Spending caps are absolute limits
- Spending cap authority is absolute
- Spending caps cannot be exceeded

### Override Routing Decisions
- Human can override routing decisions
- Overrides replace automatic routing
- Override authority is absolute
- Overrides cannot be prevented

### Audit Routing History

- Human can audit routing history
- Routing history is accessible and reviewable
- Audit authority is absolute
- Audit requests cannot be denied

---

## 9. Audit Trail

Omega must log:

### Task Type
- Task type is logged
- Task type identification is mandatory
- Task type is tracked
- Missing task type logging is a violation

### Model Selected
- Model selected is logged
- Model identification is mandatory
- Model selection is tracked
- Missing model selection logging is a violation

### Rationale
- Rationale for model selection is logged
- Rationale explains why model was chosen
- Rationale logging is mandatory
- Missing rationale logging is a violation

### Cost Class
- Cost class is logged
- Cost classification is mandatory
- Cost class is tracked
- Missing cost class logging is a violation

### Alternatives Considered

- Alternatives considered are logged
- Alternative models evaluated are recorded
- Alternatives logging is mandatory
- Missing alternatives logging is a violation

### Audit Trail Format

```
[timestamp] [task_id] [task_type] [model_selected] [rationale] [cost_class] [alternatives]
```

Example:
```
2024-12-13T10:23:45Z task-001 "bulk_generation" "local_model_v2" "cost_efficiency" "LOW" "cloud_model_a,cloud_model_b"
```

### Audit Trail Retention

- All routing audit trails: Retained for 2 years minimum
- Cost tracking: Retained for budget analysis
- Routing decisions: Retained permanently
- Minimum retention: 2 years for all routing logs

---

## 10. Immutability

### This Contract Changes Only via Explicit Revision

- Contract changes require explicit revision
- No ad-hoc edits to routing principles or cost rules
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
- No ad-hoc edits to routing principles or cost discipline
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
- Default model selection without explicit decision
- Using overpowered models by default
- Using remote models for bulk generation
- Routing safety-critical tasks to lower-reliability models
- Auto-resolving model conflicts
- Silent model changes or routing drift
- Missing or incomplete audit trails

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to routing principles, capability matching, cost discipline, or safety routing require:
- Impact assessment on routing, cost, and safety
- Testing with representative tasks
- Approval from system owner
- Version increment
- Documentation in change logs

---
