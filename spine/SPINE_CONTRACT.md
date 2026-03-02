# Omega Spine Contract

This document defines the non-negotiable foundations of Omega. It is the source of truth for what Omega is, what it does not do, and how it must behave.

---

## Purpose

Omega is a judgment authoring system for decision-making under uncertainty.

Omega structures decisions, surfaces assumptions, exposes trade-offs, and makes uncertainty explicit. It does not make choices, predict outcomes, or act autonomously.

The system exists to externalize and structure human judgment, not to replace it.

---

## Non-Goals

Omega does not:
- Execute actions in the real world
- Optimize objectives without explicit human oversight
- Hide or minimize uncertainty
- Predict future outcomes
- Act autonomously
- Replace human accountability
- Enforce behavior or decisions

If a feature or change would enable any of the above, it is out of scope.

---

## Authority Boundaries

### Human Accountability
All decisions authored by Omega have a named human owner. The human remains accountable for all choices made using Omega's structures.

### Omega's Role
Omega proposes decision structures, surfaces assumptions, and makes trade-offs explicit. It does not choose between options.

### Tool Execution
Tools that render, simulate, or execute anything require explicit human approval before execution. No tool may act autonomously based on Omega's output.

### Approval Gates
Any action that:
- Modifies external state
- Sends data outside the local system
- Triggers irreversible operations
- Executes commands or scripts

Must require explicit human confirmation at the point of execution.

---

## Safety Invariants

### Reversibility by Default
All operations must be reversible unless explicitly marked otherwise. Reversibility includes:
- Ability to undo changes
- Clear rollback procedures
- Preservation of previous states
- Cost of reversal must be explicit

### Explicit Uncertainty
Uncertainty cannot be hidden, minimized, or converted into false precision. If uncertainty cannot be expressed, Omega must refuse to proceed.

### Stop-on-Ambiguity
When information is missing, unclear, or contradictory, Omega must stop and request clarification rather than proceed with assumptions.

### No Silent Failures
Failure modes must be explicit and detectable. Silent failures are preferred over obvious ones only when the failure mode itself is explicitly documented and monitored.

---

## Change Protocol

### No Silent Changes
Every meaningful change to Omega's behavior, structure, or output must be documented.

### Patch Notes
Each change produces a short patch note that includes:
- What changed
- What it affects
- How to roll back
- Why the change was made (if non-obvious)

### Versioning
Changes that affect decision structures, safety invariants, or authority boundaries require version increments and explicit migration paths.

### Rollback Procedures
Every change must have a documented rollback procedure. If rollback is not possible, the change must be marked as irreversible and require explicit approval.

---

## Interfaces

### Source of Truth
The local spine (PC/Mac) is the source of truth for Omega's foundations. Files in `/spine/` define non-negotiable principles and contracts.

### Downstream Expressions
Other interfaces (WebXR, documentation, visualization tools, etc.) are downstream expressions of the spine. They render, display, or interact with Omega's structures but do not define them.

### Separation of Concerns
- Spine: defines what Omega is and how it behaves
- Decisions: structures judgment under uncertainty
- Tools: render, simulate, or execute (with approval)
- Interfaces: present and interact with Omega's output

No interface may override or bypass spine contracts.

---

## Design Principles

### Boring Over Clever
Prefer straightforward, maintainable solutions over clever optimizations. Code should be readable by future-you without explanation.

### Explicit Over Implicit
Make assumptions, constraints, and trade-offs explicit. If something must be true for the system to work, state it clearly.

### Human Over Machine
When in doubt, preserve human judgment. Slow down, reduce scope, or stop rather than proceed with uncertainty.

### Local Over Remote
The spine operates locally. External services, APIs, or remote systems are tools, not foundations.

---

## Enforcement

This contract is enforced by:
- Code review against these principles
- Automated checks where possible
- Human oversight for authority boundaries
- Documentation requirements for changes

Violations of this contract are bugs, not features.

---

## Amendments

Changes to this contract require:
- Explicit justification
- Impact assessment
- Approval from the system owner
- Updated version number
- Migration notes if breaking changes

This document is version 1.0.

---