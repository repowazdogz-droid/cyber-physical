# TSRFC – Translational Surgery Risk & Feasibility Cartography (Methodology v0)

This document explains how the TSRFC examples shown in the web view are structured and how the scores are derived.

TSRFC is **not** a predictive model. It is a **structured mapping tool** for surgical innovation concepts, exposing:

- where they touch the procedure (unit operations)
- where they can fail (failure surfaces)
- what evidence they need (evidence)
- what stands in the way of adoption (adoption, workflow, economics)
- what regulatory and reimbursement complexity they bring

---

## 1. Core Objects

Each concept (e.g. MIS lumbar guided sleeve, robotic MIS, AI colonoscopy) is represented as:

- **Procedure context**
  - `procedureId` (e.g. `mis_lumbar_decompression`)
  - `domain` (spine / endoscopy / ENT)
  - `indication`, `approach`

- **Concept metadata**
  - `conceptName`, `conceptRole`, `conceptType`
  - `capitalCostBand`, `disposablesCostBand`
  - `learningCurveCases` (approximate cases to competence)

- **Unit operations**
  Structured ladder of unit operations, each with:
  - `name`
  - `primaryGoal`
  - `typicalIssues`
  - `innovationHooks`

- **Failure surfaces**
  Each is a specific structural way the concept can fail in translation:
  - `category` (technical / workflow / economic / adoption / evidence)
  - `risk` (low / medium / high)
  - `code` (e.g. `DURAL_TEAR_RISK`, `CAPITAL_COST_HIGH_ROI_UNCERTAIN`)
  - `description`
  - `affectedOps` (which unit operations it touches)
  - `notes`

- **Evidence profile**
  - `currentLevel` (e.g. retrospective, single-centre, multicentre RCT)
  - `targetLevel` (what is realistically required)
  - `comments`

- **Adoption profile**
  - `trajectory` (likely, uncertain, likely-if-evidence-strong)
  - `primaryBarriers` (learning curve, capital, workflow, trust)
  - `leveragePoints` (what could unlock adoption)
  - `killCriteria` (what would kill the concept)
  - `notes`

- **Patient outcomes**
  - `primaryOutcome` (e.g. leg pain reduction, ADR improvement)
  - `secondaryOutcomes` (e.g. reoperation, length of stay)
  - `expectedDeltaVsBaseline` (small / moderate / large / uncertain)

- **Regulatory pathway**
  - `classLabel` (II / IIb / III / SaMD etc., approximate)
  - `region` (UK/EU/US conceptual)
  - `anticipatedEvidenceLevel` (what kind of study)
  - `regulatoryComplexityScore` (0 = low, 1 = moderate, 2 = high)

- **Reimbursement profile**
  - `hasExistingCode` (yes / no / partial / unknown)
  - `payerAlignment` (aligned / misaligned / unknown)
  - `reimbursementRiskScore` (0 = low, 1 = moderate, 2 = high)

- **Competitive context**
  - `alternatives` (current standard, emerging competitors)
  - `relativePosition` (behind / comparable / ahead / uncertain)

- **Scores**
  - `coverage_unit_ops`
  - `risk_technical`
  - `risk_workflow`
  - `risk_economic`
  - `evidence_strength`
  - `adoption_risk_load`

---

## 2. Scoring Rubric (v0)

### 2.1 Failure-surface-level scoring

Each failure surface is manually assigned a `risk` band:

- `low`    → 0
- `medium` → 1
- `high`   → 2

This is currently **expert-judgment-based**, not learned from data.

### 2.2 Dimension scores

Dimension scores are simple sums over relevant failure surfaces:

- **Technical risk**
  - Sum of scores for failure surfaces with `category = technical`
  - Examples: `DURAL_TEAR_RISK`, `INCOMPLETE_DECOMPRESSION`, `FALSE_NEGATIVES`

- **Workflow risk**
  - Sum where `category = workflow`
  - Examples: `SETUP_COMPLEXITY`, `EQUIPMENT_BURDEN_ROBOTIC`, `DISPLAY_CLUTTER`

- **Economic risk**
  - Sum where `category = economic`
  - Examples: `CAPITAL_COST_UNCLEAR_ROI`, `CAPITAL_COST_HIGH_ROI_UNCERTAIN`

- **Adoption risk load**
  - Sum where `category = adoption`
  - Examples: `LEARNING_CURVE_STEEP`, `TRUST_AND_OVERRIDING`

- **Evidence strength**
  - Sum of **positive evidence contributions**; higher = stronger evidence
  - In the current examples, this is approximated by a manual score (e.g. 1.5 for AI colonoscopy reflecting stronger published RCTs vs 0.2 for early robotic platforms).

- **Unit-op coverage**
  - Simple count: number of unit operations explicitly mapped.

These scores are intended to be **relative**, not absolute. They make comparisons between concepts in the same domain more legible.

---

## 3. Decision Bands (Go / Cautious / No-Go)

The web view exposes a simple **decision band** per concept:

- **Inputs:**
  - `risk_technical`
  - `risk_workflow`
  - `risk_economic`
  - `evidence_strength`
  - `adoption_risk_load`

- **Logic (v0 heuristic):**

```text
If risk_technical > 3 AND (risk_workflow + risk_economic) > 3
  → "No-Go (v0 heuristic)"
  → Interpretation: high combined technical + workflow/economic burden.
    Needs truly exceptional, proven benefit to justify.

Else if risk_technical <= 3 AND evidence_strength >= 1.0 AND adoption_risk_load <= 2.0
  → "Go for pilot / structured deployment"
  → Interpretation: technical risk manageable, evidence supportive,
    adoption burden not extreme. Suitable for structured pilots.

Else
  → "Cautious exploration"
  → Interpretation: some dimensions heavy or uncertain. Appropriate for
    limited exploration with tight monitoring and explicit stop rules.
```

This is intentionally simple and transparent.
It's not meant to replace human judgment – it's meant to force explicit articulation of why something is "go" or "no-go".

---

## 4. Intended Users

This v0 is primarily aimed at:

- Translational surgeons
- Clinical innovators
- Technology evaluation units
- Strategy & investment teams who actually care about clinical reality

It is not meant to be:

- a predictive ML model
- a regulatory submission generator
- a reimbursement calculator

It is a lens and a mapping substrate.

---

## 5. Limitations and Next Steps

**Limitations (v0):**

- Scores are based on expert-like heuristics, not trained models.
- No statistical validation yet.
- No automatic extraction from real trial datasets.
- No explicit modelling of patient heterogeneity or centre effects.

**Natural extensions:**

- Link to real-world outcome data to update `evidence_strength`.
- Calibrate risk scores against historical adoption trajectories.
- Plug into hospital/procurement processes (multi-stakeholder scoring).
- Expand presets beyond spine + endoscopy + ENT.

---

## 6. How This Should Be Used

**Use TSRFC outputs to:**

- Make assumptions visible (about risk, evidence, adoption).
- Compare two or more concepts in a structured way.
- Design validation ladders (what to test, in what order, with what endpoints).
- Facilitate multi-stakeholder conversations (surgery, anaesthetics, nursing, administrators, investors).

**Do not use TSRFC alone to:**

- Decide that a concept is "safe" or "unsafe".
- Replace trial design, HTA, or formal regulatory assessment.

It is a map, not an oracle.






