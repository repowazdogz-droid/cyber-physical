# Model Routing & Cost Discipline Contract

This contract ensures Omega routes work across local and external models for maximum quality, minimum cost, and controlled risk.

Version: 1.0  
Effective: 2024-12-13

---

## 1. Routing Authority

Omega decides:

### Which Model Is Used
- Omega decides which model is used
- Model selection is Omega's responsibility
- Omega model selection is mandatory
- Omega model selection cannot be prevented

### When Escalation Is Allowed
- Omega decides when escalation is allowed
- Escalation conditions are determined by Omega
- Omega escalation decisions are mandatory
- Omega escalation decisions cannot be prevented

### When Local Models Are Mandatory
- Omega decides when local models are mandatory
- Local model requirements are determined by Omega
- Omega local model decisions are mandatory
- Omega local model decisions cannot be prevented

### When External APIs Are Justified

- Omega decides when external APIs are justified
- External API justification is determined by Omega
- Omega external API decisions are mandatory
- Omega external API decisions cannot be prevented

### Humans May Override Explicitly

- Humans may override explicitly
- Human overrides are allowed
- Explicit human overrides cannot be prevented
- Human overrides must be logged

---

## 2. Default Routing Rule

By default:

### Bulk Generation → Local Models
- Bulk generation routes to local models by default
- Local models are default for bulk work
- Routing bulk generation to local models is mandatory
- Using external models for bulk generation by default is prohibited

### Exploratory Drafts → Local Models
- Exploratory drafts route to local models by default
- Local models are default for exploratory work
- Routing exploratory drafts to local models is mandatory
- Using external models for exploratory drafts by default is prohibited

### Refinement → Local or Mid-Tier Models
- Refinement routes to local or mid-tier models by default
- Local or mid-tier models are default for refinement
- Routing refinement to local or mid-tier models is mandatory
- Using premium models for refinement by default is prohibited

### High-Stakes Logic → Premium Models (Explicit)

- High-stakes logic routes to premium models explicitly
- Premium models require explicit justification
- Explicit premium model routing is mandatory
- Default premium model routing is prohibited

### No Default Use of Premium Models

- No default use of premium models
- Premium models require explicit justification
- Prohibiting default premium model use is mandatory
- Default premium model use is prohibited

---

## 3. Cost Discipline

Each task must declare:

### Cost Ceiling
- Cost ceiling is declared for each task
- Maximum cost is specified
- Declaring cost ceiling is mandatory
- Missing cost ceiling declaration is a violation

### Acceptable Latency
- Acceptable latency is declared for each task
- Maximum latency is specified
- Declaring acceptable latency is mandatory
- Missing acceptable latency declaration is a violation

### Quality Threshold

- Quality threshold is declared for each task
- Minimum quality is specified
- Declaring quality threshold is mandatory
- Missing quality threshold declaration is a violation

### If Cost Exceeds Ceiling → Downgrade or Halt

- If cost exceeds ceiling, downgrade or halt
- Cost overruns trigger action
- Downgrading or halting on cost overrun is mandatory
- Continuing after cost overrun is prohibited

---

## 4. Local-First Requirement

Local models must be used for:

### Bulk Data Generation
- Local models must be used for bulk data generation
- Bulk generation defaults to local
- Using local models for bulk generation is mandatory
- Using external models for bulk generation requires justification

### Simulations
- Local models must be used for simulations
- Simulations default to local
- Using local models for simulations is mandatory
- Using external models for simulations requires justification

### Synthetic Datasets
- Local models must be used for synthetic datasets
- Synthetic datasets default to local
- Using local models for synthetic datasets is mandatory
- Using external models for synthetic datasets requires justification

### Large-Scale Evaluation
- Local models must be used for large-scale evaluation
- Large-scale evaluation defaults to local
- Using local models for large-scale evaluation is mandatory
- Using external models for large-scale evaluation requires justification

### Iterative Experimentation

- Local models must be used for iterative experimentation
- Iterative experimentation defaults to local
- Using local models for iterative experimentation is mandatory
- Using external models for iterative experimentation requires justification

### External Models Require Justification

- External models require justification
- Justification must be documented and logged
- Requiring justification for external models is mandatory
- Using external models without justification is prohibited

---

## 5. Escalation Gates

Escalation to premium models allowed only if:

### Task Is High-Stakes OR
- Task is high-stakes
- High-stakes tasks may escalate
- High-stakes escalation is allowed
- High-stakes escalation requires logging

### Local Models Fail Quality Checks OR
- Local models fail quality checks
- Quality failures may escalate
- Quality failure escalation is allowed
- Quality failure escalation requires logging

### Human Explicitly Requests

- Human explicitly requests escalation
- Human requests may escalate
- Human-requested escalation is allowed
- Human-requested escalation requires logging

### Escalation Reason Must Be Recorded

- Escalation reason must be recorded
- All escalations are logged
- Recording escalation reason is mandatory
- Missing escalation reason logs is a violation

---

## 6. Model Capability Registry

Omega must maintain:

### Known Strengths
- Known strengths are maintained
- Model capabilities are documented
- Maintaining known strengths is mandatory
- Missing known strengths registry is a violation

### Known Weaknesses
- Known weaknesses are maintained
- Model limitations are documented
- Maintaining known weaknesses is mandatory
- Missing known weaknesses registry is a violation

### Failure Patterns
- Failure patterns are maintained
- Model failure modes are documented
- Maintaining failure patterns is mandatory
- Missing failure patterns registry is a violation

### Cost Profiles

- Cost profiles are maintained
- Model costs are documented
- Maintaining cost profiles is mandatory
- Missing cost profiles registry is a violation

### Routing Must Respect This Registry

- Routing must respect this registry
- Model selection uses registry data
- Respecting registry in routing is mandatory
- Routing without registry respect is prohibited

---

## 7. Vendor Independence

No workflow may depend on:

### A Single Vendor
- No workflow depends on a single vendor
- Multiple vendor options must exist
- Avoiding single-vendor dependency is mandatory
- Single-vendor dependency is prohibited

### Proprietary-Only Formats
- No workflow depends on proprietary-only formats
- Open or replaceable formats are required
- Avoiding proprietary-only formats is mandatory
- Proprietary-only format dependency is prohibited

### Non-Replaceable APIs

- No workflow depends on non-replaceable APIs
- Replaceable APIs are required
- Avoiding non-replaceable APIs is mandatory
- Non-replaceable API dependency is prohibited

### Swapability Is Mandatory

- Swapability is mandatory
- All components must be replaceable
- Requiring swapability is mandatory
- Non-swappable components are prohibited

---

## 8. Output Consistency

Routing changes must not:

### Alter Intent
- Routing changes do not alter intent
- Task intent remains unchanged
- Preserving intent is mandatory
- Altering intent is prohibited

### Hide Uncertainty
- Routing changes do not hide uncertainty
- Uncertainty remains visible
- Preserving uncertainty visibility is mandatory
- Hiding uncertainty is prohibited

### Remove Safety Constraints

- Routing changes do not remove safety constraints
- Safety constraints remain enforced
- Preserving safety constraints is mandatory
- Removing safety constraints is prohibited

### Quality Variance Must Be Surfaced

- Quality variance must be surfaced
- Differences in output quality are visible
- Surfacing quality variance is mandatory
- Hiding quality variance is prohibited

---

## 9. Auditability

Every routed task must record:

### Model Used
- Model used is recorded
- Model identifier is logged
- Recording model used is mandatory
- Missing model record is a violation

### Reason for Selection
- Reason for selection is recorded
- Selection rationale is logged
- Recording reason for selection is mandatory
- Missing selection reason is a violation

### Cost Incurred
- Cost incurred is recorded
- Actual cost is logged
- Recording cost incurred is mandatory
- Missing cost record is a violation

### Fallback Attempts

- Fallback attempts are recorded
- Alternative models tried are logged
- Recording fallback attempts is mandatory
- Missing fallback attempt records is a violation

---

## 10. Immutability

### This Contract Changes Only via Explicit Revision

- Contract changes require explicit revision
- No ad-hoc edits to model routing or cost discipline rules
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
- No ad-hoc edits to routing rules or cost discipline
- Changes require version control
- Changes are traceable and auditable

### Documented Rationale
- Every contract change must include rationale:
  - What changed in the contract
  - Why it changed
  - What it affects
  - Expected impact on model routing and cost efficiency

### Rollback Plan
- Every contract change must have rollback plan
- Previous contract versions must be preserved
- Rollback procedure must be documented
- Rollback can be executed at any time

---

## Enforcement

Violations of this contract include:
- Default use of premium models without justification
- Missing cost ceiling, latency, or quality threshold declarations
- Using external models for local-first tasks without justification
- Escalation without recorded reason
- Missing or incomplete model capability registry
- Single-vendor dependency or non-swappable components
- Routing changes that alter intent, hide uncertainty, or remove safety constraints
- Missing or incomplete routing audit trails

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to routing authority, default routing rules, cost discipline, or escalation gates require:
- Impact assessment on model routing and cost efficiency
- Testing with representative routing scenarios
- Approval from system owner
- Version increment
- Documentation in change logs

---
