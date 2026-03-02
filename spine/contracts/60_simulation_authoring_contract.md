> Status: Superseded by contract 66 [66_simulation_authoring_contract.md]. Retained for audit history.

# Simulation Authoring Contract

This contract defines how Omega authors simulations and world models without prediction, overfitting, or false realism.

Version: 1.0  
Effective: 2024-12-13

---

## 1. Definition

A simulation is:

### An Exploration of Possibility Space
- A simulation is an exploration of possibility space
- Simulations explore what could happen
- Exploring possibility space is mandatory
- Missing possibility space exploration invalidates simulation

### Bounded by Explicit Assumptions
- A simulation is bounded by explicit assumptions
- Assumptions define simulation limits
- Explicit assumption bounding is mandatory
- Missing explicit assumption bounds invalidates simulation

### Designed to Surface Failure, Not Forecast Outcomes

- A simulation is designed to surface failure, not forecast outcomes
- Failure exploration is primary purpose
- Surfacing failure is mandatory
- Forecasting outcomes is prohibited

### A Simulation Is Not

- A simulation is not a prediction engine
- A simulation is not a demonstration artifact
- A simulation is not a realism contest

### A Prediction Engine
- A simulation is not a prediction engine
- Predictions claim future outcomes
- Avoiding prediction engine framing is mandatory
- Prediction engine framing is prohibited

### A Demonstration Artifact
- A simulation is not a demonstration artifact
- Demonstrations show desired outcomes
- Avoiding demonstration artifact framing is mandatory
- Demonstration artifact framing is prohibited

### A Realism Contest

- A simulation is not a realism contest
- Realism is not a quality measure
- Avoiding realism contest framing is mandatory
- Realism contest framing is prohibited

---

## 2. Authorization

Omega may author a simulation only when:

### A Decision Involves Uncertainty
- A decision involves uncertainty
- Uncertainty requires exploration
- Decision uncertainty justifies simulation
- Simulating without decision uncertainty is prohibited

### Real-World Testing Is Unsafe, Costly, or Irreversible
- Real-world testing is unsafe, costly, or irreversible
- Real-world testing cannot be performed
- Unsafety, cost, or irreversibility justifies simulation
- Simulating when real-world testing is feasible is prohibited

### Assumptions Need to Be Stress-Tested

- Assumptions need to be stress-tested
- Assumption validation requires testing
- Assumption stress-testing justifies simulation
- Simulating without assumption stress-testing need is prohibited

### Otherwise → Do Not Simulate

- Otherwise, do not simulate
- No simulation without justification
- Prohibiting unjustified simulation is mandatory
- Unjustified simulation is prohibited

---

## 3. Scope Boundaries

Each simulation must declare:

### What Is Included
- What is included is declared
- Included elements are explicit
- Declaring what is included is mandatory
- Missing inclusion declaration invalidates simulation

### What Is Excluded
- What is excluded is declared
- Excluded elements are explicit
- Declaring what is excluded is mandatory
- Missing exclusion declaration invalidates simulation

### What Is Intentionally Abstracted
- What is intentionally abstracted is declared
- Abstraction choices are explicit
- Declaring intentional abstraction is mandatory
- Missing abstraction declaration invalidates simulation

### What Is Held Constant

- What is held constant is declared
- Constants are explicit
- Declaring what is held constant is mandatory
- Missing constant declaration invalidates simulation

### Undefined Scope Invalidates the Simulation

- Undefined scope invalidates the simulation
- All scope boundaries must be explicit
- Invalidating on undefined scope is mandatory
- Simulations with undefined scope are prohibited

---

## 4. Variable Discipline

Omega must:

### Enumerate All Controllable Variables
- Enumerate all controllable variables
- Controllable variables are listed
- Enumerating controllable variables is mandatory
- Missing controllable variable enumeration is a violation

### Identify Hidden or Latent Variables
- Identify hidden or latent variables
- Hidden variables are surfaced
- Identifying hidden or latent variables is mandatory
- Missing hidden variable identification is a violation

### Distinguish Noise from Uncertainty

- Distinguish noise from uncertainty
- Noise and uncertainty are separate
- Distinguishing noise from uncertainty is mandatory
- Missing noise/uncertainty distinction is a violation

### Unlabeled Variables Are Prohibited

- Unlabeled variables are prohibited
- All variables must be labeled
- Prohibiting unlabeled variables is mandatory
- Unlabeled variables are violations

---

## 5. Scenario Construction

Simulations must include:

### Baseline Scenarios
- Baseline scenarios are included
- Normal conditions are explored
- Including baseline scenarios is mandatory
- Missing baseline scenarios invalidates simulation

### Adverse Scenarios
- Adverse scenarios are included
- Difficult conditions are explored
- Including adverse scenarios is mandatory
- Missing adverse scenarios invalidates simulation

### Edge-Case Scenarios
- Edge-case scenarios are included
- Extreme conditions are explored
- Including edge-case scenarios is mandatory
- Missing edge-case scenarios invalidates simulation

### Non-Action Scenarios

- Non-action scenarios are included
- Inaction conditions are explored
- Including non-action scenarios is mandatory
- Missing non-action scenarios invalidates simulation

### Single-Scenario Simulations Are Rejected

- Single-scenario simulations are rejected
- Multiple scenarios are mandatory
- Rejecting single-scenario simulations is mandatory
- Single-scenario simulations are prohibited

---

## 6. Outcome Handling

Omega must:

### Surface Ranges, Not Point Results
- Surface ranges, not point results
- Outcome ranges are visible
- Surfacing ranges is mandatory
- Point results only are prohibited

### Preserve Divergent Outcomes
- Preserve divergent outcomes
- Disagreement is maintained
- Preserving divergent outcomes is mandatory
- Collapsing divergent outcomes is prohibited

### Avoid Averaging Away Extremes

- Avoid averaging away extremes
- Extreme outcomes are preserved
- Avoiding averaging extremes is mandatory
- Averaging away extremes is prohibited

### Convergence Is Not Assumed

- Convergence is not assumed
- Outcomes may diverge
- Avoiding convergence assumption is mandatory
- Assuming convergence is prohibited

---

## 7. Human Interpretability

All simulations must:

### Be Explainable Step-by-Step
- Be explainable step-by-step
- Reasoning is traceable
- Step-by-step explainability is mandatory
- Opaque reasoning is prohibited

### Expose Causal Relationships
- Expose causal relationships
- Cause-effect links are visible
- Exposing causal relationships is mandatory
- Hiding causal relationships is prohibited

### Allow Parameter Inspection

- Allow parameter inspection
- Parameters are accessible
- Allowing parameter inspection is mandatory
- Blocking parameter inspection is prohibited

### Opaque Simulations Are Quarantined

- Opaque simulations are quarantined
- Interpretability is required
- Quarantining opaque simulations is mandatory
- Using opaque simulations is prohibited

---

## 8. Separation from Execution

### Simulation Outputs Do Not Authorize Action
- Simulation outputs do not authorize action
- Simulations inform, not command
- Prohibiting action authorization is mandatory
- Authorizing action from simulations is prohibited

### Execution Requires Separate Decision Approval

- Execution requires separate decision approval
- Action requires explicit approval
- Requiring separate approval is mandatory
- Executing without separate approval is prohibited

---

## 9. Cost and Fidelity

Simulation fidelity must:

### Be Justified by Decision Needs
- Be justified by decision needs
- Fidelity matches decision requirements
- Requiring fidelity justification is mandatory
- Unjustified fidelity is prohibited

### Avoid Unnecessary Complexity
- Avoid unnecessary complexity
- Simplicity is preferred
- Avoiding unnecessary complexity is mandatory
- Unnecessary complexity is prohibited

### Prefer Conceptual Models Over Physics When Sufficient

- Prefer conceptual models over physics when sufficient
- Simplest adequate model is preferred
- Preferring conceptual models is mandatory
- Over-engineering with physics is prohibited

### Higher Fidelity Is Not Inherently Better

- Higher fidelity is not inherently better
- Fidelity must be justified
- Avoiding fidelity bias is mandatory
- Assuming higher fidelity is better is prohibited

---

## 10. Audit Trail

Each simulation must record:

### Purpose
- Purpose is recorded
- Simulation purpose is logged
- Recording purpose is mandatory
- Missing purpose record invalidates simulation

### Assumptions
- Assumptions are recorded
- All assumptions are logged
- Recording assumptions is mandatory
- Missing assumption record invalidates simulation

### Variable Definitions
- Variable definitions are recorded
- All variables are logged
- Recording variable definitions is mandatory
- Missing variable definition record invalidates simulation

### Scenario Set

- Scenario set is recorded
- All scenarios are logged
- Recording scenario set is mandatory
- Missing scenario set record invalidates simulation

### Generation Date

- Generation date is recorded
- Creation timestamp is logged
- Recording generation date is mandatory
- Missing generation date record invalidates simulation

---

## 11. Immutability

### This Contract Changes Only via Explicit Revision

- Contract changes require explicit revision
- No ad-hoc edits to simulation authoring rules
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
- No ad-hoc edits to simulation definitions or authoring rules
- Changes require version control
- Changes are traceable and auditable

### Documented Rationale
- Every contract change must include rationale:
  - What changed in the contract
  - Why it changed
  - What it affects
  - Expected impact on simulation authoring and integrity

### Rollback Plan
- Every contract change must have rollback plan
- Previous contract versions must be preserved
- Rollback procedure must be documented
- Rollback can be executed at any time

---

## Enforcement

Violations of this contract include:
- Simulating without authorization (decision uncertainty, unsafe/costly/irreversible real-world testing, assumption stress-testing)
- Missing scope boundary declarations (included/excluded/abstracted/constant elements)
- Unlabeled variables or missing variable discipline
- Single-scenario simulations without multiple scenario types
- Point results only, collapsed divergent outcomes, or averaged extremes
- Opaque simulations without step-by-step explainability or causal relationship exposure
- Simulation outputs authorizing action without separate decision approval
- Unjustified fidelity or unnecessary complexity
- Missing or incomplete audit trails (purpose, assumptions, variable definitions, scenario set, generation date)

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to simulation definitions, authorization criteria, scope boundaries, or variable discipline require:
- Impact assessment on simulation authoring and integrity
- Testing with representative simulation scenarios
- Approval from system owner
- Version increment
- Documentation in change logs

---
