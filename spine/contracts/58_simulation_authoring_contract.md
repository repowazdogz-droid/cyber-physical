> Status: Superseded by contract 66 [66_simulation_authoring_contract.md]. Retained for audit history.

# Simulation Authoring Contract

This contract defines how Omega authors simulations and world models without prediction, deception, or overreach.

Version: 1.0  
Effective: 2024-12-13

---

## 1. Definition

A simulation is:

### An Authored Possibility Space
- A simulation is an authored possibility space
- Simulations explore what could happen
- Possibility space definition is mandatory
- Missing possibility space definition invalidates simulation

### Bounded by Assumptions
- A simulation is bounded by assumptions
- Assumptions define simulation limits
- Assumption bounding is mandatory
- Missing assumption bounds invalidates simulation

### Explicit About Uncertainty

- A simulation is explicit about uncertainty
- Unknowns are visible and stated
- Explicit uncertainty is mandatory
- Missing explicit uncertainty invalidates simulation

### A Simulation Is Not

- A simulation is not a forecast
- A simulation is not a prediction
- A simulation is not a claim about what will happen

### A Forecast
- A simulation is not a forecast
- Forecasts claim future outcomes
- Avoiding forecast claims is mandatory
- Forecast claims are prohibited

### A Prediction
- A simulation is not a prediction
- Predictions assert what will occur
- Avoiding prediction claims is mandatory
- Prediction claims are prohibited

### A Claim About What Will Happen

- A simulation is not a claim about what will happen
- Future claims are not allowed
- Avoiding future claims is mandatory
- Future claims are prohibited

---

## 2. Authoring Authority

Omega may:

### Define Variables
- Omega may define variables
- Variables are simulation components
- Defining variables is allowed
- Variable definition cannot be prevented

### Define Ranges
- Omega may define ranges
- Ranges bound variable values
- Defining ranges is allowed
- Range definition cannot be prevented

### Define Interactions
- Omega may define interactions
- Interactions connect variables
- Defining interactions is allowed
- Interaction definition cannot be prevented

### Define Failure Modes

- Omega may define failure modes
- Failure modes explore breakdowns
- Defining failure modes is allowed
- Failure mode definition cannot be prevented

### Omega May Not

- Omega may not invent causal laws
- Omega may not fill gaps with guesses
- Omega may not imply probability without evidence

### Invent Causal Laws
- Omega may not invent causal laws
- Causal laws must be evidence-based
- Prohibiting invented causal laws is mandatory
- Inventing causal laws is prohibited

### Fill Gaps with Guesses
- Omega may not fill gaps with guesses
- Gaps must remain explicit
- Prohibiting gap-filling guesses is mandatory
- Filling gaps with guesses is prohibited

### Imply Probability Without Evidence

- Omega may not imply probability without evidence
- Probabilities require justification
- Prohibiting ungrounded probability is mandatory
- Implying probability without evidence is prohibited

---

## 3. Assumption Declaration

Every simulation must declare:

### Included Variables
- Included variables are declared
- What is modeled is explicit
- Declaring included variables is mandatory
- Missing included variable declaration invalidates simulation

### Excluded Variables
- Excluded variables are declared
- What is not modeled is explicit
- Declaring excluded variables is mandatory
- Missing excluded variable declaration invalidates simulation

### Assumed Invariants
- Assumed invariants are declared
- What is held constant is explicit
- Declaring assumed invariants is mandatory
- Missing assumed invariant declaration invalidates simulation

### Known Unknowns

- Known unknowns are declared
- What is uncertain is explicit
- Declaring known unknowns is mandatory
- Missing known unknown declaration invalidates simulation

### Undeclared Assumptions Invalidate the Simulation

- Undeclared assumptions invalidate the simulation
- All assumptions must be explicit
- Invalidating on undeclared assumptions is mandatory
- Simulations with undeclared assumptions are prohibited

---

## 4. Boundary Discipline

Simulations must:

### Stop at Defined Scope Edges
- Simulations stop at defined scope edges
- Boundaries are respected
- Stopping at scope edges is mandatory
- Exceeding scope edges is prohibited

### Refuse Extrapolation Beyond Bounds
- Simulations refuse extrapolation beyond bounds
- Extrapolation is not allowed
- Refusing extrapolation is mandatory
- Extrapolating beyond bounds is prohibited

### Surface When Outputs Depend on Boundary Effects

- Simulations surface when outputs depend on boundary effects
- Boundary dependencies are visible
- Surfacing boundary effects is mandatory
- Hiding boundary effects is prohibited

---

## 5. Uncertainty Handling

Simulations must:

### Preserve Uncertainty Explicitly
- Simulations preserve uncertainty explicitly
- Uncertainty is maintained and visible
- Preserving explicit uncertainty is mandatory
- Collapsing uncertainty is prohibited

### Avoid Collapsing Ranges Prematurely
- Simulations avoid collapsing ranges prematurely
- Ranges remain until justified
- Avoiding premature collapse is mandatory
- Premature range collapse is prohibited

### Expose Sensitivity to Assumptions

- Simulations expose sensitivity to assumptions
- Assumption impact is visible
- Exposing sensitivity is mandatory
- Hiding sensitivity is prohibited

### No False Precision

- No false precision
- Precision claims require justification
- Avoiding false precision is mandatory
- False precision is prohibited

---

## 6. Failure Exploration

Each simulation must include:

### Expected Failures
- Expected failures are included
- Known failure modes are explored
- Including expected failures is mandatory
- Missing expected failures invalidates simulation

### Unexpected Failures
- Unexpected failures are included
- Surprise failures are explored
- Including unexpected failures is mandatory
- Missing unexpected failures invalidates simulation

### Near-Miss Conditions
- Near-miss conditions are included
- Close-call scenarios are explored
- Including near-miss conditions is mandatory
- Missing near-miss conditions invalidates simulation

### Non-Action Outcomes

- Non-action outcomes are included
- Inaction scenarios are explored
- Including non-action outcomes is mandatory
- Missing non-action outcomes invalidates simulation

### Success-Only Simulations Are Rejected

- Success-only simulations are rejected
- Failure exploration is mandatory
- Rejecting success-only simulations is mandatory
- Success-only simulations are prohibited

---

## 7. Human Interaction

Humans may:

### Modify Assumptions
- Human may modify assumptions
- Assumption changes are allowed
- Modifying assumptions cannot be prevented
- Assumption modifications must be tracked

### Adjust Ranges
- Human may adjust ranges
- Range changes are allowed
- Adjusting ranges cannot be prevented
- Range adjustments must be tracked

### Introduce Counterfactuals

- Human may introduce counterfactuals
- Counterfactual scenarios are allowed
- Introducing counterfactuals cannot be prevented
- Counterfactual introductions must be tracked

### All Changes Must Be Tracked

- All changes must be tracked
- Modification history is maintained
- Tracking all changes is mandatory
- Untracked changes are prohibited

---

## 8. Separation from Control

Simulation outputs:

### May Inform Decisions
- Simulation outputs may inform decisions
- Simulations provide input to judgment
- Informing decisions is allowed
- Informing decisions cannot be prevented

### May Not Trigger Action
- Simulation outputs may not trigger action
- Simulations do not cause actions
- Prohibiting action triggers is mandatory
- Triggering action is prohibited

### May Not Control Systems Directly

- Simulation outputs may not control systems directly
- Simulations do not control execution
- Prohibiting direct control is mandatory
- Controlling systems directly is prohibited

### No Closed-Loop Autonomy

- No closed-loop autonomy
- Simulations are not connected to control loops
- Prohibiting closed-loop autonomy is mandatory
- Closed-loop autonomy is prohibited

---

## 9. Reproducibility

Every simulation must record:

### Version
- Version is recorded
- Simulation version is logged
- Recording version is mandatory
- Missing version record invalidates simulation

### Assumptions
- Assumptions are recorded
- All assumptions are logged
- Recording assumptions is mandatory
- Missing assumption record invalidates simulation

### Parameters
- Parameters are recorded
- All parameters are logged
- Recording parameters is mandatory
- Missing parameter record invalidates simulation

### Random Seeds (If Any)

- Random seeds are recorded if applicable
- Seeds enable reproducibility
- Recording random seeds is mandatory when applicable
- Missing random seed record invalidates simulation

### Replays Must Be Possible

- Replays must be possible
- Simulations must be reproducible
- Enabling replays is mandatory
- Non-reproducible simulations are prohibited

---

## 10. Immutability

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
- Simulations presented as forecasts, predictions, or future claims
- Invented causal laws, gap-filling guesses, or ungrounded probability
- Missing assumption declarations (included/excluded variables, invariants, known unknowns)
- Exceeding scope boundaries or extrapolating beyond bounds
- Collapsing uncertainty or false precision
- Success-only simulations without failure exploration
- Untracked human modifications
- Simulation outputs triggering action or controlling systems directly
- Non-reproducible simulations or missing version/parameter records

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to simulation definitions, authoring authority, assumption declaration, or boundary discipline require:
- Impact assessment on simulation authoring and integrity
- Testing with representative simulation scenarios
- Approval from system owner
- Version increment
- Documentation in change logs

---
