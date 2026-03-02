# Orientation Lab — UI Text, Prompts & Example Outputs

**Product:** Orientation Lab  
**Tagline:** World orientation under uncertainty.

---

## 1. UI TEXT

### Landing Page Hero
```
Orientation Lab

World orientation under uncertainty.

Used when reality is represented in more than one way —
and no single representation can be allowed to decide.
```

### Core Value Proposition
```
When people disagree, it is rarely because they are irrational.
It is because they are using different models, carrying different
assumptions, and answering different kinds of questions without
realising they are doing different things.

Orientation Lab exists to make that structure visible —
not to resolve disagreement,
but to make it legible.
```

### What This System Does
- Surfaces competing representations without forcing consensus
- Separates knowledge from judgment
- Makes assumptions, disagreements, and unknowns explicit
- Keeps responsibility with people, not systems

### What Comes Out
A single, shareable orientation artifact the room can stand behind:
- Which models are in play
- Where disagreement actually sits
- What remains unknown — and who owns it (as roles)
- What kind of judgment is required

### Boundary Statement
```
Orientation Lab is a thinking and facilitation system.
It does not forecast outcomes, optimise objectives,
recommend actions, or replace governance.

If you need a decision, this will not give you one.
If you need the room to see what it is deciding,
it exists for that purpose.

Currently used as a thinking tool, not an operational system.
```

### Flow Steps
1. **Capture** → Capture structure. No solutions yet.
2. **Discriminate** → Name what evidence would separate stories.
3. **Own** → Assign ownership as roles. Clarify which judgment is required.
4. **Produce** → Generate artifact pack.

### Section Labels

**Models Card:**
- Title: "Models"
- Subtitle: "Different valid lenses on the same situation. Capture the claim + what it covers."
- Fields:
  - Name: "e.g., Ops view / Safety view / Finance view"
  - Claim: "What this model says is happening."
  - Scope: "What it covers / what it ignores."

**Assumptions Card:**
- Title: "Assumptions"
- Subtitle: "Make implicit assumptions explicit. Mark whether they're given, contested, or unknown."
- Fields:
  - Assumption statement: "Write it as a plain claim."
  - Status: "Given / contested / unknown"
  - Owner (role/team): "Optional. Who could validate?"

**Disagreements Card:**
- Title: "Disagreements"
- Subtitle: "Where models conflict. Capture what is disputed and what would resolve it."
- Fields:
  - Topic: "What is being disputed?"
  - Parties (roles/teams): "Optional. Keep it role-based."
  - What would change minds?: "Evidence, observation, test, or threshold."

**Unknowns Card:**
- Title: "Unknowns"
- Subtitle: "What you cannot responsibly assume yet. Track impact + horizon so judgment stays honest."
- Fields:
  - Unknown question: "Phrase as a question."
  - Impact: "How much it matters if wrong." (low / medium / high)
  - Horizon: "When might this become knowable?" (hours / days / weeks / months / unknown)
  - Owner (role/team): "Optional. Who can reduce this unknown?"

**Judgments Card:**
- Title: "What kind of question is this?"
- Subtitle: "Mark what kind of judgment is actually needed to move forward."
- Options:
  - definition
  - measurement
  - threshold
  - tradeoff
  - authority
  - timing
  - values

### Room Mode Labels
- **Room mode** (header)
- **Capture** / **Discriminate** / **Own** (step buttons)
- **Signals (structure only)** (panel title)
- **Timer (optional)** (panel title)
- **Boundary:** "This mode does not forecast, optimise, or recommend actions. It helps a room surface structure and own judgment."

### Artifact Pack Labels
- **Artifact pack (printable)** (title)
- **Copy pack text** (button)
- **Print pack** (button)
- Description: "One-page print view: header → signals summary → artifact text. No recommendations."

---

## 2. CORE PROMPTS

### Room Mode Prompts (by Step)

#### Capture Step
1. **"What models are in the room?"**
   - Body: "Name 2–3 perspectives that explain what's happening. Keep them descriptive (not a plan)."

2. **"What is being assumed?"**
   - Body: "Turn implied beliefs into explicit statements. Mark contested vs unknown."

3. **"Where do people genuinely disagree?"**
   - Body: "Write the disagreement as a question. Avoid blame language."

4. **"If we had to disagree, where would it be?"** (conditional)
   - Body: "Sometimes rooms converge too early. Name the most plausible disagreement you'd want surfaced."

#### Discriminate Step
1. **"What would change minds?"**
   - Body: "For each disagreement: what evidence, observation, or test would actually shift the room?"

2. **"Which unknowns matter most?"**
   - Body: "Pick 1–2 unknowns with high impact and near horizon. Make them concrete."

3. **"Where is the boundary?"**
   - Body: "State what this session will NOT do (no forecasting, no optimisation, no assigning blame)."

4. **"Discriminators first"** (conditional)
   - Body: "Before debating solutions: write what evidence would separate the competing stories."

5. **"What is currently unknown that could break the plan?"** (conditional)
   - Body: "Name one assumption that, if false, would force reorientation."

#### Own Step
1. **"Who owns validation?"**
   - Body: "For key assumptions/unknowns: assign an owner as a role (not a person)."

2. **"What judgment types are required?"**
   - Body: "Are we making a definition call, a threshold call, a tradeoff call, an authority call, or a timing call?"

3. **"What must be decided outside this room?"**
   - Body: "Name the decisions that require governance, policy, or values beyond today's evidence."

### How To Use Prompts

**1) Capture:**
- Add 2–3 models (even if you disagree with one).
- Write the claim and the scope (what it ignores).
- Convert "noise" into explicit assumptions.

**2) Discriminate:**
- For each disagreement: write what would change minds.
- For each unknown: tag impact + time horizon.
- Name the judgment type (facts vs thresholds vs values vs authority).

**3) Own:**
- Assign owners as roles ("Safety lead", "Service director"), not people.
- Make residual uncertainty explicit.
- Mark what is governance (not analysis).

**4) Produce:**
- Switch to Artifact view and generate the room pack.
- Copy a share link for another room or approver.
- Export JSON if you need an audit trail.

---

## 3. EXAMPLE OUTPUTS

### Example 1: Service Under Pressure Template

**Models:**
- **Ops view:** "The system is saturating during a predictable window; queues cascade after that."
  - Scope: "Throughput, queues, capacity constraints; not clinical quality or long-term demand change."
- **Safety view:** "Risk increases when waits breach the service threshold; mitigation is about protecting the edge cases."
  - Scope: "Safety and escalation; not staffing rosters or blame assignment."

**Assumptions:**
- "The main bottleneck is effective capacity (not raw demand)." [contested] Owner: Service lead / ops manager
- "A small capacity change can have non-linear effects when the system is near saturation." [given] Owner: Ops / improvement lead

**Disagreements:**
- Topic: "Is the primary issue demand variability or throughput capacity?"
- Parties: "Ops vs frontline vs leadership"
- What would change minds: "Time-windowed evidence on arrivals vs starts/completions; clear bottleneck narrative."

**Unknowns:**
- Question: "Which part of the pathway is the true constraint during the peak window?"
- Impact: high | Horizon: days | Owner: Ops / data analyst

**Judgment Types Required:**
- measurement, threshold, tradeoff, authority

### Example 2: Artifact Pack Output (Text)

```
Orientation Lab v1
Session: ED Winter Pressure Review
Created: 1/15/2024, 2:30:00 PM
Updated: 1/15/2024, 3:45:00 PM

Signals (structure reflection; not advice):
- [ATTENTION] Missing discriminators for key disagreement
- [NOTE] Assumptions lack owners
- [NOTE] Unknowns without impact/horizon tags

Artifact (read-out):

ORIENTATION ARTIFACT

MODELS
- Ops view: The system is saturating during a predictable window; queues cascade after that.
  Scope: Throughput, queues, capacity constraints; not clinical quality or long-term demand change.
- Safety view: Risk increases when waits breach the service threshold; mitigation is about protecting the edge cases.
  Scope: Safety and escalation; not staffing rosters or blame assignment.

ASSUMPTIONS
- The main bottleneck is effective capacity (not raw demand).
  Status: contested | Owner: Service lead / ops manager
- A small capacity change can have non-linear effects when the system is near saturation.
  Status: given | Owner: Ops / improvement lead

DISAGREEMENTS
- Topic: Is the primary issue demand variability or throughput capacity?
  Parties: Ops vs frontline vs leadership
  What would change minds: Time-windowed evidence on arrivals vs starts/completions; clear bottleneck narrative.

UNKNOWNS
- Which part of the pathway is the true constraint during the peak window?
  Impact: high | Horizon: days | Owner: Ops / data analyst

JUDGMENT TYPES REQUIRED
- measurement, threshold, tradeoff, authority

BOUNDARY
This artifact does not forecast, optimise, or recommend actions. It records structure so humans can own judgment.

Boundary:
- This tool does not forecast, optimise, recommend, or decide.
- It captures structure so humans can own judgement.
```

### Example 3: Program Delivery Template

**Models:**
- **Delivery view:** "We can ship if we narrow scope and protect the critical path."
  - Scope: "Roadmap, dependencies, delivery constraints; not market strategy."
- **Value view:** "Shipping the wrong thing creates irreversible cost; we must validate assumptions first."
  - Scope: "Value/risk; not day-to-day delivery tactics."

**Assumptions:**
- "The critical path is known and stable for the next 4–6 weeks." [unknown] Owner: Program lead

**Disagreements:**
- Topic: "Do we prioritise speed (ship) or certainty (validate) this month?"
- Parties: "Delivery vs product vs sponsor"
- What would change minds: "Clear definition of irreversible decisions + evidence needed for confidence."

**Unknowns:**
- Question: "Which assumptions, if wrong, would invalidate the plan?"
- Impact: high | Horizon: days | Owner: Program lead / sponsor

**Judgment Types Required:**
- definition, tradeoff, authority, timing, values

### Example 4: Safety-Critical Engineering Template

**Models:**
- **Safety case view:** "The system is safe if constraints are enforced and failure modes are bounded."
  - Scope: "Hazards, constraints, assurance artefacts; not schedule pressure."
- **Delivery pressure view:** "We're taking on risk implicitly to hit milestones; that risk must be surfaced and owned."
  - Scope: "Delivery constraints; not rewriting the safety case."

**Assumptions:**
- "We know the top hazards and have credible mitigations." [contested] Owner: Safety / assurance lead

**Disagreements:**
- Topic: "Is the current mitigation plan adequate for the highest-impact hazards?"
- Parties: "Engineering vs safety vs leadership"
- What would change minds: "Evidence that mitigations hold under stress; explicit residual risk acceptance."

**Unknowns:**
- Question: "Which hazard scenarios remain untested under realistic stress conditions?"
- Impact: high | Horizon: weeks | Owner: Test / safety lead

**Judgment Types Required:**
- measurement, threshold, authority, timing, values

---

## 4. WHO IT'S FOR

### Five Canonical Situations

1. **Irreversible decisions under uncertainty**
   - Who: Boards, Crisis leaders, Infrastructure owners, Executives with one-way doors
   - Why: "When the cost of being wrong is permanent, orientation matters more than speed."
   - Provides:
     - Competing models made explicit
     - Clear separation of facts vs judgment
     - Ownership that can be defended later

2. **Governance around powerful systems**
   - Who: AI governance teams, Risk committees, Safety and assurance leads, Oversight bodies
   - Why: "Models can simulate outcomes. They cannot carry responsibility."
   - Provides:
     - A place where human judgment remains explicit
     - A record of why a system was trusted, limited, or paused
     - Clear accountability boundaries

3. **Research, innovation, and frontier work**
   - Who: Research directors, Grant panels, Innovation portfolio owners, Frontier technology teams
   - Why: "When evidence is incomplete, disagreement is expected — but must be structured."
   - Provides:
     - Assumptions surfaced early
     - Unknowns tracked honestly
     - Disagreement separated from ego or politics

4. **Public and civic decision-making**
   - Who: Public leaders, Commissioners, Policy owners, Cross-agency partnerships
   - Why: "Public decisions must be explainable, not just defensible."
   - Provides:
     - Transparent tradeoffs
     - Explicit judgment types
     - Artifacts that survive scrutiny

5. **Human systems under pressure**
   - Who: Families, Schools, Care systems, Communities navigating change
   - Why: "Pressure is often felt before it can be explained."
   - Provides:
     - Language for what's happening
     - Separation of system stress from personal blame
     - Shared understanding without forcing solutions

---

## 5. WHERE IT'S USED

### Human systems
Leadership teams, families, boards, institutions, and groups where disagreement carries emotional, moral, or relational weight.

Orientation Lab helps people realise they are not arguing about the same thing — and gives them a shared map before judgment begins.

### Technical & scientific systems
Engineering, research, modelling, and analytical contexts where multiple representations of reality coexist — and none can be treated as authoritative by default.

Orientation Lab is used when outputs conflict, assumptions diverge, or uncertainty cannot be reduced before action.

### Safety, assurance & irreversible decisions
Contexts where errors are costly, decisions cannot be undone, and responsibility must remain explicit.

Orientation Lab makes residual uncertainty visible before it is silently absorbed into risk.

---

## 6. KEY UI PATTERNS

### Flow Status Indicators
- **Flow:** "Capture → Discriminate → Own → Produce."
- **Next:** Shows next incomplete step (e.g., "Next: Discriminate")
- **Ready / Not ready** chips for each step

### Session Bar
- Session title (editable)
- Created / Updated timestamps
- Share link button
- Export JSON button

### Room Mode
- Dark background (#0b0d12)
- Step buttons: Capture / Discriminate / Own
- Prompt card (left)
- Timer panel (right)
- Signals panel (right)
- Exit button (ESC key)

### Artifact View
- One-page printable format
- Signals summary (structure reflection; not advice)
- Full artifact text
- Boundary statement

---

## 7. BOUNDARY STATEMENTS

### Primary Boundary
```
Orientation Lab is a thinking and facilitation system.
It does not forecast outcomes, optimise objectives,
recommend actions, or replace governance.

If you need a decision, this will not give you one.
If you need the room to see what it is deciding,
it exists for that purpose.
```

### Artifact Boundary
```
This artifact does not forecast, optimise, or recommend actions.
It records structure so humans can own judgment.
```

### Room Mode Boundary
```
This mode does not forecast, optimise, or recommend actions.
It helps a room surface structure and own judgment.
```

### Footer Boundary
```
Currently used as a thinking tool, not an operational system.
```

---

**End of Orientation Lab Content Document**








