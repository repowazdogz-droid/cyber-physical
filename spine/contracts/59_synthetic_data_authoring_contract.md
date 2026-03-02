> Status: Superseded by contract 67 [67_synthetic_data_authoring_contract.md]. Retained for audit history.

# Synthetic Data Authoring Contract

This contract defines how Omega generates synthetic data with intent, discipline, and auditability — without volume chasing or distributional lies.

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

### Assumption-Bound
- Synthetic data is assumption-bound
- Assumptions define generation limits
- Assumption binding is mandatory
- Unbound synthetic data is prohibited

### Traceable to Decision Needs

- Synthetic data is traceable to decision needs
- Generation purpose is explicit
- Traceability to decision needs is mandatory
- Untraceable synthetic data is prohibited

### Synthetic Data Is Not

- Synthetic data is not random augmentation
- Synthetic data is not realism theater
- Synthetic data is not proxy for missing understanding

### Random Augmentation
- Synthetic data is not random augmentation
- Random augmentation lacks intent
- Avoiding random augmentation is mandatory
- Random augmentation is prohibited

### Realism Theater
- Synthetic data is not realism theater
- Realism theater deceives
- Avoiding realism theater is mandatory
- Realism theater is prohibited

### Proxy for Missing Understanding

- Synthetic data is not proxy for missing understanding
- Missing understanding must remain explicit
- Avoiding proxy use is mandatory
- Using synthetic data as proxy is prohibited

---

## 2. Authorization

Omega may generate synthetic data only when:

### Real Data Is Unavailable, Unethical, or Unsafe
- Real data is unavailable, unethical, or unsafe
- Real data cannot be used
- Unavailability, unethicality, or unsafety justifies generation
- Generating without justification is prohibited

### Specific Failure Modes Are Underrepresented
- Specific failure modes are underrepresented
- Real data lacks failure examples
- Underrepresentation justifies generation
- Generating without justification is prohibited

### A Decision or Evaluation Requires It

- A decision or evaluation requires synthetic data
- Decision needs justify generation
- Decision requirement justifies generation
- Generating without justification is prohibited

### Otherwise → Do Not Generate

- Otherwise, do not generate
- No generation without justification
- Prohibiting unjustified generation is mandatory
- Unjustified generation is prohibited

---

## 3. Assumption Declaration

Each dataset must declare:

### Source Assumptions
- Source assumptions are declared
- What assumptions guide generation is explicit
- Declaring source assumptions is mandatory
- Missing source assumption declaration invalidates dataset

### Generation Rules
- Generation rules are declared
- How data is created is explicit
- Declaring generation rules is mandatory
- Missing generation rule declaration invalidates dataset

### Excluded Conditions
- Excluded conditions are declared
- What is not included is explicit
- Declaring excluded conditions is mandatory
- Missing excluded condition declaration invalidates dataset

### Intended Use

- Intended use is declared
- How data will be used is explicit
- Declaring intended use is mandatory
- Missing intended use declaration invalidates dataset

### Undeclared Assumptions Invalidate the Dataset

- Undeclared assumptions invalidate the dataset
- All assumptions must be explicit
- Invalidating on undeclared assumptions is mandatory
- Datasets with undeclared assumptions are prohibited

---

## 4. Distribution Discipline

Omega must:

### Avoid Mimicking Real-World Frequency Unless Justified
- Avoid mimicking real-world frequency unless justified
- Frequency mimicry requires justification
- Avoiding unjustified frequency mimicry is mandatory
- Unjustified frequency mimicry is prohibited

### Explicitly Label Counterfactual Distributions
- Explicitly label counterfactual distributions
- Counterfactual distributions are clearly marked
- Explicitly labeling counterfactual distributions is mandatory
- Missing counterfactual labels is a violation

### Prevent Silent Bias Amplification

- Prevent silent bias amplification
- Bias amplification is blocked
- Preventing silent bias amplification is mandatory
- Silent bias amplification is prohibited

### "Looks Realistic" Is Not a Criterion

- "Looks realistic" is not a criterion
- Realism is not a quality measure
- Avoiding realism as criterion is mandatory
- Using realism as criterion is prohibited

---

## 5. Edge-Case Priority

Synthetic data must preferentially include:

### Failures
- Failures are preferentially included
- Failure cases are prioritized
- Preferentially including failures is mandatory
- Missing failures invalidates dataset

### Near-Misses
- Near-misses are preferentially included
- Near-miss cases are prioritized
- Preferentially including near-misses is mandatory
- Missing near-misses invalidates dataset

### Ambiguity
- Ambiguity is preferentially included
- Ambiguous cases are prioritized
- Preferentially including ambiguity is mandatory
- Missing ambiguity invalidates dataset

### Non-Action Cases

- Non-action cases are preferentially included
- Inaction scenarios are prioritized
- Preferentially including non-action cases is mandatory
- Missing non-action cases invalidates dataset

### Success-Heavy Datasets Are Rejected

- Success-heavy datasets are rejected
- Edge cases are mandatory
- Rejecting success-heavy datasets is mandatory
- Success-heavy datasets are prohibited

---

## 6. Separation from Training

Synthetic data generation does not imply:

### Model Improvement
- Synthetic data generation does not imply model improvement
- Improvement claims require separate evaluation
- Avoiding improvement implications is mandatory
- Implying model improvement is prohibited

### Performance Gain
- Synthetic data generation does not imply performance gain
- Performance claims require separate evaluation
- Avoiding performance gain implications is mandatory
- Implying performance gain is prohibited

### Generalization Claims

- Synthetic data generation does not imply generalization claims
- Generalization claims require separate evaluation
- Avoiding generalization implications is mandatory
- Implying generalization is prohibited

### Training Impact Must Be Evaluated Separately

- Training impact must be evaluated separately
- Impact evaluation is independent
- Requiring separate evaluation is mandatory
- Assuming training impact is prohibited

---

## 7. Validation

Each dataset must include:

### Internal Consistency Checks
- Internal consistency checks are included
- Consistency is verified
- Including internal consistency checks is mandatory
- Missing consistency checks invalidates dataset

### Assumption Stress Tests
- Assumption stress tests are included
- Assumptions are tested under stress
- Including assumption stress tests is mandatory
- Missing assumption stress tests invalidates dataset

### Known Limitations

- Known limitations are included
- Dataset limits are explicit
- Including known limitations is mandatory
- Missing known limitations invalidates dataset

### Unvalidated Data Is Quarantined

- Unvalidated data is quarantined
- Validation is required before use
- Quarantining unvalidated data is mandatory
- Using unvalidated data is prohibited

---

## 8. Cost Efficiency

Bulk generation must:

### Prefer Local Models
- Prefer local models for bulk generation
- Local models are default choice
- Preferring local models is mandatory
- Using remote models unnecessarily is prohibited

### Minimize Compute Spend
- Minimize compute spend
- Cost efficiency is required
- Minimizing compute spend is mandatory
- Excessive compute spend is prohibited

### Justify Any Frontier-Model Usage

- Justify any frontier-model usage
- Frontier models require justification
- Requiring justification for frontier models is mandatory
- Using frontier models without justification is prohibited

### Cost Without Value Is Waste

- Cost without value is waste
- Value must justify cost
- Requiring value justification is mandatory
- Cost without value is prohibited

---

## 9. Human Control

Humans may:

### Approve Generation Intent
- Human may approve generation intent
- Intent approval is allowed
- Approving generation intent cannot be prevented
- Intent approvals must be logged

### Cap Volume
- Human may cap volume
- Volume limits are configurable
- Capping volume cannot be prevented
- Volume caps must be logged

### Reject Outputs
- Human may reject outputs
- Output rejection is allowed
- Rejecting outputs cannot be prevented
- Output rejections must be logged

### Request Regeneration with Altered Assumptions

- Human may request regeneration with altered assumptions
- Regeneration requests are allowed
- Requesting regeneration cannot be prevented
- Regeneration requests must be logged

### All Overrides Are Logged

- All overrides are logged
- Human actions are recorded
- Logging all overrides is mandatory
- Missing override logs is a violation

---

## 10. Audit Trail

Each dataset must record:

### Generation Date
- Generation date is recorded
- Creation timestamp is logged
- Recording generation date is mandatory
- Missing generation date invalidates dataset

### Model(s) Used
- Model(s) used are recorded
- Model identifiers are logged
- Recording model(s) used is mandatory
- Missing model record invalidates dataset

### Parameter Ranges
- Parameter ranges are recorded
- Generation parameters are logged
- Recording parameter ranges is mandatory
- Missing parameter range record invalidates dataset

### Intended Decision Context

- Intended decision context is recorded
- Decision purpose is logged
- Recording intended decision context is mandatory
- Missing decision context record invalidates dataset

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
- Generating synthetic data without authorization (unavailable/unethical/unsafe real data, underrepresented failure modes, decision requirement)
- Missing assumption declarations (source assumptions, generation rules, excluded conditions, intended use)
- Unjustified frequency mimicry or missing counterfactual labels
- Success-heavy datasets without edge-case priority
- Implying model improvement, performance gain, or generalization without separate evaluation
- Missing validation (consistency checks, assumption stress tests, known limitations)
- Using frontier models for bulk generation without justification
- Missing or incomplete audit trails (generation date, models used, parameter ranges, decision context)
- Missing override logging

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to synthetic data definitions, authorization criteria, assumption declaration, or distribution discipline require:
- Impact assessment on synthetic data authoring and integrity
- Testing with representative generation scenarios
- Approval from system owner
- Version increment
- Documentation in change logs

---
