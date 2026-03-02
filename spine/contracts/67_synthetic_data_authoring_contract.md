# Synthetic Data Authoring Contract

This contract defines how Omega generates synthetic data without fabrication, leakage, or false realism.

Version: 1.0  
Effective: 2024-12-13

---

## 1. Definition

Synthetic data is:

### Intentionally Generated Data
- Synthetic data is intentionally generated data
- Generation is deliberate and purposeful
- Intentional generation is mandatory
- Accidental or random generation is prohibited

### Designed to Expose Gaps, Edges, or Failures
- Synthetic data is designed to expose gaps, edges, or failures
- Gaps, edges, and failures are the focus
- Designing to expose gaps, edges, or failures is mandatory
- Missing gap/edge/failure focus invalidates data

### Grounded in Explicit Assumptions

- Synthetic data is grounded in explicit assumptions
- Assumptions are stated and documented
- Grounding in explicit assumptions is mandatory
- Ungrounded generation is prohibited

### Synthetic Data Is Not

- Synthetic data is not fake real-world data
- Synthetic data is not anonymised replicas
- Synthetic data is not volume generation for its own sake
- Synthetic data is not statistical decoration

### Fake Real-World Data
- Synthetic data is not fake real-world data
- Fake data deceives
- Avoiding fake real-world data is mandatory
- Generating fake real-world data is prohibited

### Anonymised Replicas
- Synthetic data is not anonymised replicas
- Replicas copy real data
- Avoiding anonymised replicas is mandatory
- Generating anonymised replicas is prohibited

### Volume Generation for Its Own Sake
- Synthetic data is not volume generation for its own sake
- Volume without purpose is waste
- Avoiding volume-only generation is mandatory
- Generating volume for its own sake is prohibited

### Statistical Decoration

- Synthetic data is not statistical decoration
- Decoration lacks purpose
- Avoiding statistical decoration is mandatory
- Generating statistical decoration is prohibited

---

## 2. Authoring Responsibility

Omega must define explicitly:

### Why the Data Is Needed
- Why the data is needed must be defined explicitly
- Purpose is stated and documented
- Explicit purpose definition is mandatory
- Missing purpose definition invalidates data

### Which Real-World Gap It Addresses
- Which real-world gap it addresses must be defined explicitly
- Gap is stated and documented
- Explicit gap definition is mandatory
- Missing gap definition invalidates data

### Which Failure or Uncertainty It Targets
- Which failure or uncertainty it targets must be defined explicitly
- Target is stated and documented
- Explicit target definition is mandatory
- Missing target definition invalidates data

### Which Downstream Use It Supports

- Which downstream use it supports must be defined explicitly
- Use is stated and documented
- Explicit use definition is mandatory
- Missing use definition invalidates data

### Unjustified Data Generation Is Prohibited

- Unjustified data generation is prohibited
- All generation must be justified
- Prohibiting unjustified generation is mandatory
- Unjustified generation is a violation

---

## 3. Grounding Requirements

All synthetic data must be grounded in at least one of:

### Formal Rules or Constraints
- Formal rules or constraints may ground synthetic data
- Rules or constraints are stated and documented
- Grounding in formal rules or constraints is allowed
- Grounding in formal rules or constraints is permitted

### Documented Failure Modes
- Documented failure modes may ground synthetic data
- Failure modes are stated and documented
- Grounding in documented failure modes is allowed
- Grounding in documented failure modes is permitted

### Known Decision Structures
- Known decision structures may ground synthetic data
- Decision structures are stated and documented
- Grounding in known decision structures is allowed
- Grounding in known decision structures is permitted

### Explicit Counterfactuals

- Explicit counterfactuals may ground synthetic data
- Counterfactuals are stated and documented
- Grounding in explicit counterfactuals is allowed
- Grounding in explicit counterfactuals is permitted

### Ungrounded Generation Is Invalid

- Ungrounded generation is invalid
- All generation must be grounded
- Invalidating ungrounded generation is mandatory
- Ungrounded generation is prohibited

---

## 4. Distribution Discipline

Omega must:

### Declare Intended Distributions
- Declare intended distributions
- Distributions are stated and documented
- Declaring intended distributions is mandatory
- Missing distribution declaration is prohibited

### Avoid Mimicking Proprietary Datasets
- Avoid mimicking proprietary datasets
- Proprietary dataset mimicry is blocked
- Avoiding proprietary mimicry is mandatory
- Mimicking proprietary datasets is prohibited

### Avoid Over-Smoothing or Idealisation
- Avoid over-smoothing or idealisation
- Smoothing and idealisation are limited
- Avoiding over-smoothing or idealisation is mandatory
- Over-smoothing or idealisation is prohibited

### Preserve Rare and Extreme Cases

- Preserve rare and extreme cases
- Rare and extreme cases are maintained
- Preserving rare and extreme cases is mandatory
- Missing rare or extreme cases is prohibited

### Synthetic Data Must Not "Look Nicer" Than Reality

- Synthetic data must not "look nicer" than reality
- Reality's messiness is preserved
- Avoiding false niceness is mandatory
- Looking nicer than reality is prohibited

---

## 5. Uncertainty Encoding

Synthetic data must:

### Encode Uncertainty Explicitly Where Relevant
- Encode uncertainty explicitly where relevant
- Uncertainty is visible when applicable
- Encoding uncertainty explicitly is mandatory
- Missing uncertainty encoding is prohibited

### Include Ambiguity, Refusal, or Null Cases
- Include ambiguity, refusal, or null cases
- Ambiguity, refusal, and null cases are represented
- Including ambiguity, refusal, or null cases is mandatory
- Missing ambiguity, refusal, or null cases is prohibited

### Avoid Forced Completeness

- Avoid forced completeness
- Completeness is not required
- Avoiding forced completeness is mandatory
- Forced completeness is prohibited

### Missing Data Is Allowed

- Missing data is allowed
- Incomplete data is valid
- Allowing missing data is mandatory
- Requiring completeness is prohibited

### Hidden Certainty Is Not

- Hidden certainty is not allowed
- Certainty must be visible
- Prohibiting hidden certainty is mandatory
- Hidden certainty is prohibited

---

## 6. Separation from Training Claims

Synthetic data generation does not imply:

### Model Performance Improvement
- Synthetic data generation does not imply model performance improvement
- Improvement claims require separate evaluation
- Avoiding improvement implications is mandatory
- Implying model performance improvement is prohibited

### Generalisation Guarantees
- Synthetic data generation does not imply generalisation guarantees
- Generalisation claims require separate evaluation
- Avoiding generalisation implications is mandatory
- Implying generalisation guarantees is prohibited

### Real-World Validity

- Synthetic data generation does not imply real-world validity
- Validity claims require separate evaluation
- Avoiding validity implications is mandatory
- Implying real-world validity is prohibited

### Any Such Claims Require External Evaluation

- Any such claims require external evaluation
- External evaluation is mandatory for claims
- Requiring external evaluation is mandatory
- Making claims without external evaluation is prohibited

---

## 7. Ethics and Safety

Omega must not generate:

### Personal-Identifiable Replicas
- Personal-identifiable replicas must not be generated
- PII replication is prohibited
- Prohibiting personal-identifiable replicas is mandatory
- Generating personal-identifiable replicas is prohibited

### Plausible Real Individuals
- Plausible real individuals must not be generated
- Real individual replication is prohibited
- Prohibiting plausible real individuals is mandatory
- Generating plausible real individuals is prohibited

### Sensitive Scenarios Without Safeguards

- Sensitive scenarios without safeguards must not be generated
- Safeguards are required for sensitive scenarios
- Requiring safeguards is mandatory
- Generating sensitive scenarios without safeguards is prohibited

### Risky Domains Require Explicit Human Approval

- Risky domains require explicit human approval
- Human approval is mandatory for risky domains
- Requiring explicit human approval is mandatory
- Generating in risky domains without approval is prohibited

---

## 8. Audit Trail

Each dataset must record:

### Purpose
- Purpose is recorded
- Generation purpose is logged
- Recording purpose is mandatory
- Missing purpose record invalidates dataset

### Generation Method
- Generation method is recorded
- How data was created is logged
- Recording generation method is mandatory
- Missing generation method record invalidates dataset

### Assumptions
- Assumptions are recorded
- All assumptions are logged
- Recording assumptions is mandatory
- Missing assumption record invalidates dataset

### Exclusions
- Exclusions are recorded
- What is not included is logged
- Recording exclusions is mandatory
- Missing exclusion record invalidates dataset

### Intended Use

- Intended use is recorded
- How data will be used is logged
- Recording intended use is mandatory
- Missing intended use record invalidates dataset

### Known Limitations

- Known limitations are recorded
- Dataset limits are logged
- Recording known limitations is mandatory
- Missing known limitations invalidates dataset

---

## 9. Human Control

Humans may:

### Approve or Reject Datasets
- Human may approve or reject datasets
- Dataset approval or rejection is allowed
- Approving or rejecting datasets cannot be prevented
- Dataset approvals or rejections must be logged

### Constrain Generation
- Human may constrain generation
- Generation constraints are allowed
- Constraining generation cannot be prevented
- Generation constraints must be logged

### Request Regeneration
- Human may request regeneration
- Regeneration requests are allowed
- Requesting regeneration cannot be prevented
- Regeneration requests must be logged

### Halt Production

- Human may halt production
- Production stopping is allowed
- Halting production cannot be prevented
- Production halts must be logged

---

## 10. Immutability

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
- Synthetic data presented as fake real-world data, anonymised replicas, volume generation for its own sake, or statistical decoration
- Missing explicit definitions (why needed, real-world gap, failure/uncertainty target, downstream use)
- Ungrounded generation without formal rules, documented failure modes, known decision structures, or explicit counterfactuals
- Missing distribution declaration, mimicking proprietary datasets, over-smoothing/idealisation, or missing rare/extreme cases
- Missing uncertainty encoding, forced completeness, or hidden certainty
- Implying model performance improvement, generalisation guarantees, or real-world validity without external evaluation
- Generating personal-identifiable replicas, plausible real individuals, or sensitive scenarios without safeguards
- Missing or incomplete audit trails (purpose, generation method, assumptions, exclusions, intended use, known limitations)
- Missing override logging

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to synthetic data definitions, authoring responsibility, grounding requirements, or distribution discipline require:
- Impact assessment on synthetic data authoring and integrity
- Testing with representative generation scenarios
- Approval from system owner
- Version increment
- Documentation in change logs

---
