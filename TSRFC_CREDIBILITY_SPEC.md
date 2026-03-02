# TSRFC – Surgeon-Facing Credibility Spec

This document captures the critical feedback and requirements needed to make TSRFC feel **credible** to surgeons, not just visually polished.

It is *not* about UI chrome. It is about:

- What surgeons will question
- Which features answer those questions
- How TSRFC needs to evolve from V0 → "this is serious"


---

## 1. Core Surgeon Questions (and TSRFC's answers)

### 1.1 "Where did these numbers come from?"

**Surgeon's question:**

> "Technical risk 2.5… based on what?"

**Current issue:**

- We show scores like `Technical risk: 2.5` and `Workflow: 1.0`, but we do **not** show:
  - What underlying failure modes they aggregate
  - Whether they're literature, expert judgement, or local data
  - How they're combined into a single 0–10 score

**TSRFC requirement:**

- Every aggregate score (e.g. `Technical risk 2.5`) must be **backed by an explainable decomposition**.

**Planned features:**

- For each risk dimension (Technical, Workflow, Economic, Adoption, Evidence):

  - Add a **"Methodology / Breakdown" structure** behind the score:

    ```ts
    type RiskComponent = {
      id: string;
      label: string;
      contribution: number;    // contribution to overall score (0–10 scale)
      metric?: string;         // underlying rate or measure, e.g. "dural tear 1.2%"
      sourceType: 'literature' | 'local_data' | 'expert_consensus';
      sources: EvidenceSourceRef[]; // see evidence section
    };

    type RiskDimensionDetail = {
      score: number;           // e.g. 2.5
      range?: [number, number];// optional uncertainty interval
      components: RiskComponent[];
      notes?: string;
    };
    ```

  - In the UI:
    - Hover or click on `Technical 2.5` opens a small panel:
      - Lists the components (e.g., dural tears, wrong-level, device failure)
      - Shows each component's weight / contribution
      - Shows a short note like: "Based on pooled literature + local series if available".

  - For demo/static scenarios:
    - Populate this with **plausible example breakdowns**, clearly labeled as "example data / not hospital-specific".

---

### 1.2 "These scores are too clean – where is the uncertainty?"

**Surgeon's reaction:**

> "Real risk isn't 2.5. It's 2-ish with a range."

**Current issue:**

- We present risk as single-point numbers (2.5, 1.0) without any indication of:
  - Variability in the literature
  - Learning-curve effects
  - Patient selection

**TSRFC requirement:**

- Represent **uncertainty** explicitly, at least for Technical risk, and ideally others.

**Planned features:**

- Extend risk dimensions to include **range or confidence band**:

  ```ts
  type RiskDimensionDetail = {
    score: number;
    range?: [number, number]; // e.g. [1.8, 3.2]
    components: RiskComponent[];
  };
  ```

- UI patterns:
  - Use score ± delta text: e.g. `2.5 (range: 1.8–3.2)`.
  - Optionally use shaded dots/bars:
    - Filled dots for base score
    - Light shaded halo / background for range
  - Method:
    - For demo: hard-code plausible ranges.
    - For future: ranges derived from variation in underlying evidence (e.g., min/max complication rates across studies).

---

### 1.3 "What about patient selection?"

**Surgeon's reaction:**

> "Risk is different for a straightforward primary vs a complex revision with high BMI."

**Current issue:**

- TSRFC currently encodes procedure-level risk for an "average" elective patient.
- No explicit modeling of patient complexity / comorbidity.

**TSRFC requirement:**

- Make it clear that:
  - Current scores are baseline for "typical elective" patients.
  - There is a notion of risk modifiers or patient profiles.

**Planned features:**

**Option A – Patient profile presets (UI only at first):**

- Add a simple selector:
  - Patient profile: Routine / Complex / Extreme
- For now:
  - Keep the base scores fixed.
  - Show how scores would shift under different profiles as textual modifiers:

```
Technical risk: 2.5 (baseline)
  • +1.5 for revision surgery
  • +0.5 for BMI > 35
  • +1.0 for prior radiation
```

**Option B – Full adjustment (later):**

- Data model:

```ts
type PatientModifier = {
  id: string;
  label: string;
  deltaTechnical?: number;
  deltaWorkflow?: number;
  notes?: string;
};

type Scenario = {
  ...
  patientModifiers: PatientModifier[];
};
```

- Future UI:
  - Select modifiers and dynamically recompute displayed risk (e.g. 2.5 → 4.0).

---

### 1.4 "Show me the outcomes, not just risk dimensions"

**Surgeon's reaction:**

> "I care about complications, reoperations, PROs, costs — not just 'risk scores'."

**Current issue:**

- TSRFC currently exposes process risk dimensions (technical, workflow, economic, adoption, evidence).
- It does not explicitly show:
  - Complication rates
  - Reoperation
  - Patient-reported outcomes (PROs)
  - Cost per QALY or similar

**TSRFC requirement:**

- Add a Clinical Outcomes mini-section per concept, even in demo form.

**Planned features:**

- Data structure:

```ts
type ClinicalOutcomeSummary = {
  complicationRate?: string;   // "3.2% (95% CI 2.1–4.8%)"
  reoperationRate?: string;    // "8.5% at 2 years"
  mortalityRate?: string;      // "0.2%"
  los?: string;                // "Median LOS: 2 days"
  proSummary?: string;         // "82% good/excellent"
  costPerQALY?: string;        // "$18,000 per QALY"
  notes?: string;
  sources: EvidenceSourceRef[];
};
```

- UI:
  - Under each concept card, add a compact "Clinical Outcomes (summary)" box.
  - Clearly label data as:
    - "Illustrative/pooled literature example" in demo
    - "Hospital-specific" when wired to real data.

---

### 1.5 "Compared to what? Show standard of care."

**Surgeon's reaction:**

> "A vs B is meaningless unless I see both against what we do now."

**Current issue:**

- Current comparator shows Concept A vs Concept B.
- It doesn't always include "current standard technique" as a baseline.

**TSRFC requirement:**

- Treat current standard of care as an explicit concept in comparisons.

**Planned features:**

- Data model:

```ts
type Scenario = {
  id: string;
  label: string;
  ...
  baselineConcept?: Concept;   // current standard
  concepts: {
    A: Concept;
    B: Concept;
    // optionally more later
  };
};
```

- UI behavior:
  - For spine scenario:
    - Baseline: "Standard MIS decompression (freehand)"
    - Concept A: Guided Sleeve
    - Concept B: Robotic Platform
  - Comparison table:
    - Adds columns or toggles to show delta vs baseline, not just A vs B.
  - Interpretation panel:
    - Explicitly states which concept improves/worsens risk vs baseline.

---

## 2. Evidence Traceability

### 2.1 Evidence strength vs evidence risk

- Evidence strength (what we show as 1.0, 0.8, etc.) should be clearly labeled as "strength/quality of evidence for benefit."
- Evidence failure surface (Ev) is "evidence weakness / gap."

**Requirement:**

- Always present them as a pair:
  - Evidence strength: 1.0
  - Evidence gap (Ev): 0.0
- Tooltips / labels must clarify:
  - Strength = how strong the support is
  - Ev = how big the gap/uncertainty is

### 2.2 Evidence source references

**Planned structure:**

```ts
type EvidenceSourceRef = {
  id: string;
  type: 'RCT' | 'meta_analysis' | 'cohort' | 'registry' | 'expert_opinion';
  citation: string;      // "Smith et al. JAMA 2024; 123(4): 567–580"
  n?: number;            // sample size if applicable
  levelOfEvidence?: string; // "Level 1", "Level 2", etc.
  link?: string;         // DOI or URL
};

type EvidenceProfile = {
  strengthScore: number;       // e.g. 1.0
  gapScore: number;            // e.g. 0.2 (for Ev)
  keySources: EvidenceSourceRef[];
  notes?: string;
};
```

**UI:**

- Under "Evidence strength" on each card, add a:
  - View evidence link / tooltip.
  - Minimal table or bullet list:
    - RCTs
    - Meta-analyses
    - Cohort/registries
    - Expert consensus
  - This can be stubbed for demo with fictional but plausible references.

---

## 3. Institutional Customisation

### 3.1 Local data vs generic defaults

**Requirement:**

- Architect TSRFC such that:
  - Default: uses generic/literature-based scores.
  - Optional: can be overridden with hospital-specific data when available.

**High-level pattern:**

```ts
function applyLocalOverrides(
  concept: Concept,
  hospitalId: string
): Concept {
  const local = lookupLocalOutcomeData(hospitalId, concept.id);
  if (!local || local.caseVolume < MIN_CASES_FOR_OVERRIDE) {
    return concept;
  }

  return {
    ...concept,
    riskDimensions: {
      ...concept.riskDimensions,
      technical: {
        ...concept.riskDimensions.technical,
        score: mapComplicationRateToScore(local.complicationRate),
        // etc.
      },
    },
    clinicalOutcomes: {
      ...concept.clinicalOutcomes,
      complicationRate: `${local.complicationRate}% (local data)`,
      // etc.
    },
  };
}
```

**For now (demo):**

- Just document this pattern in the spec.
- No need to implement real database integration.

---

## 4. Time & Learning Curve

### 4.1 Longitudinal risk

- Risk is not static; it improves with experience.

**Requirement (future-facing / optional):**

- Allow scenarios to carry a time axis:

```ts
type LongitudinalRiskPoint = {
  year: number;
  technicalRisk: number;
  workflowRisk: number;
  notes?: string;
};

type Concept = {
  ...
  longitudinalRisk?: LongitudinalRiskPoint[];
};
```

- UI:
  - Small, unobtrusive timeline, e.g.:
    - 2023: 4.5 → 2024: 3.2 → 2025: 2.5
  - Used in interpretation:
    - "This concept starts higher risk but has a plausible path to improvement."

---

## 5. Priority Stack

This feedback is not all for now. It's a roadmap.

### 5.1 MUST for a serious demo (next iterations)

1. **Methodology transparency (lightweight)**
   - Even static text that says what contributes to Technical, Workflow, Economic risk.
2. **Evidence traceability (lightweight)**
   - Show fictional but structured evidence sources under Evidence strength.
3. **Standard of care baseline**
   - Make clear "A and B vs current standard," not just A vs B.

### 5.2 STRONG NEXT STEPS

4. Uncertainty / ranges
5. Patient profile note or simple selectors
6. Clinical outcomes mini-section

### 5.3 LATER / ADVANCED

7. Hospital overrides
8. Full longitudinal risk modeling
9. Programmable export for research/regulatory workflows

---

## 6. How to Use This Doc

- Treat this file as the source of truth when:
  - Extending TSRFC's data model
  - Justifying UX decisions to clinicians
  - Planning v1.1 / v1.2 for real-world pilots
- Any new feature visible to surgeons should answer at least one of:
  - Where did this number come from?
  - How uncertain is it?
  - For which patients does this apply?
  - Compared to what we already do?
  - What outcomes does this affect?






