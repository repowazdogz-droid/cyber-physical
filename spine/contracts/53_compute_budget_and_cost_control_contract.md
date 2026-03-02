# Compute Budget & Cost Control Contract

This contract ensures Omega uses compute deliberately, predictably, and cost-efficiently without degrading judgment quality.

Version: 1.0  
Effective: 2024-12-13

---

## 1. Compute Categories

All compute must be classified as:

### Interactive
- Interactive compute is real-time user-facing
- Interactive compute requires immediate response
- Interactive classification is mandatory when applicable
- Missing interactive classification is a violation

### Batch
- Batch compute is scheduled or queued
- Batch compute processes multiple items
- Batch classification is mandatory when applicable
- Missing batch classification is a violation

### Background
- Background compute is non-user-facing
- Background compute runs asynchronously
- Background classification is mandatory when applicable
- Missing background classification is a violation

### Exploratory
- Exploratory compute is experimental
- Exploratory compute tests hypotheses
- Exploratory classification is mandatory when applicable
- Missing exploratory classification is a violation

### Prohibited

- Prohibited compute is not allowed
- Prohibited compute is blocked
- Prohibited classification is mandatory when applicable
- Missing prohibited classification is a violation

### Unclassified Compute Is Not Executed

- Unclassified compute is not executed
- Compute classification is mandatory
- Unclassified compute is blocked
- Executing unclassified compute is prohibited

---

## 2. Budget Ownership

Each compute action must declare:

### Owner (Human or System)
- Owner is declared for each compute action
- Owner is human or system
- Owner declaration is mandatory
- Missing owner declaration blocks execution

### Budget Ceiling
- Budget ceiling is declared for each compute action
- Ceiling limits cost for the action
- Budget ceiling declaration is mandatory
- Missing budget ceiling blocks execution

### Priority Level

- Priority level is declared for each compute action
- Priority determines resource allocation
- Priority level declaration is mandatory
- Missing priority level blocks execution

### Undeclared Ownership → Blocked

- Undeclared ownership blocks execution
- All ownership elements must be declared
- Blocking on undeclared ownership is mandatory
- Executing with undeclared ownership is prohibited

---

## 3. Cost Ceilings

Omega must enforce:

### Per-Task Ceilings
- Per-task ceilings are enforced
- Each task has a cost limit
- Per-task ceiling enforcement is mandatory
- Missing per-task ceiling enforcement is a violation

### Daily Ceilings
- Daily ceilings are enforced
- Daily cost has a limit
- Daily ceiling enforcement is mandatory
- Missing daily ceiling enforcement is a violation

### Monthly Ceilings

- Monthly ceilings are enforced
- Monthly cost has a limit
- Monthly ceiling enforcement is mandatory
- Missing monthly ceiling enforcement is a violation

### Ceiling Breaches Halt Execution

- Ceiling breaches halt execution
- Execution stops when ceiling is breached
- Halting on breach is mandatory
- Continuing execution after breach is prohibited

---

## 4. Model Selection Constraints

Model choice must consider:

### Task Criticality
- Task criticality is considered in model selection
- Critical tasks may justify higher-cost models
- Task criticality consideration is mandatory
- Missing task criticality consideration is a violation

### Required Reliability
- Required reliability is considered in model selection
- Reliability requirements affect model choice
- Required reliability consideration is mandatory
- Missing reliability consideration is a violation

### Marginal Cost
- Marginal cost is considered in model selection
- Cost difference between models is evaluated
- Marginal cost consideration is mandatory
- Missing marginal cost consideration is a violation

### Available Local Alternatives

- Available local alternatives are considered in model selection
- Local models are evaluated before remote models
- Local alternative consideration is mandatory
- Missing local alternative consideration is a violation

### High-Cost Models Require Justification

- High-cost models require justification
- Justification explains why high cost is necessary
- Justification for high-cost models is mandatory
- Using high-cost models without justification is prohibited

---

## 5. Local-First Policy

For bulk or repetitive workloads:

### Local Models Are Preferred
- Local models are preferred for bulk or repetitive workloads
- Local models are default choice
- Preferring local models is mandatory
- Using remote models unnecessarily is prohibited

### Remote Models Are Exceptions
- Remote models are exceptions for bulk or repetitive workloads
- Remote models require justification
- Remote models as exceptions is mandatory
- Using remote models as default is prohibited

### Exceptions Must Be Logged

- Exceptions to local-first policy must be logged
- Exception logging is mandatory
- Missing exception logs is a violation
- Exception logging is required

---

## 6. Degradation Rules

When budgets tighten:

### Reduce Volume Before Quality
- Volume is reduced before quality
- Quality is preserved when possible
- Reducing volume first is mandatory
- Reducing quality before volume is prohibited

### Delay Non-Critical Tasks
- Non-critical tasks are delayed
- Critical tasks take priority
- Delaying non-critical tasks is mandatory
- Delaying critical tasks is prohibited

### Never Shortcut Safety or Audit

- Safety is never shortcut
- Audit is never shortcut
- Preserving safety and audit is mandatory
- Shortcutting safety or audit is prohibited

---

## 7. Monitoring

Omega must track:

### Cost Per Task
- Cost per task is tracked
- Task-level cost is measured
- Cost per task tracking is mandatory
- Missing cost per task tracking is a violation

### Cost Per Outcome
- Cost per outcome is tracked
- Outcome-level cost is measured
- Cost per outcome tracking is mandatory
- Missing cost per outcome tracking is a violation

### Cost Drift Over Time

- Cost drift over time is tracked
- Cost trends are monitored
- Cost drift tracking is mandatory
- Missing cost drift tracking is a violation

### Unexplained Drift Is Flagged

- Unexplained cost drift is flagged
- Drift without explanation triggers alert
- Flagging unexplained drift is mandatory
- Missing drift flags is a violation

---

## 8. Human Controls

Humans may:

### Set Budgets
- Human can set budgets
- Budgets are configurable
- Setting budgets is allowed
- Budget setting cannot be prevented

### Lock Ceilings
- Human can lock ceilings
- Ceilings are fixed and cannot be exceeded
- Locking ceilings is allowed
- Ceiling locks cannot be prevented

### Approve Overruns
- Human can approve overruns
- Overruns require explicit approval
- Approving overruns is allowed
- Overrun approval cannot be prevented

### Force Local Execution

- Human can force local execution
- Local execution is mandatory when forced
- Forcing local execution is allowed
- Forced local execution cannot be prevented

### All Overrides Are Logged

- All human overrides are logged
- Override logging is mandatory
- Missing override logs is a violation
- Override logging is required

---

## 9. Separation from Learning

Cost optimisation must not:

### Bias Conclusions
- Cost optimization does not bias conclusions
- Conclusions remain independent of cost
- Preventing cost bias is mandatory
- Cost optimization biasing conclusions is prohibited

### Suppress Uncertainty
- Cost optimization does not suppress uncertainty
- Uncertainty remains visible
- Preventing uncertainty suppression is mandatory
- Cost optimization suppressing uncertainty is prohibited

### Distort Evidence Weighting

- Cost optimization does not distort evidence weighting
- Evidence weights remain accurate
- Preventing evidence distortion is mandatory
- Cost optimization distorting evidence is prohibited

---

## 10. Immutability

### This Contract Changes Only via Explicit Revision

- Contract changes require explicit revision
- No ad-hoc edits to compute budget or cost control rules
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
- No ad-hoc edits to compute categories or budget rules
- Changes require version control
- Changes are traceable and auditable

### Documented Rationale
- Every contract change must include rationale:
  - What changed in the contract
  - Why it changed
  - What it affects
  - Expected impact on compute cost and efficiency

### Rollback Plan
- Every contract change must have rollback plan
- Previous contract versions must be preserved
- Rollback procedure must be documented
- Rollback can be executed at any time

---

## Enforcement

Violations of this contract include:
- Executing unclassified compute
- Missing budget ownership or ceiling declarations
- Missing ceiling enforcement
- Using high-cost models without justification
- Violating local-first policy without logging
- Shortcutting safety or audit for cost
- Missing cost monitoring or drift flags
- Cost optimization biasing conclusions or suppressing uncertainty
- Missing or incomplete override logging

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to compute categories, budget ownership, cost ceilings, or degradation rules require:
- Impact assessment on compute cost and efficiency
- Testing with representative compute scenarios
- Approval from system owner
- Version increment
- Documentation in change logs

---
