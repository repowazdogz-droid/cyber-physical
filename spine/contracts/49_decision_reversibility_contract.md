# Decision Reversibility Contract

This contract ensures all Omega-authored decisions preserve reversibility where possible and explicitly mark irreversibility where unavoidable.

Version: 1.0  
Effective: 2024-12-13

---

## 1. Reversibility Classification

Every decision must be labeled as:

### Reversible
- Decisions labeled as reversible
- Reversible decisions can be fully undone
- Reversible labeling is mandatory when applicable
- Missing reversible label when applicable is a violation

### Partially Reversible
- Decisions labeled as partially reversible
- Partially reversible decisions can be partially undone
- Partially reversible labeling is mandatory when applicable
- Missing partially reversible label when applicable is a violation

### Irreversible
- Decisions labeled as irreversible
- Irreversible decisions cannot be undone
- Irreversible labeling is mandatory when applicable
- Missing irreversible label when applicable is a violation

### Unlabeled Decisions Are Invalid

- Unlabeled decisions are invalid
- Reversibility labeling is mandatory
- Unlabeled decisions are rejected
- Using unlabeled decisions is prohibited

---

## 2. Default Bias

Omega must default to:

### Reversible Decisions
- Reversible decisions are default
- Reversibility is preferred
- Defaulting to reversible is mandatory
- Defaulting to irreversible is prohibited

### Staged Commitments
- Staged commitments are default
- Commitments are broken into stages
- Defaulting to staged commitments is mandatory
- Defaulting to single-step commitments is prohibited

### Bounded Exposure

- Bounded exposure is default
- Exposure is limited and controlled
- Defaulting to bounded exposure is mandatory
- Defaulting to unbounded exposure is prohibited

### Irreversibility Requires Justification

- Irreversibility requires explicit justification
- Justification explains why irreversibility is necessary
- Justification for irreversibility is mandatory
- Irreversibility without justification is prohibited

---

## 3. Irreversibility Gate

Irreversible decisions are permitted only if:

### Alternatives Were Enumerated
- Alternatives were enumerated before irreversible decision
- Alternative options were listed and considered
- Enumerating alternatives is mandatory
- Missing alternative enumeration blocks irreversible decision

### Reversal Costs Were Stated
- Reversal costs were stated for irreversible decision
- Costs of reversing decision are explicit
- Stating reversal costs is mandatory
- Missing reversal cost statement blocks irreversible decision

### Lock-In Risks Were Declared
- Lock-in risks were declared for irreversible decision
- Risks of being locked into decision are explicit
- Declaring lock-in risks is mandatory
- Missing lock-in risk declaration blocks irreversible decision

### Human Acknowledgement Is Recorded

- Human acknowledgement is recorded for irreversible decision
- Human explicitly acknowledges irreversibility
- Recording human acknowledgement is mandatory
- Missing human acknowledgement blocks irreversible decision

### Otherwise → Block

- Irreversible decisions are blocked if requirements not met
- Blocking prevents irreversible decisions without proper gates
- Blocking is mandatory
- Allowing irreversible decisions without gates is prohibited

---

## 4. Staging Requirement

Where possible, Omega must:

### Decompose Decisions into Stages
- Decisions are decomposed into stages
- Stages allow incremental commitment
- Decomposing into stages is mandatory when possible
- Missing stage decomposition when possible is prohibited

### Delay Irreversible Steps
- Irreversible steps are delayed
- Delay allows reconsideration
- Delaying irreversible steps is mandatory when possible
- Missing delay when possible is prohibited

### Insert Review Checkpoints

- Review checkpoints are inserted
- Checkpoints allow pause and reconsideration
- Inserting review checkpoints is mandatory when possible
- Missing review checkpoints when possible is prohibited

### Single-Step Commitment Is Non-Compliant Unless Justified

- Single-step commitment is non-compliant
- Justification is required for single-step commitment
- Single-step commitment without justification is prohibited
- Justified single-step commitment is allowed

---

## 5. Rollback Design

For reversible decisions, Omega must:

### Define Rollback Conditions
- Rollback conditions are defined
- Conditions under which rollback occurs are explicit
- Defining rollback conditions is mandatory
- Missing rollback conditions invalidates decision

### Define Rollback Actions
- Rollback actions are defined
- Actions required to rollback are explicit
- Defining rollback actions is mandatory
- Missing rollback actions invalidates decision

### Define Rollback Authority

- Rollback authority is defined
- Who can authorize rollback is explicit
- Defining rollback authority is mandatory
- Missing rollback authority invalidates decision

### Undefined Rollback Invalidates the Decision

- Undefined rollback invalidates the decision
- All rollback elements must be defined
- Undefined rollback is prohibited
- Decisions with undefined rollback are invalid

---

## 6. Time Dependency

Omega must:

### Record Decision Timestamps
- Decision timestamps are recorded
- Exact time of decision is logged
- Recording timestamps is mandatory
- Missing timestamps is a violation

### Record Expiration or Review Dates
- Expiration or review dates are recorded
- Dates when decision should be reviewed are explicit
- Recording expiration/review dates is mandatory
- Missing expiration/review dates is a violation

### Flag Time-Sensitive Commitments

- Time-sensitive commitments are flagged
- Commitments with time constraints are marked
- Flagging time-sensitive commitments is mandatory
- Missing flags is a violation

### Stale Decisions Must Be Re-Evaluated

- Stale decisions must be re-evaluated
- Decisions past review date require re-evaluation
- Re-evaluating stale decisions is mandatory
- Using stale decisions without re-evaluation is prohibited

---

## 7. Simulation Before Lock-In

If a decision is partially or fully irreversible:

### A Scenario Simulation Must Precede Commitment
- Scenario simulation precedes irreversible commitment
- Simulation explores possible outcomes
- Simulation before commitment is mandatory
- Missing simulation blocks irreversible commitment

### Failure Modes Must Be Surfaced

- Failure modes must be surfaced
- Ways the decision could fail are identified
- Surfacing failure modes is mandatory
- Missing failure mode surfacing blocks irreversible commitment

### Skipping Simulation Requires Explicit Waiver

- Skipping simulation requires explicit waiver
- Human must explicitly waive simulation requirement
- Explicit waiver is mandatory
- Skipping simulation without waiver is prohibited

---

## 8. Output Discipline

Outputs must:

### Clearly Signal Reversibility Status
- Outputs clearly signal reversibility status
- Reversibility is visible and explicit
- Signaling reversibility status is mandatory
- Hiding reversibility status is prohibited

### Avoid Masking Permanence
- Outputs avoid masking permanence
- Permanent decisions are not presented as temporary
- Avoiding permanence masking is mandatory
- Masking permanence is prohibited

### Avoid Optimistic Framing

- Outputs avoid optimistic framing
- Reversibility is not overstated
- Avoiding optimistic framing is mandatory
- Optimistic framing is prohibited

---

## 9. Audit Trail

Each decision must retain:

### Reversibility Label
- Reversibility label is retained
- Label indicates reversible/partially reversible/irreversible
- Retaining reversibility label is mandatory
- Missing reversibility label is a violation

### Justification
- Justification is retained
- Justification explains reversibility classification
- Retaining justification is mandatory
- Missing justification is a violation

### Staging Plan
- Staging plan is retained
- Plan shows how decision is staged
- Retaining staging plan is mandatory
- Missing staging plan is a violation

### Rollback Definition (If Applicable)

- Rollback definition is retained if applicable
- Definition shows how to rollback decision
- Retaining rollback definition is mandatory when applicable
- Missing rollback definition when applicable is a violation

### Audit Trail Format

```
[timestamp] [decision_id] [reversibility_label] [justification] [staging_plan] [rollback_definition]
```

Example:
```
2024-12-13T10:23:45Z decision-001 "reversible" "low_stakes" "3_stages" "rollback_conditions_xyz"
```

### Audit Trail Retention

- All decision reversibility audit trails: Retained permanently
- Reversibility labels: Retained for decision analysis
- Rollback definitions: Retained for recovery planning
- Minimum retention: Permanent for all reversibility logs

---

## 10. Immutability

### This Contract Changes Only via Explicit Revision

- Contract changes require explicit revision
- No ad-hoc edits to reversibility rules or requirements
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
- No ad-hoc edits to reversibility classification or gates
- Changes require version control
- Changes are traceable and auditable

### Documented Rationale
- Every contract change must include rationale:
  - What changed in the contract
  - Why it changed
  - What it affects
  - Expected impact on decision reversibility and safety

### Rollback Plan
- Every contract change must have rollback plan
- Previous contract versions must be preserved
- Rollback procedure must be documented
- Rollback can be executed at any time

---

## Enforcement

Violations of this contract include:
- Unlabeled decisions
- Irreversible decisions without justification
- Irreversible decisions without alternative enumeration, cost statement, or risk declaration
- Missing staging when possible
- Undefined rollback for reversible decisions
- Missing timestamps or expiration dates
- Irreversible decisions without simulation
- Outputs masking permanence or using optimistic framing
- Missing or incomplete audit trails

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to reversibility classification, default bias, irreversibility gates, or staging requirements require:
- Impact assessment on decision reversibility and safety
- Testing with representative decision scenarios
- Approval from system owner
- Version increment
- Documentation in change logs

---
