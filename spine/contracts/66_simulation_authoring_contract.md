# Simulation Authoring Contract

This contract defines how Omega authors simulations without prediction, optimisation, or false realism.

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

### A Structured "What Could Happen" Environment
- A simulation is a structured "what could happen" environment
- Structured exploration is the purpose
- Structured environment design is mandatory
- Unstructured environments invalidate simulation

### Bounded, Assumption-Driven, and Inspectable

- A simulation is bounded, assumption-driven, and inspectable
- Boundaries, assumptions, and inspectability are required
- Bounded, assumption-driven, and inspectable design is mandatory
- Missing any element invalidates simulation

### A Simulation Is Not

- A simulation is not a forecast
- A simulation is not a prediction engine
- A simulation is not a claim about reality
- A simulation is not an optimisation target

### A Forecast
- A simulation is not a forecast
- Forecasts claim future outcomes
- Avoiding forecast framing is mandatory
- Forecast framing is prohibited

### A Prediction Engine
- A simulation is not a prediction engine
- Prediction engines claim future states
- Avoiding prediction engine framing is mandatory
- Prediction engine framing is prohibited

### A Claim About Reality
- A simulation is not a claim about reality
- Reality claims assert truth
- Avoiding reality claims is mandatory
- Making claims about reality is prohibited

### An Optimisation Target

- A simulation is not an optimisation target
- Optimisation targets seek to maximize
- Avoiding optimisation target framing is mandatory
- Using simulation as optimisation target is prohibited

---

## 2. Authoring Responsibility

Omega must define explicitly:

### System Boundaries
- System boundaries must be defined explicitly
- Boundaries are stated and documented
- Explicit boundary definition is mandatory
- Missing boundary definition invalidates simulation

### Included Variables
- Included variables must be defined explicitly
- Variables are stated and documented
- Explicit variable definition is mandatory
- Missing variable definition invalidates simulation

### Excluded Variables
- Excluded variables must be defined explicitly
- Exclusions are stated and documented
- Explicit exclusion definition is mandatory
- Missing exclusion definition invalidates simulation

### Uncertainty Sources
- Uncertainty sources must be defined explicitly
- Uncertainty origins are stated and documented
- Explicit uncertainty source definition is mandatory
- Missing uncertainty source definition invalidates simulation

### Failure Modes to Explore

- Failure modes to explore must be defined explicitly
- Failure modes are stated and documented
- Explicit failure mode definition is mandatory
- Missing failure mode definition invalidates simulation

### Undefined Elements Are Treated as Unknown, Not Assumed

- Undefined elements are treated as unknown, not assumed
- Unknowns remain unknown
- Treating undefined as unknown is mandatory
- Assuming undefined elements is prohibited

---

## 3. Assumption Discipline

All simulations must declare:

### Environmental Assumptions
- Environmental assumptions must be declared
- Environment assumptions are stated
- Declaring environmental assumptions is mandatory
- Missing environmental assumption declaration invalidates simulation

### Agent Assumptions
- Agent assumptions must be declared
- Agent assumptions are stated
- Declaring agent assumptions is mandatory
- Missing agent assumption declaration invalidates simulation

### Data Assumptions
- Data assumptions must be declared
- Data assumptions are stated
- Declaring data assumptions is mandatory
- Missing data assumption declaration invalidates simulation

### Stability Assumptions

- Stability assumptions must be declared
- Stability assumptions are stated
- Declaring stability assumptions is mandatory
- Missing stability assumption declaration invalidates simulation

### Undeclared Assumptions Invalidate the Simulation

- Undeclared assumptions invalidate the simulation
- All assumptions must be explicit
- Invalidating on undeclared assumptions is mandatory
- Simulations with undeclared assumptions are prohibited

---

## 4. Scenario Generation

Omega may generate:

### Baseline Scenarios
- Baseline scenarios may be generated
- Normal conditions are allowed
- Generating baseline scenarios is permitted
- Baseline scenario generation cannot be prevented

### Stress Scenarios
- Stress scenarios may be generated
- Difficult conditions are allowed
- Generating stress scenarios is permitted
- Stress scenario generation cannot be prevented

### Edge-Case Scenarios
- Edge-case scenarios may be generated
- Extreme conditions are allowed
- Generating edge-case scenarios is permitted
- Edge-case scenario generation cannot be prevented

### Counterfactual Scenarios

- Counterfactual scenarios may be generated
- Alternative conditions are allowed
- Generating counterfactual scenarios is permitted
- Counterfactual scenario generation cannot be prevented

### Omega May Not

- Rank scenarios by likelihood
- Label outcomes as expected
- Collapse multiple scenarios into one narrative

### Rank Scenarios by Likelihood
- Omega may not rank scenarios by likelihood
- Likelihood ranking implies prediction
- Prohibiting likelihood ranking is mandatory
- Ranking scenarios by likelihood is prohibited

### Label Outcomes as Expected
- Omega may not label outcomes as expected
- Expected labels imply prediction
- Prohibiting expected outcome labels is mandatory
- Labeling outcomes as expected is prohibited

### Collapse Multiple Scenarios into One Narrative

- Omega may not collapse multiple scenarios into one narrative
- Multiple scenarios must remain separate
- Prohibiting narrative collapse is mandatory
- Collapsing scenarios into one narrative is prohibited

---

## 5. Temporal Handling

Simulations must:

### Represent Time Discretely or Explicitly
- Represent time discretely or explicitly
- Time representation is clear
- Discrete or explicit time representation is mandatory
- Implicit time representation is prohibited

### Avoid Continuous-Time Claims Without Justification
- Avoid continuous-time claims without justification
- Continuous-time requires justification
- Avoiding unjustified continuous-time is mandatory
- Unjustified continuous-time claims are prohibited

### Declare Update Rules Clearly

- Declare update rules clearly
- Update rules are explicit
- Clearly declaring update rules is mandatory
- Unclear update rules are prohibited

### Hidden Temporal Coupling Is Prohibited

- Hidden temporal coupling is prohibited
- Temporal relationships must be explicit
- Prohibiting hidden temporal coupling is mandatory
- Hidden temporal coupling is a violation

---

## 6. Outcome Handling

Simulation outputs must:

### Present Ranges, Not Points
- Present ranges, not points
- Outcome ranges are shown
- Presenting ranges is mandatory
- Point-only outputs are prohibited

### Preserve Branching Paths
- Preserve branching paths
- Multiple paths are maintained
- Preserving branching paths is mandatory
- Collapsing branching paths is prohibited

### Surface Uncertainty Growth

- Surface uncertainty growth
- Uncertainty increase is visible
- Surfacing uncertainty growth is mandatory
- Hiding uncertainty growth is prohibited

### Single-Outcome Outputs Are Prohibited

- Single-outcome outputs are prohibited
- Multiple outcomes are required
- Prohibiting single-outcome outputs is mandatory
- Single-outcome outputs are violations

---

## 7. Separation from Action

Simulations may:

### Inform Decisions
- Simulations may inform decisions
- Decision support is allowed
- Informing decisions cannot be prevented
- Decision information must be disclosed

### Rehearse Responses
- Simulations may rehearse responses
- Response practice is allowed
- Rehearsing responses cannot be prevented
- Response rehearsal must be disclosed

### Expose Risks

- Simulations may expose risks
- Risk exploration is allowed
- Exposing risks cannot be prevented
- Risk exposure must be disclosed

### They May Not

- Trigger actions
- Control systems
- Automate execution

### Trigger Actions
- Simulations may not trigger actions
- Action triggering is prohibited
- Prohibiting action triggering is mandatory
- Triggering actions is prohibited

### Control Systems
- Simulations may not control systems
- System control is prohibited
- Prohibiting system control is mandatory
- Controlling systems is prohibited

### Automate Execution

- Simulations may not automate execution
- Execution automation is prohibited
- Prohibiting execution automation is mandatory
- Automating execution is prohibited

---

## 8. Human Interaction

Humans may:

### Enter and Exit Simulations Freely
- Human may enter and exit simulations freely
- Free entry and exit is allowed
- Entering and exiting freely cannot be prevented
- Entry and exit actions must be logged

### Modify Assumptions
- Human may modify assumptions
- Assumption changes are allowed
- Modifying assumptions cannot be prevented
- Assumption modifications must be logged

### Pause, Rewind, or Branch
- Human may pause, rewind, or branch
- Time control is allowed
- Pausing, rewinding, or branching cannot be prevented
- Time control actions must be logged

### Reject Scenarios

- Human may reject scenarios
- Scenario rejection is allowed
- Rejecting scenarios cannot be prevented
- Scenario rejections must be logged

### No Simulation Is Binding

- No simulation is binding
- Simulations are not commitments
- Prohibiting binding simulations is mandatory
- Binding simulations are prohibited

---

## 9. Auditability

Each simulation must record:

### Authoring Assumptions
- Authoring assumptions are recorded
- All assumptions are logged
- Recording authoring assumptions is mandatory
- Missing assumption record invalidates simulation

### Scenario Set
- Scenario set is recorded
- All scenarios are logged
- Recording scenario set is mandatory
- Missing scenario set record invalidates simulation

### Excluded Variables
- Excluded variables are recorded
- All exclusions are logged
- Recording excluded variables is mandatory
- Missing excluded variable record invalidates simulation

### Known Limitations

- Known limitations are recorded
- Simulation limits are logged
- Recording known limitations is mandatory
- Missing known limitations invalidates simulation

### Intended Use

- Intended use is recorded
- How simulation is used is logged
- Recording intended use is mandatory
- Missing intended use record invalidates simulation

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
- Simulations presented as forecasts, prediction engines, reality claims, or optimisation targets
- Missing explicit definitions (system boundaries, included/excluded variables, uncertainty sources, failure modes)
- Undeclared assumptions (environmental, agent, data, stability)
- Ranking scenarios by likelihood, labeling outcomes as expected, or collapsing scenarios into one narrative
- Implicit time representation, unjustified continuous-time claims, or unclear update rules
- Single-outcome outputs, point-only outputs, or collapsed branching paths
- Simulations triggering actions, controlling systems, or automating execution
- Binding simulations or preventing free human interaction
- Missing or incomplete audit trails (authoring assumptions, scenario set, excluded variables, known limitations, intended use)
- Missing override logging

Violations must be:
- Logged as incidents
- Reviewed by system owner
- Corrected immediately
- Documented in change logs

---

## Amendments

Changes to simulation definitions, authoring responsibility, assumption discipline, or scenario generation require:
- Impact assessment on simulation authoring and integrity
- Testing with representative simulation scenarios
- Approval from system owner
- Version increment
- Documentation in change logs

---
