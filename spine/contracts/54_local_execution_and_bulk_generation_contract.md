# Local Execution & Bulk Generation Contract

This contract ensures all bulk, repetitive, or scalable production is executed locally by default, with remote models used only when strictly necessary.

Version: 1.0  
Effective: 2024-12-13

---

## 1. Definition of Bulk Work

Bulk work includes:

### Dataset Generation
- Dataset generation is bulk work
- Creating large datasets is bulk work
- Dataset generation classification is mandatory when applicable
- Missing dataset generation classification is a violation

### Large-Scale Simulation Runs
- Large-scale simulation runs are bulk work
- Running many simulations is bulk work
- Large-scale simulation classification is mandatory when applicable
- Missing large-scale simulation classification is a violation

### Batch Evaluation
- Batch evaluation is bulk work
- Evaluating many items is bulk work
- Batch evaluation classification is mandatory when applicable
- Missing batch evaluation classification is a violation

### Repetitive Transformations
- Repetitive transformations are bulk work
- Applying same transformation many times is bulk work
- Repetitive transformation classification is mandatory when applicable
- Missing repetitive transformation classification is a violation

### Exploratory Sweeps
- Exploratory sweeps are bulk work
- Testing many variations is bulk work
- Exploratory sweep classification is mandatory when applicable
- Missing exploratory sweep classification is a violation

### Content Variants Exceeding Human-Scale

- Content variants exceeding human-scale are bulk work
- Generating more variants than human can review is bulk work
- Content variant classification is mandatory when applicable
- Missing content variant classification is a violation

### Bulk Work Is Never Interactive

- Bulk work is never interactive
- Interactive work is not bulk work
- Bulk work is non-interactive by definition
- Classifying interactive work as bulk is prohibited

---

## 2. Local-First Mandate

For all bulk work:

### Local Models Are Mandatory
- Local models are mandatory for bulk work
- Bulk work must use local models
- Using local models for bulk work is mandatory
- Using remote models for bulk work without exception is prohibited

### Remote APIs Are Prohibited by Default
- Remote APIs are prohibited by default for bulk work
- Remote APIs require exception approval
- Prohibiting remote APIs by default is mandatory
- Using remote APIs without exception is prohibited

### Remote Use Requires Explicit Exception Approval

- Remote use requires explicit exception approval
- Exception approval is documented and logged
- Requiring exception approval is mandatory
- Remote use without exception approval is prohibited

---

## 3. Exception Criteria

Remote models may be used only if:

### Capability Is Unavailable Locally
- Capability is unavailable locally
- Local models cannot perform required task
- Unavailable capability assessment is mandatory
- Missing capability assessment is a violation

### Accuracy Gap Is Material
- Accuracy gap is material
- Local model accuracy is insufficient
- Material accuracy gap assessment is mandatory
- Missing accuracy gap assessment is a violation

### Safety Requires It
- Safety requires remote models
- Local models pose safety risk
- Safety requirement assessment is mandatory
- Missing safety requirement assessment is a violation

### Cost Justification Is Documented

- Cost justification is documented
- Remote model cost is justified
- Cost justification documentation is mandatory
- Missing cost justification is a violation

### All Four Must Be Assessed

- All four criteria must be assessed
- Assessment of all criteria is mandatory
- Missing any assessment is a violation
- Partial assessment is prohibited

---

## 4. Model Tiers

Omega must maintain:

### Local Fast Tier
- Local fast tier is maintained
- Fast local models are available
- Maintaining local fast tier is mandatory
- Missing local fast tier is a violation

### Local Reliable Tier
- Local reliable tier is maintained
- Reliable local models are available
- Maintaining local reliable tier is mandatory
- Missing local reliable tier is a violation

### Remote High-Assurance Tier

- Remote high-assurance tier is maintained
- High-assurance remote models are available
- Maintaining remote high-assurance tier is mandatory
- Missing remote high-assurance tier is a violation

### Routing Must Prefer Lowest Sufficient Tier

- Routing prefers lowest sufficient tier
- Lower tiers are preferred when sufficient
- Preferring lowest sufficient tier is mandatory
- Using higher tier unnecessarily is prohibited

---

## 5. Cost Protection

Bulk jobs must:

### Declare Expected Volume
- Expected volume is declared
- Volume estimate is provided
- Declaring expected volume is mandatory
- Missing volume declaration is a violation

### Estimate Total Cost
- Total cost is estimated
- Cost estimate is calculated
- Estimating total cost is mandatory
- Missing cost estimate is a violation

### Hard-Stop on Ceiling Breach

- Hard-stop occurs on ceiling breach
- Execution halts when ceiling is breached
- Hard-stopping on breach is mandatory
- Continuing after breach is prohibited

### Silent Overruns Are Forbidden

- Silent overruns are forbidden
- Overruns must be visible and logged
- Forbidding silent overruns is mandatory
- Silent overruns are violations

---

## 6. Quality Parity Checks

When local models are used:

### Sample Outputs Must Be Audited
- Sample outputs are audited
- Quality is verified through sampling
- Auditing sample outputs is mandatory
- Missing sample audits is a violation

### Degradation Must Be Logged
- Degradation is logged
- Quality issues are recorded
- Logging degradation is mandatory
- Missing degradation logs is a violation

### Parity Thresholds Must Be Defined

- Parity thresholds are defined
- Quality standards are explicit
- Defining parity thresholds is mandatory
- Missing parity thresholds is a violation

### Unacceptable Drift Halts Production

- Unacceptable drift halts production
- Production stops when quality degrades
- Halting on unacceptable drift is mandatory
- Continuing with unacceptable drift is prohibited

---

## 7. Isolation

Bulk generation must be:

### Sandboxed
- Bulk generation is sandboxed
- Isolation prevents interference
- Sandboxing bulk generation is mandatory
- Missing sandboxing is a violation

### Non-Blocking to Interactive Work
- Bulk generation does not block interactive work
- Interactive work takes priority
- Non-blocking behavior is mandatory
- Blocking interactive work is prohibited

### Cancellable at All Times

- Bulk generation is cancellable at all times
- Cancellation is immediate and safe
- Cancellability is mandatory
- Non-cancellable bulk generation is prohibited

---

## 8. Audit Trail

Every bulk job must record:

### Model Used
- Model used is recorded
- Model identifier is logged
- Recording model used is mandatory
- Missing model record is a violation

### Volume Generated
- Volume generated is recorded
- Output count is logged
- Recording volume generated is mandatory
- Missing volume record is a violation

### Execution Time
- Execution time is recorded
- Duration is logged
- Recording execution time is mandatory
- Missing execution time record is a violation

### Total Cost

- Total cost is recorded
- Actual cost is logged
- Recording total cost is mandatory
- Missing cost record is a violation

### Exception Status (If Any)

- Exception status is recorded if applicable
- Exception approval is logged
- Recording exception status is mandatory
- Missing exception status record is a violation

---

## 9. Human Controls

Humans may:

### Force Local-Only Mode
- Human can force local-only mode
- Remote models are disabled when forced
- Forcing local-only mode is allowed
- Local-only mode cannot be prevented

### Cap Batch Size
- Human can cap batch size
- Maximum batch size is configurable
- Capping batch size is allowed
- Batch size caps cannot be prevented

### Pause or Cancel Jobs
- Human can pause or cancel jobs
- Job control is immediate
- Pausing or canceling jobs is allowed
- Job control cannot be prevented

### Approve Exceptions

- Human can approve exceptions
- Exception approval is required
- Approving exceptions is allowed
- Exception approval cannot be prevented

---

## 10. Immutability

### This Contract Changes Only via Explicit Revision

- Contract changes require explicit revision
- No ad-hoc edits to local execution or bulk generation rules
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
- No ad-hoc edits to bulk work definitions or local-first rules
- Changes require version control
- Changes are traceable and auditable

### Documented Rationale
- Every contract change must include rationale:
  - What changed in the contract
  - Why it changed
  - What it affects
  - Expected impact on local execution and cost efficiency

### Rollback Plan
- Every contract change must have rollback plan
- Previous contract versions must be preserved
- Rollback procedure must be documented
- Rollback can be executed at any time

---

## Enforcement

Violations of this contract include:
- Using remote models for bulk work without exception approval
- Missing exception criteria assessments
- Missing cost protection (volume declaration, cost estimate, hard-stop)
- Missing quality parity checks or degradation logging
- Bulk generation not sandboxed or blocking interactive work
- Missing or incomplete audit trails
- Missing human controls or override logging

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to bulk work definition, local-first mandate, exception criteria, or model tiers require:
- Impact assessment on local execution and cost efficiency
- Testing with representative bulk generation scenarios
- Approval from system owner
- Version increment
- Documentation in change logs

---
