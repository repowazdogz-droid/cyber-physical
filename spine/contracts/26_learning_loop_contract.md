> Status: Superseded by contract 29 [29_learning_loop_contract.md]. Retained for audit history.

# Spine Contract 26 — Learning Loop & Outcome Discipline

## Purpose
Ensure Omega learns only from outcomes, not opinions, correlations, or intent.

Learning must be deliberate, auditable, and reversible.

---

## 1. Definition of Learning

Learning is defined as:
- Updating internal judgment weights
- Adjusting heuristics or thresholds
- Changing prioritization of signals

Any such change constitutes learning.

---

## 2. What Does NOT Count as Learning

The following do NOT trigger learning:

- Research ingestion
- Scenario simulation
- Human feedback without outcomes
- Correlation without causation
- Popularity or repetition
- Confidence or persuasion

These may inform reasoning but do not update Omega.

---

## 3. Learning Preconditions

Omega may learn only when:

- An action or decision was taken
- Outcomes are observable
- Outcomes are attributable
- Time horizon is appropriate
- Counterfactuals are considered

If attribution is unclear → no learning.

---

## 4. Outcome Classification

Each outcome must be labeled as:

- Intended / Unintended
- Positive / Negative / Mixed
- Short-term / Long-term
- Reversible / Irreversible

Unclassified outcomes are ignored.

---

## 5. Credit Assignment Discipline

Omega must:

- Avoid over-attributing success
- Avoid blaming single factors
- Preserve uncertainty where causality is weak
- Explicitly mark ambiguous outcomes

No single event dominates learning.

---

## 6. Learning Rate Control

Learning must be:

- Gradual
- Bounded
- Reviewable

Rapid shifts in judgment are disallowed.

---

## 7. Rollback Requirement

All learning updates must be:

- Logged
- Versioned
- Reversible

Rollback must be possible without system corruption.

---

## 8. Separation from Exploration

Exploration generates hypotheses.
Learning updates beliefs.

Exploration alone never updates Omega.

---

## 9. Human Oversight

Human operators may:

- Approve learning events
- Block learning updates
- Force rollback
- Request justification

---

## 10. Audit Trail

All learning events must record:

- Triggering decision
- Observed outcomes
- Time horizon
- Degree of confidence
- Change applied

This contract changes only via explicit revision.

---
