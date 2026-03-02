# TSRFC – v2 Clinical Design Directions

This document outlines three critical refinement directions for TSRFC v2, based on clinical leadership feedback and prototype limitations identified during surgeon-facing demos.

---

## 1. Evidence Decomposition (Beyond a Scalar)

### Problem

A single Evidence Strength scalar (e.g. 1.2) is too "flat" for surgeons. Surgeons need to see *what kind* of evidence supports a concept, not just a relative strength number.

### v2 Intent

- **Keep the scalar** for quick comparison across concepts.
- **Add a decomposed view** showing:
  - IDEAL framework stage (e.g. Stage 2a vs Stage 3).
  - Study mix: RCT / prospective cohort / registry / consensus.
  - Local audit presence/absence.
- **Example UI pattern:**
  - Card shows: `Evidence strength: 1.2 (IDEAL 2b – early prospective data, illustrative)`
  - Expand/hover: small grid with fields for IDEAL stage, study types, and local audit.

### Constraints

- Clearly labeled as prototype / illustrative until backed by real data.
- No claims of automated evidence synthesis in the current prototype.
- Decomposition schema should be co-designed with clinical leads.

---

## 2. Persona Stress-Testing (Case Complexity Toggle)

### Problem

Translational friction is highly sensitive to case complexity. A robot might be "No-Go" for a simple primary case but "Go" for a morbidly obese patient or complex revision. The current prototype assumes a single generic case, which limits its utility for governance discussions.

### v2 Intent

- Introduce a simple "Scenario Persona" or "Complexity" toggle:
  - Primary straightforward
  - High BMI
  - Complex revision
  - Elderly / multi-morbid
- Each persona adjusts the interpretation of friction and value surfaces (weights/emphasis), not patient-level risk.
- **Example UI:**
  - A small selector: `Scenario persona: Primary | High BMI | Complex revision | Elderly multi-morbid`
  - Helper text: "Prototype: stress-tests friction and value interpretation across typical case archetypes (not patient-level risk)."

### Constraints

- No per-patient risk modeling.
- No integration with real patient data in current prototype.
- Keeps the tool firmly in translational / governance space, not clinical decision support (CDS).
- Persona definitions should be co-designed with clinical leads.

---

## 3. Safety Signal Surface (Without Becoming a Safety Tool)

### Problem

In reality, technical friction and clinical risk are closely related; ignoring safety feels incomplete, but over-claiming safety is dangerous. Surgeons expect some acknowledgment of safety considerations, but the tool must not become a safety risk calculator.

### v2 Intent

- Add a small "Safety Signal" indicator per concept card, summarising external safety-related signal rather than computing risk.
- **Potential inputs (in a real deployment):**
  - Registry alerts / safety notices.
  - Known complication clusters (from literature/registries).
  - Manufacturer warnings or field safety notices.
- **Example UI text:**
  - `Safety signal (prototype): No specific registry alerts identified (illustrative only).`
  - or `Safety signal (prototype): Early adoption – watch for positioning-related complications and workflow-induced errors.`

### Constraints

- Clearly labeled as "prototype" and "signal" not "risk score".
- No numeric safety score.
- No patient-level outcome prediction.
- Safety signal taxonomy should be co-designed with clinical leads and safety officers.

---

## 4. Relationship to the Current Prototype

### Current v1 Includes

- Translational friction surfaces (technical, workflow, economic, adoption, evidence).
- Patient Value (non-scored) qualitative surface.
- Transition Factors (CAUTIOUS → GO) as a co-design scaffold.
- Evidence strength as a scalar with traceability hints.

### v2 Directions Should

- Build on the existing structure.
- Be developed in collaboration with clinical leads (e.g. defining persona sets, evidence decomposition schema, and safety signal taxonomy).
- Only be implemented when there is clarity on:
  - Data sources (e.g. registry APIs, local audit systems).
  - Governance constraints (e.g. what safety signals can be displayed without regulatory risk).
  - Clinical validation (e.g. persona definitions must reflect real-world case mix).

---

## 5. Implementation Priorities

These directions are **not** scheduled for immediate implementation. They represent forward-looking design considerations that should be:

1. **Discussed with clinical leadership** before any code changes.
2. **Validated against real data sources** (e.g. can we actually decompose evidence? Do registries expose safety signals?).
3. **Prototyped separately** before integrating into the main TSRFC view.
4. **Documented with clear disclaimers** about prototype status and data limitations.

---

## 6. Notes for Engineers

- All three directions are **presentational enhancements**, not scoring logic changes.
- Evidence decomposition would require a new data model (e.g. `EvidenceProfile` with IDEAL stage, study types, audit flags).
- Persona stress-testing would require persona-specific interpretation logic (e.g. different friction thresholds per persona).
- Safety signal would require a new surface type (similar to Patient Value, non-scored, qualitative).
- None of these should be implemented without:
  - Clinical lead sign-off on taxonomy/schema.
  - Clear data source agreements.
  - Updated disclaimers and prototype labeling.

---

*Last updated: 2026-01-20*






