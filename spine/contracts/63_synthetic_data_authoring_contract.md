> Status: Superseded by contract 67 [67_synthetic_data_authoring_contract.md]. Retained for audit history.

# Synthetic Data Authoring Contract

This contract defines how Omega generates synthetic data without fabrication, leakage, or misuse.

Version: 1.0  
Effective: 2024-12-13

---

## 1. Definition

Synthetic data is:

### Intentionally Generated
- Synthetic data is intentionally generated
- Generation is deliberate and purposeful
- Intentional generation is mandatory
- Accidental or random generation is prohibited

### Distribution-Aware
- Synthetic data is distribution-aware
- Distribution characteristics are known
- Distribution awareness is mandatory
- Distribution-agnostic generation is prohibited

### Purpose-Bound

- Synthetic data is purpose-bound
- Generation serves specific purpose
- Purpose binding is mandatory
- Unbound generation is prohibited

### Synthetic Data Is Not

- Synthetic data is not fabricated ground truth
- Synthetic data is not a substitute for real-world validation
- Synthetic data is not a way to inflate performance

### Fabricated Ground Truth
- Synthetic data is not fabricated ground truth
- Ground truth requires real data
- Avoiding fabrication is mandatory
- Fabricating ground truth is prohibited

### A Substitute for Real-World Validation
- Synthetic data is not a substitute for real-world validation
- Real-world validation is separate
- Avoiding substitution is mandatory
- Substituting for real-world validation is prohibited

### A Way to Inflate Performance

- Synthetic data is not a way to inflate performance
- Performance inflation is not a purpose
- Avoiding performance inflation is mandatory
- Using synthetic data to inflate performance is prohibited

---

## 2. Authoring Authority

Only Omega may:

### Define Data Purpose
- Only Omega may define data purpose
- Purpose definition is Omega's responsibility
- Omega purpose definition is mandatory
- Downstream purpose definition is prohibited

### Select Variables and Distributions
- Only Omega may select variables and distributions
- Variable and distribution selection is Omega's responsibility
- Omega selection is mandatory
- Downstream selection is prohibited

### Declare Edge Cases
- Only Omega may declare edge cases
- Edge case declaration is Omega's responsibility
- Omega edge case declaration is mandatory
- Downstream edge case declaration is prohibited

### Label Uncertainty

- Only Omega may label uncertainty
- Uncertainty labeling is Omega's responsibility
- Omega uncertainty labeling is mandatory
- Downstream uncertainty labeling is prohibited

### Downstream Systems May Not Alter Intent

- Downstream systems may not alter intent
- Data intent is immutable after authoring
- Prohibiting downstream intent alteration is mandatory
- Downstream intent alteration is prohibited

---

## 3. Purpose Binding

Every dataset must declare:

### Intended Use
- Intended use is declared
- How data will be used is explicit
- Declaring intended use is mandatory
- Missing intended use declaration invalidates dataset

### Prohibited Uses
- Prohibited uses are declared
- What data cannot be used for is explicit
- Declaring prohibited uses is mandatory
- Missing prohibited use declaration invalidates dataset

### Target Failure Modes
- Target failure modes are declared
- What failures are explored is explicit
- Declaring target failure modes is mandatory
- Missing target failure mode declaration invalidates dataset

### Evaluation Context

- Evaluation context is declared
- How data will be evaluated is explicit
- Declaring evaluation context is mandatory
- Missing evaluation context declaration invalidates dataset

### Unbound Datasets Are Invalid

- Unbound datasets are invalid
- All purpose elements must be declared
- Invalidating unbound datasets is mandatory
- Unbound datasets are prohibited

---

## 4. Grounding Requirements

All synthetic data must be grounded in:

### Declared Assumptions
- Declared assumptions ground synthetic data
- Assumptions are stated and documented
- Grounding in declared assumptions is mandatory
- Ungrounded generation is prohibited

### Known Constraints
- Known constraints ground synthetic data
- Constraints are stated and documented
- Grounding in known constraints is mandatory
- Ungrounded generation is prohibited

### Explicit Abstractions

- Explicit abstractions ground synthetic data
- Abstractions are stated and documented
- Grounding in explicit abstractions is mandatory
- Ungrounded generation is prohibited

### Undeclared Grounding Invalidates the Data

- Undeclared grounding invalidates the data
- All grounding must be explicit
- Invalidating on undeclared grounding is mandatory
- Ungrounded data is prohibited

---

## 5. Uncertainty Encoding

Omega must:

### Encode Uncertainty Explicitly
- Encode uncertainty explicitly
- Uncertainty is visible and stated
- Explicit uncertainty encoding is mandatory
- Hidden uncertainty is prohibited

### Include Ambiguity and Missingness
- Include ambiguity and missingness
- Ambiguity and missingness are represented
- Including ambiguity and missingness is mandatory
- Missing ambiguity or missingness is prohibited

### Avoid Overconfident Labels

- Avoid overconfident labels
- Confidence is calibrated
- Avoiding overconfident labels is mandatory
- Overconfident labels are prohibited

### Certainty Inflation Is Prohibited

- Certainty inflation is prohibited
- Uncertainty must not be reduced falsely
- Prohibiting certainty inflation is mandatory
- Certainty inflation is a violation

---

## 6. Edge-Case Discipline

Datasets must include:

### Rare Events
- Rare events are included
- Uncommon scenarios are represented
- Including rare events is mandatory
- Missing rare events invalidates dataset

### Near-Misses
- Near-misses are included
- Close-call scenarios are represented
- Including near-misses is mandatory
- Missing near-misses invalidates dataset

### Boundary Conditions

- Boundary conditions are included
- Edge scenarios are represented
- Including boundary conditions is mandatory
- Missing boundary conditions invalidates dataset

### Happy-Path-Only Datasets Are Invalid

- Happy-path-only datasets are invalid
- Edge cases are mandatory
- Invalidating happy-path-only datasets is mandatory
- Happy-path-only datasets are prohibited

---

## 7. Leakage Prevention

Omega must:

### Avoid Copying Proprietary Sources
- Avoid copying proprietary sources
- Proprietary content is not reproduced
- Avoiding proprietary copying is mandatory
- Copying proprietary sources is prohibited

### Prevent Memorization Artifacts
- Prevent memorization artifacts
- Training data memorization is blocked
- Preventing memorization artifacts is mandatory
- Memorization artifacts are prohibited

### Exclude Personally Identifiable Data

- Exclude personally identifiable data
- PII is not included
- Excluding PII is mandatory
- Including PII is prohibited

### Leakage Invalidates the Dataset

- Leakage invalidates the dataset
- Any leakage makes dataset invalid
- Invalidating on leakage is mandatory
- Leaked datasets are prohibited

---

## 8. Separation from Evaluation

### Synthetic Data May Support Evaluation
- Synthetic data may support evaluation
- Evaluation use is allowed
- Supporting evaluation cannot be prevented
- Evaluation use must be disclosed

### It May Not Define Success Metrics

- Synthetic data may not define success metrics
- Success metrics are separate
- Prohibiting metric definition is mandatory
- Defining success metrics is prohibited

### Evaluation Authority Is Separate

- Evaluation authority is separate
- Evaluation is independent of data generation
- Preserving separate evaluation authority is mandatory
- Merging evaluation authority is prohibited

---

## 9. Human Oversight

Human may:

### Approve Dataset Scope
- Human may approve dataset scope
- Scope approval is allowed
- Approving dataset scope cannot be prevented
- Scope approvals must be logged

### Restrict Variables
- Human may restrict variables
- Variable limits are configurable
- Restricting variables cannot be prevented
- Variable restrictions must be logged

### Demand Regeneration
- Human may demand regeneration
- Regeneration requests are allowed
- Demanding regeneration cannot be prevented
- Regeneration requests must be logged

### Halt Release

- Human may halt release
- Release stopping is allowed
- Halting release cannot be prevented
- Release halts must be logged

---

## 10. Audit Trail

Each dataset must record:

### Purpose
- Purpose is recorded
- Generation purpose is logged
- Recording purpose is mandatory
- Missing purpose record invalidates dataset

### Assumptions
- Assumptions are recorded
- All assumptions are logged
- Recording assumptions is mandatory
- Missing assumption record invalidates dataset

### Variable Definitions
- Variable definitions are recorded
- All variables are logged
- Recording variable definitions is mandatory
- Missing variable definition record invalidates dataset

### Uncertainty Notes
- Uncertainty notes are recorded
- Uncertainty documentation is logged
- Recording uncertainty notes is mandatory
- Missing uncertainty notes invalidates dataset

### Generation Date

- Generation date is recorded
- Creation timestamp is logged
- Recording generation date is mandatory
- Missing generation date record invalidates dataset

### Usage Context

- Usage context is recorded
- How data is used is logged
- Recording usage context is mandatory
- Missing usage context record invalidates dataset

---

## 11. Immutability

### This Contract Changes Only via Explicit Revision

- Contract changes require explicit revision
- No ad-hoc edits to synthetic data authoring rules
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
- No ad-hoc edits to synthetic data definitions or authoring rules
- Changes require version control
- Changes are traceable and auditable

### Documented Rationale
- Every contract change must include rationale:
  - What changed in the contract
  - Why it changed
  - What it affects
  - Expected impact on synthetic data authoring and integrity

### Rollback Plan
- Every contract change must have rollback plan
- Previous contract versions must be preserved
- Rollback procedure must be documented
- Rollback can be executed at any time

---

## Enforcement

Violations of this contract include:
- Synthetic data presented as fabricated ground truth, substitute for real-world validation, or way to inflate performance
- Downstream systems altering data intent
- Missing purpose binding declarations (intended use, prohibited uses, target failure modes, evaluation context)
- Ungrounded generation without declared assumptions, known constraints, or explicit abstractions
- Certainty inflation, missing ambiguity/missingness, or overconfident labels
- Happy-path-only datasets without rare events, near-misses, or boundary conditions
- Leakage (proprietary copying, memorization artifacts, PII inclusion)
- Synthetic data defining success metrics or merging evaluation authority
- Missing or incomplete audit trails (purpose, assumptions, variable definitions, uncertainty notes, generation date, usage context)
- Missing override logging

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to synthetic data definitions, authoring authority, purpose binding, or grounding requirements require:
- Impact assessment on synthetic data authoring and integrity
- Testing with representative generation scenarios
- Approval from system owner
- Version increment
- Documentation in change logs

---
