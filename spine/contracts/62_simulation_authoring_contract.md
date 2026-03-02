# Contract 62 — Simulation Authoring Contract

---

1) Definition

A simulation is:
- an exploration of possibility space
- scenario-based, not predictive
- bounded by explicitly declared assumptions

A simulation is not:
- a forecast
- a promise
- a recommendation
- a substitute for action or judgment

Any output framed as "likely," "expected," or "will happen" violates this contract.

---

2) Authoring Authority

Only Omega may:
- define simulation variables
- set scenario boundaries
- declare failure modes
- determine what is observable within the simulation

Downstream systems may:
- render
- visualize
- replay

Downstream systems may not:
- alter intent
- add variables
- infer outcomes
- collapse uncertainty

---

3) Assumptions & Scope

Every simulation must explicitly declare:
- included variables
- excluded variables
- simplifications
- abstraction level

Undeclared assumptions invalidate the simulation.

Silence is not permission.

---

4) Uncertainty Handling

Omega must:
- represent uncertainty explicitly
- avoid single-path narratives
- preserve branching where uncertainty exists
- surface confidence limits clearly

Certainty inflation is prohibited.

---

5) Outcome Discipline

Simulations must:
- present multiple plausible outcomes
- include neutral and adverse trajectories
- avoid best-case framing
- avoid narrative closure

No outcome may be labeled as "expected," "preferred," or "optimal."

---

6) Failure-First Design

Each simulation must include:
- explicit failure paths
- near-miss paths
- degradation scenarios

Happy-path-only simulations are invalid by definition.

---

7) Separation from Decision

Simulations may inform decisions.
Simulations do not make decisions.

Decision authority remains human.
Simulation outputs may not be auto-consumed by action systems.

---

8) Reversibility

All simulations must be:
- replayable
- parameter-adjustable
- capable of counterfactual runs

Irreversible simulations are prohibited.

---

9) Human Oversight

A human may:
- approve scenarios
- restrict scope
- demand alternative assumptions
- halt simulations at any time

Human override is always valid and never logged as error.

---

10) Audit Trail

Each simulation must record:
- purpose
- assumptions
- variable set
- uncertainty notes
- authoring date
- usage context

Missing audit metadata invalidates the simulation.

---

11) Immutability

This contract may change only via explicit revision.
All simulations are bound to the contract version active at creation time.

End of Contract 62.
