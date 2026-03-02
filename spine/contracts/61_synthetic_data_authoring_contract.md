> Status: Superseded by contract 67 [67_synthetic_data_authoring_contract.md]. Retained for audit history.

# Synthetic Data Authoring Contract

This contract defines how Omega generates synthetic data without leakage, distortion, or misuse.

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

### Decision-Relevant
- Synthetic data is decision-relevant
- Generation serves decision needs
- Decision relevance is mandatory
- Irrelevant generation is prohibited

### Explicitly Labeled as Synthetic

- Synthetic data is explicitly labeled as synthetic
- Synthetic nature is clear and visible
- Explicit synthetic labeling is mandatory
- Missing synthetic labels is prohibited

### Synthetic Data Is Not

- Synthetic data is not a proxy for ground truth
- Synthetic data is not a substitute for missing evidence
- Synthetic data is not a way to inflate volume

### A Proxy for Ground Truth
- Synthetic data is not a proxy for ground truth
- Ground truth requires real data
- Avoiding proxy use is mandatory
- Using synthetic data as proxy is prohibited

### A Substitute for Missing Evidence
- Synthetic data is not a substitute for missing evidence
- Missing evidence must remain missing
- Avoiding substitution is mandatory
- Substituting for missing evidence is prohibited

### A Way to Inflate Volume

- Synthetic data is not a way to inflate volume
- Volume inflation is not a purpose
- Avoiding volume inflation is mandatory
- Using synthetic data to inflate volume is prohibited

---

## 2. Authorization

Omega may generate synthetic data only when:

### Real Data Is Unavailable, Unethical, or Unsafe to Collect
- Real data is unavailable, unethical, or unsafe to collect
- Real data cannot be obtained
- Unavailability, unethicality, or unsafety justifies generation
- Generating without justification is prohibited

### Edge Cases Are Underrepresented
- Edge cases are underrepresented
- Real data lacks edge case examples
- Underrepresentation justifies generation
- Generating without justification is prohibited

### Failure Modes Cannot Be Observed Directly

- Failure modes cannot be observed directly
- Real failures are not observable
- Unobservability justifies generation
- Generating without justification is prohibited

### Otherwise → Do Not Generate

- Otherwise, do not generate
- No generation without justification
- Prohibiting unjustified generation is mandatory
- Unjustified generation is prohibited

---

## 3. Source Grounding

All synthetic data must be grounded in:

### Explicit Assumptions
- Explicit assumptions ground synthetic data
- Assumptions are stated and documented
- Grounding in explicit assumptions is mandatory
- Ungrounded generation is prohibited

### Declared Source Distributions
- Declared source distributions ground synthetic data
- Source distributions are stated and documented
- Grounding in declared source distributions is mandatory
- Ungrounded generation is prohibited

### Known Constraints

- Known constraints ground synthetic data
- Constraints are stated and documented
- Grounding in known constraints is mandatory
- Ungrounded generation is prohibited

### Ungrounded Generation Is Prohibited

- Ungrounded generation is prohibited
- All generation must be grounded
- Prohibiting ungrounded generation is mandatory
- Ungrounded generation is a violation

---

## 4. Labeling and Metadata

Every synthetic artifact must include:

### Synthetic Flag
- Synthetic flag is included
- Synthetic nature is clearly marked
- Including synthetic flag is mandatory
- Missing synthetic flag invalidates artifact

### Generation Purpose
- Generation purpose is included
- Why data was generated is stated
- Including generation purpose is mandatory
- Missing generation purpose invalidates artifact

### Source Assumptions
- Source assumptions are included
- Assumptions guiding generation are stated
- Including source assumptions is mandatory
- Missing source assumptions invalidates artifact

### Parameter Ranges
- Parameter ranges are included
- Generation parameters are documented
- Including parameter ranges is mandatory
- Missing parameter ranges invalidates artifact

### Known Limitations

- Known limitations are included
- Dataset limits are stated
- Including known limitations is mandatory
- Missing known limitations invalidates artifact

### Unlabeled Artifacts Are Invalid

- Unlabeled artifacts are invalid
- All required metadata must be present
- Invalidating unlabeled artifacts is mandatory
- Unlabeled artifacts are prohibited

---

## 5. Distribution Discipline

Omega must:

### Avoid Mode Collapse
- Avoid mode collapse
- Diversity is preserved
- Avoiding mode collapse is mandatory
- Mode collapse is prohibited

### Avoid Oversmoothing
- Avoid oversmoothing
- Variability is preserved
- Avoiding oversmoothing is mandatory
- Oversmoothing is prohibited

### Preserve Tail Behavior
- Preserve tail behavior
- Extreme values are maintained
- Preserving tail behavior is mandatory
- Missing tail behavior is prohibited

### Reflect Uncertainty Explicitly

- Reflect uncertainty explicitly
- Uncertainty is visible and stated
- Explicitly reflecting uncertainty is mandatory
- Hiding uncertainty is prohibited

### Synthetic Data Must Not Appear "Cleaner" Than Reality

- Synthetic data must not appear "cleaner" than reality
- Reality's messiness is preserved
- Avoiding false cleanliness is mandatory
- Appearing cleaner than reality is prohibited

---

## 6. Bias Handling

Omega must:

### Identify Inherited Biases
- Identify inherited biases
- Biases from sources are documented
- Identifying inherited biases is mandatory
- Missing bias identification is a violation

### Avoid Amplifying Minority Distortions
- Avoid amplifying minority distortions
- Minority distortions are not increased
- Avoiding amplification is mandatory
- Amplifying minority distortions is prohibited

### Document Bias Risks

- Document bias risks
- Potential biases are stated
- Documenting bias risks is mandatory
- Missing bias risk documentation is a violation

### Bias Removal Must Be Explicit, Not Implicit

- Bias removal must be explicit, not implicit
- Bias handling is visible and documented
- Requiring explicit bias removal is mandatory
- Implicit bias removal is prohibited

---

## 7. Separation from Training Claims

Synthetic data:

### Does Not Imply Model Improvement
- Synthetic data does not imply model improvement
- Improvement claims require separate evaluation
- Avoiding improvement implications is mandatory
- Implying model improvement is prohibited

### Does Not Guarantee Generalization
- Synthetic data does not guarantee generalization
- Generalization claims require separate evaluation
- Avoiding generalization guarantees is mandatory
- Guaranteeing generalization is prohibited

### Must Not Be Marketed as Equivalent to Real Data

- Synthetic data must not be marketed as equivalent to real data
- Equivalence claims are false
- Prohibiting equivalence marketing is mandatory
- Marketing as equivalent to real data is prohibited

---

## 8. Usage Constraints

Synthetic data may be used for:

### Testing
- Synthetic data may be used for testing
- Testing use is allowed
- Using for testing cannot be prevented
- Testing use must be disclosed

### Evaluation
- Synthetic data may be used for evaluation
- Evaluation use is allowed
- Using for evaluation cannot be prevented
- Evaluation use must be disclosed

### Stress Scenarios
- Synthetic data may be used for stress scenarios
- Stress scenario use is allowed
- Using for stress scenarios cannot be prevented
- Stress scenario use must be disclosed

### Augmentation (With Disclosure)

- Synthetic data may be used for augmentation with disclosure
- Augmentation use requires disclosure
- Using for augmentation with disclosure is allowed
- Augmentation without disclosure is prohibited

### It Must Not Be Used to Fabricate Evidence

- Synthetic data must not be used to fabricate evidence
- Evidence fabrication is prohibited
- Prohibiting evidence fabrication is mandatory
- Using to fabricate evidence is prohibited

---

## 9. Human Oversight

Human may:

### Approve Generation Scopes
- Human may approve generation scopes
- Scope approval is allowed
- Approving generation scopes cannot be prevented
- Scope approvals must be logged

### Cap Volumes
- Human may cap volumes
- Volume limits are configurable
- Capping volumes cannot be prevented
- Volume caps must be logged

### Reject Datasets
- Human may reject datasets
- Dataset rejection is allowed
- Rejecting datasets cannot be prevented
- Dataset rejections must be logged

### Demand Regeneration with Altered Assumptions

- Human may demand regeneration with altered assumptions
- Regeneration requests are allowed
- Demanding regeneration cannot be prevented
- Regeneration requests must be logged

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

### Generation Method
- Generation method is recorded
- How data was created is logged
- Recording generation method is mandatory
- Missing generation method record invalidates dataset

### Parameter Ranges
- Parameter ranges are recorded
- Generation parameters are logged
- Recording parameter ranges is mandatory
- Missing parameter range record invalidates dataset

### Creation Date

- Creation date is recorded
- Generation timestamp is logged
- Recording creation date is mandatory
- Missing creation date record invalidates dataset

### Approved Uses

- Approved uses are recorded
- Allowed uses are logged
- Recording approved uses is mandatory
- Missing approved uses record invalidates dataset

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
- Generating synthetic data without authorization (unavailable/unethical/unsafe real data, underrepresented edge cases, unobservable failure modes)
- Ungrounded generation without explicit assumptions, declared source distributions, or known constraints
- Missing labeling or metadata (synthetic flag, generation purpose, source assumptions, parameter ranges, known limitations)
- Mode collapse, oversmoothing, missing tail behavior, or appearing "cleaner" than reality
- Missing bias identification, amplifying minority distortions, or implicit bias removal
- Implying model improvement, guaranteeing generalization, or marketing as equivalent to real data
- Using synthetic data to fabricate evidence
- Missing or incomplete audit trails (purpose, assumptions, generation method, parameter ranges, creation date, approved uses)
- Missing override logging

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to synthetic data definitions, authorization criteria, source grounding, or distribution discipline require:
- Impact assessment on synthetic data authoring and integrity
- Testing with representative generation scenarios
- Approval from system owner
- Version increment
- Documentation in change logs

---
