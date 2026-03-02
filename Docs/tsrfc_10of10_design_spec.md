# TSRFC – 10/10 Design Spec (Production-Ready Direction)

This document describes the four pillars needed to move TSRFC from a structured reasoning prototype to a production-grade decision-support engine suitable for use by Chief of Surgery and Chief Financial Officer stakeholders.

**Status:** Forward-looking design specification. These features are not currently implemented and require clinical validation, data source agreements, and engineering planning before development.

---

## Overview

The current TSRFC prototype provides a structured framework for comparing surgical innovation concepts across translational friction surfaces. To reach production readiness, four critical enhancements are required:

1. **Dynamic Patient Personas** – Case complexity-aware friction modeling
2. **Formal Evidence Decomposition** – IDEAL framework integration and traceability
3. **Ergonomic Dividend & Team Cognitive Load** – Explicit modeling of surgeon health and team alert fatigue
4. **Direct Data Integration & Comparative Visuals** – Live data feeds and radar chart visualization

---

## 1. Dynamic Patient Personas ("Friction Flip")

### Problem Statement

A single friction profile per concept assumes "one-size-fits-all" case complexity. In reality, technology can be "No-Go" for simple primaries but "Go" for complex cases. The current prototype cannot demonstrate that "high-friction" tech for routine cases becomes a "friction saver" for specific patient segments.

### Design Intent

Enable persona-based friction modeling where the same concept shows different friction profiles depending on case complexity. This provides a defensible story for:
- Which patients justify expensive technology
- Why some concepts should be limited to defined indication windows

### Persona Definitions

Example personas (to be validated with clinical leads):
- **Simple primary case** – Standard indication, normal anatomy, low complexity
- **High BMI** – Increased technical difficulty for manual techniques
- **Revision surgery** – Scar tissue, altered anatomy, higher technical challenge
- **Elderly / multi-morbid** – Frailty considerations, longer recovery, different value trade-offs

### Behavior Model

**Standard of care friction changes with persona:**
- Technical friction for manual techniques increases in High BMI / complex revision personas
- Workflow friction may remain stable or increase slightly

**Robotic / advanced tech friction:**
- Technical friction may remain stable or decrease in complex personas (ergonomic dividend)
- Workflow / economic friction mostly unchanged across personas
- Adoption friction may vary (e.g. higher acceptance in complex cases where benefits are clearer)

### Implementation Sketch

**Data Model:**
```typescript
enum Persona {
  PRIMARY = "primary",
  HIGH_BMI = "high_bmi",
  REVISION = "revision",
  ELDERLY_MULTIMORBID = "elderly_multimorbid"
}

interface PersonaModifiers {
  persona: Persona;
  technicalFrictionMultiplier: number;  // e.g. 1.2 for high BMI
  workflowFrictionMultiplier: number;   // typically 1.0
  economicFrictionMultiplier: number;    // typically 1.0
  adoptionFrictionMultiplier: number;   // may vary
}
```

**UI Component:**
- Small selector: `Persona: Primary | High BMI | Revision | Elderly`
- Clear label: "Prototype stress-test across case archetypes (not patient-level risk)"
- Concept cards update friction scores based on selected persona

**Engine Logic:**
- Apply persona-specific multipliers to base friction scores
- Maintain clear separation: persona affects interpretation, not patient-level risk prediction
- No CDS (Clinical Decision Support) claims

### Constraints

- No per-patient risk modeling
- No integration with real patient data in current prototype
- Keeps the tool firmly in translational / governance space, not CDS
- Persona definitions must be co-designed with clinical leads

---

## 2. Formal Evidence Decomposition (IDEAL Integration)

### Problem Statement

A single Evidence Strength scalar (e.g. 1.2) is insufficient and undermines trust. Surgeons need to see *what kind* of evidence supports a concept, not just a relative strength number. The current prototype hints at traceability but does not decompose evidence into its constituent parts.

### Design Intent

Replace "vibe-based" scalar with transparent provenance. Allow surgeons to see *why* a concept is scored where it is, and make clear what is literature vs. local experience.

### Evidence Components

**External components:**
- IDEAL framework stage (e.g. Stage 2b Exploration, Stage 3 Assessment)
- Study mix: RCT count, prospective cohort count, registry presence
- Registry data availability and quality

**Internal components:**
- Local audit count (e.g. "15 cases in this unit")
- Complication rates in the specific unit (if available)
- Learning-curve phase (e.g. Cases 1–10 vs 50+)

### Implementation Sketch

**Data Model:**
```typescript
interface EvidenceProfile {
  // Scalar (kept for quick comparison)
  strength: number;  // 0.0 - 2.0
  
  // Decomposed components
  idealStage: IDEALStage | null;
  studyMix: {
    rctCount: number;
    prospectiveCohortCount: number;
    registryPresence: boolean;
    consensusGuidelines: boolean;
  };
  localAudit: {
    caseCount: number | null;
    complicationRate: number | null;  // if available
    learningCurvePhase: "early" | "established" | null;
  };
}
```

**UI Component:**
- Card shows: `Evidence strength: 1.2 (IDEAL 2b – early prospective data, illustrative)`
- On expand/hover: small table/grid with:
  - IDEAL stage
  - Study types (RCT / cohort / registry)
  - Local audit status
- Clear labeling: "Prototype scalar only — in a real deployment this would be broken down into study types, stage (e.g. IDEAL), registry data, and local audits"

**Constraints:**
- Clearly marked as illustrative until real data wiring exists
- No claim of automated evidence synthesis in the prototype
- Decomposition schema should be co-designed with clinical leads

---

## 3. Ergonomic Dividend & Team Cognitive Load

### Problem Statement

Current surfaces hint at ergonomics and cognitive load but don't model them explicitly. Ergonomics and cognitive load are major adoption drivers in surgery, yet they are often invisible in traditional cost-benefit analyses.

### 3.1 Ergonomic Dividend

**Concept:**
For concepts like a Spine Robot, technical friction reduction represents ergonomic and reproducibility gains. This is an occupational health and fatigue benefit for surgeons, especially in complex / long cases.

**Design:**
- Add an explicit sub-surface or tag under Technical friction:
  - "Ergonomic dividend: Low / Medium / High (prototype)"
- Use it to explain why Technical friction is lower even when Workflow/Economic friction rises
- Example: "Technical friction reduced (ergonomic dividend) while workflow and economic friction increase, making this more attractive for complex or high-fatigue cases"

**Implementation Sketch:**
```typescript
interface TechnicalFrictionBreakdown {
  baseScore: number;
  ergonomicDividend: "low" | "medium" | "high" | null;
  ergonomicNotes?: string;  // e.g. "Reduced surgeon fatigue in long cases"
}
```

### 3.2 Team Cognitive Load & Alert Fatigue

**Concept:**
For AI concepts (e.g. polyp detection overlay), workflow friction must include alert fatigue and cognitive burden. An AI that fires 10 false positives per case has very high adoption friction even if accurate.

**Design:**
- Add a Cognitive Load / Alert Fatigue indicator under Workflow or Adoption friction:
  - Examples:
    - "Alert burden: Low / Moderate / High (prototype)"
    - Qualitative notes: e.g. "Frequent low-value prompts can drive team to disengage the system"
- Acknowledge the whole-team experience, not just device performance

**Implementation Sketch:**
```typescript
interface WorkflowFrictionBreakdown {
  baseScore: number;
  cognitiveLoad: "low" | "moderate" | "high" | null;
  alertFatigue: "low" | "moderate" | "high" | null;
  teamNotes?: string;  // e.g. "Scrub tech reports frequent false alarms"
}
```

### Intended Effect

Distinguish "Technical success" from "Implementation success." Acknowledge that surgeon health and team alert fatigue are first-class concerns, not afterthoughts.

---

## 4. Direct Data Integration & Comparative Visuals

### Problem Statement

Manual inputs risk bias and admin burden. Chiefs will ask where numbers come from. The current prototype uses illustrative static data; production systems need to reflect real OR data and team sentiment.

### 4.1 Data Integration (Future Sources)

**Workflow friction data sources:**
- OR logs and timestamps:
  - Room entry/exit times
  - Anaesthesia start/stop
  - Incision to closure (skin-to-skin)
  - Turnover time between cases
- Phase durations (if available):
  - Setup time
  - Procedure duration
  - Cleanup time

**Economic friction data sources:**
- Procurement system data:
  - CAPEX (capital expenditure)
  - OPEX (operating expenditure, service contracts)
- Sterile Processing / SPD metrics:
  - Turnover time
  - Tray costs
  - Instrument reprocessing costs

**Adoption friction data sources:**
- Simple "Net Promoter Score" (NPS) or ease-of-use feedback from:
  - Surgeons
  - Nurses
  - Scrub techs
  - Anaesthesia team
- Structured surveys (e.g. "How easy is this to use?" 1-5 scale)

**Design Intent:**
- Define suggested APIs / feeds; actual wiring is out-of-scope for the prototype
- Keep TSRFC as a computation/visualization layer over local data, not the system of record
- Maintain clear data provenance labeling (e.g. "Data from OR logs, last updated: 2026-01-20")

### 4.2 Comparative Visuals – Radar / Spider Plots

**Concept:**
Add an optional radar chart view to overlay Standard of care vs Concept A vs Concept B across key surfaces (Technical, Workflow, Economic, Adoption, Patient Value).

**Visual Effect:**
- Concept B (Robot) "blooms" on Economic friction but "shrinks" on Technical friction
- Stakeholders can see trade-offs at a glance
- Makes it immediately clear where concepts excel vs. struggle

**Implementation Sketch:**

**Data:**
- Use normalized surface scores for visualization only
- Normalize to 0-1 scale for radar chart (where 0 = lowest friction, 1 = highest friction)

**UI Component:**
- Toggle between table view (current) and radar view
- Radar chart shows:
  - Standard of care (baseline)
  - Concept A
  - Concept B
  - Surfaces: Technical, Workflow, Economic, Adoption, Patient Value (if scored)
- Maintain textual explanations; chart is supplementary, not replacement

**Constraints:**
- Chart is visualization only; no new scoring logic
- Maintain all existing disclaimers and prototype labeling
- Ensure accessibility (e.g. colorblind-friendly palette, alt text)

---

## 5. Summary of 10/10 Refinements

| Refinement                        | Why it completes the tool                                            | Implementation Priority |
|-----------------------------------|------------------------------------------------------------------------|-------------------------|
| Complexity / Persona toggles      | Moves from "one-size-fits-all" to case-aware translational profiling. | High                    |
| IDEAL-based evidence traceability | Replaces illustrative scalar with transparent clinical provenance.    | High                    |
| Ergonomic + cognitive load surfacing | Acknowledges surgeon health and team alert fatigue as first-class. | Medium                  |
| Data integration + team NPS       | Reflects real OR data and team sentiment, not just opinions.          | Medium                  |
| Comparative visuals (radar)       | Fast, intuitive overview of where concepts bloom vs. shrink.          | Low                     |

### Implementation Notes

These pillars do not need to be implemented at once, but they define the trajectory from the current prototype to a production-ready TSRFC that can withstand scrutiny from clinical leadership, governance, and finance.

**Prerequisites for each pillar:**
1. **Personas:** Clinical lead validation of persona definitions and friction multipliers
2. **Evidence Decomposition:** IDEAL framework integration agreement, evidence source agreements
3. **Ergonomic/Cognitive Load:** Clinical validation of scoring rubric, team feedback mechanisms
4. **Data Integration:** API agreements with OR systems, procurement systems, survey infrastructure
5. **Radar Charts:** UI/UX validation, accessibility review

**Risk Mitigation:**
- All features must maintain clear "prototype" labeling until validated
- No CDS (Clinical Decision Support) claims
- Data integration must respect privacy and governance constraints
- Visualizations must not oversimplify complex trade-offs

---

## 6. Technical Architecture Considerations

### Data Flow (Future State)

```
[OR Systems] → [Data Integration Layer] → [TSRFC Engine] → [Visualization Layer]
[Procurement] ─┘                              ↓
[Surveys] ────────────────────────────────────┘
```

### Component Responsibilities

- **Data Integration Layer:** Normalize and validate incoming data feeds
- **TSRFC Engine:** Apply persona modifiers, compute friction scores, generate evidence profiles
- **Visualization Layer:** Render tables, radar charts, concept cards

### Data Model Extensions

All new features should extend existing data structures rather than replace them:
- `CompileResult` extended with `personaModifiers`
- `EvidenceProfile` extended with IDEAL stage and study mix
- `FailureSurface` extended with ergonomic/cognitive load sub-surfaces
- New `DataProvenance` object for tracking data sources and freshness

---

*Last updated: 2026-01-21*






