# Local Compute & Bulk Generation Contract

This contract ensures bulk production is cost-efficient, reproducible, and defaults to local models without degrading quality or safety.

Version: 1.0  
Effective: 2024-12-13

---

## 1. Default Rule

### Bulk Generation Defaults to LOCAL Models

- All bulk generation tasks default to local models
- Local-first is mandatory for bulk operations
- Local models are the default choice
- Remote models are exceptions, not defaults

### Remote Frontier Models Are Reserved For

#### High-Stakes Reasoning
- Complex reasoning that affects safety or outcomes
- Strategic decisions with significant impact
- High-stakes reasoning justifies frontier model use
- Frontier models are reserved for high-stakes work

#### Architecture
- System architecture design and planning
- Structural decisions with long-term impact
- Architecture work justifies frontier model use
- Frontier models are reserved for architecture work

#### Safety/Verification
- Safety-critical verification and validation
- Risk assessment and failure mode analysis
- Safety/verification work justifies frontier model use
- Frontier models are reserved for safety work

#### Small "Gold Set" Exemplars
- Small, high-quality reference examples
- Exemplars that define quality standards
- Gold set creation justifies frontier model use
- Frontier models are reserved for gold set creation

### No Frontier Models for Bulk Production

- Frontier models are not used for bulk generation
- Bulk production uses local models exclusively
- Frontier models are exceptions, not bulk tools
- Using frontier models for bulk is prohibited

---

## 2. What Counts as Bulk

Bulk includes:

### Dataset Expansion
- Expanding existing datasets with new examples
- Adding variants or augmentations to datasets
- Dataset expansion is bulk work
- Dataset expansion defaults to local models

### Variant Generation
- Generating multiple variations of content
- Creating alternative versions or formats
- Variant generation is bulk work
- Variant generation defaults to local models

### Formatting / Restructuring
- Reformating large volumes of content
- Restructuring data or documents at scale
- Formatting/restructuring is bulk work
- Formatting/restructuring defaults to local models

### Repeated Transforms
- Applying same transformation to many items
- Batch processing and repetitive operations
- Repeated transforms are bulk work
- Repeated transforms default to local models

### Templated Content
- Content generated from templates
- Template-based generation at scale
- Templated content is bulk work
- Templated content defaults to local models

### Large-Scale Tagging/Labeling
- Tagging or labeling many items
- Classification or annotation at scale
- Large-scale tagging/labeling is bulk work
- Large-scale tagging/labeling defaults to local models

### Synthetic Examples > 50 Items
- Generating more than 50 synthetic examples
- Large-scale synthetic data generation
- Synthetic examples > 50 items are bulk work
- Synthetic examples > 50 items default to local models

---

## 3. Two-Tier Production

All bulk pipelines must use:

### A) Gold Set (Small, High-Quality)

#### Produced/Verified with Frontier Models Where Needed
- Gold set uses frontier models when quality requires it
- Frontier models are used for gold set creation
- Gold set quality justifies frontier model use
- Gold set is produced with appropriate model tier

#### Becomes the Reference Standard
- Gold set defines quality standards
- Gold set is the reference for bulk production
- Bulk production must match gold set quality
- Gold set is the quality benchmark

### B) Bulk Set (Large)

#### Produced Locally to Match Gold Style/Spec
- Bulk set is produced using local models
- Bulk set must match gold set style and specification
- Local models produce bulk set to gold standard
- Bulk set quality matches gold set quality

### Two-Tier Production Is Mandatory

- All bulk pipelines must use two-tier production
- Gold set and bulk set are both required
- Two-tier production is non-negotiable
- Single-tier bulk production is prohibited

---

## 4. Quality Gates (Mandatory)

Before any bulk output is accepted:

### Schema Validation (If Structured)
- Structured outputs must pass schema validation
- Schema validation is mandatory for structured data
- Invalid schema results in rejection
- Schema validation is a quality gate

### Lint/Format Validation (If Code)
- Code outputs must pass lint/format validation
- Lint/format validation is mandatory for code
- Invalid format results in rejection
- Lint/format validation is a quality gate

### Sampling Inspection (Human or Verifier Agent)
- Bulk outputs must pass sampling inspection
- Sampling inspection is mandatory
- Inspection may be human or automated verifier
- Sampling inspection is a quality gate

### Rejection of Malformed Items
- Malformed items must be rejected
- Rejection is mandatory for malformed items
- Malformed items are not accepted
- Rejection of malformed items is a quality gate

### No "Ship Raw Generations"

- Raw generations are not shipped
- All outputs must pass quality gates
- Shipping raw generations is prohibited
- Quality gates are mandatory, not optional

---

## 5. Cost Classes

Every run must declare cost class:

### LOW (Local Only)
- Local models only
- No frontier model usage
- Lowest cost tier
- Default cost class

### MED (Local + Small Frontier Assist)
- Local models with small frontier assistance
- Limited frontier model usage
- Medium cost tier
- Requires justification

### HIGH (Frontier-Heavy, Rare)
- Heavy frontier model usage
- Frontier models for bulk production
- Highest cost tier
- Requires explicit authorization

### Default Is LOW

- Default cost class is LOW
- LOW is the standard cost class
- Higher cost classes require justification
- Defaulting to LOW is mandatory

---

## 6. Determinism & Reproducibility

Bulk runs must store:

### Prompt/Spec Version
- Exact prompt or specification version used
- Version control for prompts and specs
- Prompt/spec version is mandatory
- Version tracking enables reproducibility

### Seed If Applicable
- Random seed used for generation
- Seed enables exact reproduction
- Seed is mandatory when applicable
- Seed tracking enables reproducibility

### Model/Version Identifiers
- Specific model and version used
- Model identifiers are mandatory
- Version identifiers are mandatory
- Model/version tracking enables reproducibility

### Date/Time
- Exact date and time of generation
- Timestamp is mandatory
- Date/time tracking enables reproducibility
- Timestamp is part of audit trail

### Output Count
- Number of items generated
- Output count is mandatory
- Count tracking enables reproducibility
- Count is part of audit trail

### Reproducibility Is Mandatory

- Bulk runs must be reproducible
- All required metadata must be stored
- Reproducibility is non-negotiable
- Non-reproducible runs are violations

---

## 7. Safety/Constraints Preservation

Local bulk generation must preserve:

### Stop-on-Uncertainty Behaviors
- Uncertainty handling must be preserved
- Stop-on-uncertainty rules apply to bulk generation
- Safety behaviors are not relaxed for bulk
- Stop-on-uncertainty is mandatory

### Conservative Defaults
- Conservative defaults must be preserved
- Bulk generation does not relax defaults
- Safety defaults are maintained
- Conservative defaults are mandatory

### Refusal/Abstain Patterns Where Required
- Refusal patterns must be preserved
- Abstain patterns must be preserved
- Safety patterns are not bypassed for bulk
- Refusal/abstain patterns are mandatory

### No "Creative Drift" in Safety-Critical Domains

- Safety-critical domains require strict adherence
- Creative drift is prohibited in safety-critical work
- Safety constraints are not relaxed
- Creative drift in safety-critical domains is prohibited

---

## 8. Escalation Rule

If local output quality falls below gold set:

### Escalate to Frontier for Diagnosis Only
- Use frontier models to diagnose quality issues
- Diagnosis is the purpose of escalation
- Escalation is for diagnosis, not production
- Diagnosis-only escalation is allowed

### Update Spec/Prompt
- Update specification or prompt based on diagnosis
- Spec/prompt updates improve local model performance
- Updates are based on frontier model diagnosis
- Spec/prompt updates are mandatory after diagnosis

### Return to Local for Bulk
- Return to local models for bulk production
- Do not continue using frontier models for bulk
- Local models produce bulk after spec/prompt update
- Returning to local is mandatory

### Do Not Keep Running Frontier for Bulk

- Frontier models are not used for ongoing bulk production
- Escalation is temporary, not permanent
- Bulk production returns to local models
- Using frontier models for ongoing bulk is prohibited

---

## 9. Audit Trail

Each bulk dataset batch must record:

### What It Is
- Description of the dataset batch
- Content type and purpose
- Dataset identification
- What it is is mandatory

### Why It Exists
- Purpose and justification for the dataset
- Use case and intended application
- Rationale for generation
- Why it exists is mandatory

### Where It Is Stored
- Storage location and path
- Access method and permissions
- Storage details
- Where it is stored is mandatory

### How It Was Generated
- Generation method and process
- Models and tools used
- Generation parameters
- How it was generated is mandatory

### What Gates Passed
- Quality gates that were passed
- Validation results
- Inspection outcomes
- What gates passed is mandatory

### Audit Trail Format

```
[timestamp] [batch_id] [what] [why] [where] [how] [gates_passed]
```

Example:
```
2024-12-13T10:23:45Z batch-001 "synthetic_training_data" "model_training" "/data/batch-001" "local_model_v2.1" "schema+sampling+lint"
```

### Audit Trail Retention

- All bulk generation audit trails: Retained permanently
- Dataset metadata: Retained for lifecycle of dataset
- Quality gate results: Retained for 5 years minimum
- Minimum retention: 2 years for all audit trails

---

## Change Control

This contract changes only via explicit revision:

### Explicit Revision
- Contract changes must be explicit and documented
- No ad-hoc edits to bulk generation rules
- Changes require version control
- Changes are traceable and auditable

### Documented Rationale
- Every contract change must include rationale:
  - What changed in the contract
  - Why it changed
  - What it affects
  - Expected impact on cost, quality, and safety

### Rollback Plan
- Every contract change must have rollback plan
- Previous contract versions must be preserved
- Rollback procedure must be documented
- Rollback can be executed at any time

---

## Enforcement

Violations of this contract include:
- Using frontier models for bulk production without justification
- Skipping quality gates
- Shipping raw generations
- Missing reproducibility metadata
- Relaxing safety constraints for bulk
- Using frontier models for ongoing bulk production
- Missing or incomplete audit trails

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to default rules, bulk definitions, two-tier production, quality gates, or escalation rules require:
- Impact assessment on cost, quality, and safety
- Testing with representative bulk tasks
- Approval from system owner
- Version increment
- Documentation in change logs

---