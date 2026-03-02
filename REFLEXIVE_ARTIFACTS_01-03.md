# ARTIFACT 01 — Domain Model & Ontology — v0.2.0

## 1. Atom List & Map

| Atom | Definition |
|------|-----------|
| **Decision** | A specific, actionable choice. First-class entity, separate from Case. Can be referenced across Cases. |
| **Claim** | A discrete, falsifiable assertion. Atomic unit of reasoning. Subtypes: `factual`, `inferential`, `evaluative`, `predictive`, `assumption`. |
| **Evidence** | A concrete datum (quote, measurement, citation, document reference) that supports or undermines a Claim. |
| **Unknown** | An explicitly declared gap in knowledge relevant to the Case. Tracked, not hidden. |
| **Risk** | A potential negative outcome or failure mode identified during analysis. |
| **Constraint** | A boundary condition, resource limit, or non-negotiable requirement that scopes the analysis. |
| **Test** | A concrete, verifiable check that could resolve an Unknown, validate a Claim, or reduce a Risk. |
| **Outcome** | The actual result of a Decision. Starts unknown. Updated via append-only events. Never deleted. |

**Structural Containers:** Case, Analysis, Perspective, Synthesis, Lens, Trace, Context, Evaluation.

---

## 2. Glossary

**Case:** A durable, addressable container for reasoning about a single well-defined question or decision. Cases persist indefinitely and are never deleted (archived only). A Case contains one or more Analyses, zero or more Decisions (via join table), and a Context.

**Stimulus:** The initial input that triggers Case creation. Types: `decision_request`, `assessment_request`, `research_question`, `problem_statement`. Stored as `stimulus_type` enum and `stimulus_content` text on the Case.

**Context:** Background information, domain knowledge, and framing that scopes the Case. A Case has exactly one Context. Context includes `domain`, `key_entities`, `relevant_history`, `assumptions_initial` (jsonb).

**Analysis:** A single execution of multi-lens reasoning on a Case. An Analysis contains exactly one Perspective per active Lens. Analyses are versioned within a Case (`sequence_number`). An Analysis transitions through states: `pending`, `running`, `completed`, `failed`, `partial`.

**Lens:** A system-defined analytical framework that produces a Perspective. Lenses are versioned configuration entities. Each Lens has an `orientation` (convergent, divergent, orthogonal) and an `analytical_angle` description. Lenses are immutable once created.

**Perspective:** The structured output from a single Lens execution within an Analysis. A Perspective contains extracted Claims, Evidence, Unknowns, Risks, Constraints, and Tests. Perspectives are independent—they do not see each other's outputs during generation.

**Claim:** A discrete, falsifiable assertion extracted from a Perspective. Claims are the atomic unit of reasoning content. Categories: `factual`, `inferential`, `evaluative`, `predictive`, `assumption`. Claims can exist temporarily without evidence (`evidence_status = 'unsupported'`) but must have a `review_by` timestamp. Claims link across Cases via `decision_claims` and `claim_claims` graphs.

**Assumption:** A Claim whose `category = 'assumption'`. An Assumption is a Claim whose truth is taken as given rather than demonstrated. Assumptions are not a separate entity—they are Claims with a specific category.

**Evidence:** A concrete datum (quote, measurement, citation, document reference) that supports, undermines, or contextualizes a Claim. Evidence has `as_of`, `valid_from`, `valid_until` timestamps and can be flagged `possibly_stale` when `as_of` exceeds a staleness threshold.

**Assessment:** The evaluation of a Claim's strength, validity, or reliability. Assessments are stored as structured fields on Claims (`confidence_weight`, `evidence_status`) and computed deterministically from linked Evidence.

**Synthesis:** The deterministic aggregation of all Perspectives within an Analysis. Synthesis computes convergence points (agreement across Lenses), divergence points (disagreement), and overall `confidence_score` (inter-lens agreement × evidential density). Synthesis contains no LLM-generated content—only computed metrics.

**Decision:** A specific, actionable choice that can be referenced across multiple Cases. Decisions are first-class entities separate from Cases. A Decision links to Cases via `decision_cases` join table. A Decision links to Claims via `decision_claims` join table. Every Decision has exactly one Outcome from creation.

**Outcome:** The actual result of a Decision. Every Decision has an Outcome record from creation. Outcomes start as `status = 'unknown'` and are updated via append-only `outcome_events`. Outcomes are never deleted.

**outcome_event:** An append-only log entry on an Outcome. Records status changes, observations, and measurements. Events are immutable and ordered by `sequence_number`.

**Unknown:** An explicitly declared gap in knowledge relevant to the Case. Unknowns are tracked, not hidden. Unknowns link to Claims and Decisions. Unknowns have a `status` (identified, resolved, deferred) and can be targeted by Tests.

**Risk:** A potential negative outcome or failure mode identified during analysis. Risks link to Claims and Decisions. Risks have `severity` and `likelihood` ratings. Risks can be targeted by Tests.

**Constraint:** A boundary condition, resource limit, or non-negotiable requirement that scopes the analysis. Constraints link to Claims and Decisions. Constraints have a `type` (resource, temporal, regulatory, technical) and `description`.

**Test:** A concrete, verifiable check that could resolve an Unknown, validate a Claim, or reduce a Risk. Tests have `as_of`, `valid_from`, `valid_until` timestamps. Tests link to targets via polymorphic `test_targets` table (target_type: unknown, claim, risk).

**Trace:** An immutable record of a single Lens API call. Traces store the exact prompt hash, model parameters, request payload, response payload, latency, and error state. Traces guarantee reproducibility.

**Evaluation:** A post-hoc assessment of reasoning quality, accuracy, or outcome alignment. Evaluations link to Cases, Analyses, Decisions, or Outcomes. Evaluations have a `type` (accuracy, calibration, outcome_alignment, process_quality) and structured `findings` jsonb.

**Predecessor:** A Case that informs or precedes another Case. Predecessor relationships are explicit (`case_predecessors` link table) and create a directed graph of reasoning evolution.

---

## 3. Entity Definitions

### Case

| field | type | description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `owner_id` | UUID | Future multi-user support (nullable for v0) |
| `title` | text | Human-readable title |
| `stimulus_type` | enum | `decision_request`, `assessment_request`, `research_question`, `problem_statement` |
| `stimulus_content` | text | The initial input/question |
| `state` | enum | `draft`, `active`, `archived` |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |
| `archived_at` | timestamp | Nullable; set when archived |

### Context

| field | type | description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `case_id` | UUID | Foreign key to cases (unique) |
| `domain` | text | Domain/field of inquiry |
| `key_entities` | jsonb | Array of entity names/descriptions |
| `relevant_history` | text | Historical context |
| `assumptions_initial` | jsonb | Initial assumptions (array of text) |
| `created_at` | timestamp | Creation timestamp |

### Analysis

| field | type | description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `case_id` | UUID | Foreign key to cases |
| `sequence_number` | integer | Version number within case (>= 1) |
| `state` | enum | `pending`, `running`, `completed`, `failed`, `partial` |
| `confidence_score` | float | Nullable; computed from Perspectives (0.0-1.0) |
| `confidence_breakdown` | jsonb | Nullable; per-lens confidence contributions |
| `started_at` | timestamp | Nullable; when analysis started |
| `completed_at` | timestamp | Nullable; when analysis completed/failed |
| `created_at` | timestamp | Creation timestamp |

### Lens

| field | type | description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `name` | text | Unique identifier (e.g., `analytical`, `adversarial`) |
| `version` | text | Semantic version (e.g., `1.0.0`) |
| `orientation` | enum | `convergent`, `divergent`, `orthogonal` |
| `analytical_angle` | text | Description of analytical approach |
| `prompt_hash` | text | SHA-256 hash of prompt template |
| `is_active` | boolean | Whether lens is currently active |
| `created_at` | timestamp | Creation timestamp |

### Perspective

| field | type | description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `analysis_id` | UUID | Foreign key to analyses |
| `lens_id` | UUID | Foreign key to lenses |
| `lens_version` | text | Lens version at time of execution |
| `state` | enum | `pending`, `running`, `completed`, `failed` |
| `raw_output` | jsonb | Full structured output from lens |
| `extracted_claims_count` | integer | Count of claims extracted |
| `extracted_evidence_count` | integer | Count of evidence items extracted |
| `started_at` | timestamp | Nullable; when perspective started |
| `completed_at` | timestamp | Nullable; when perspective completed/failed |
| `created_at` | timestamp | Creation timestamp |

### Claim

| field | type | description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `perspective_id` | UUID | Foreign key to perspectives (nullable; claims can exist independently) |
| `case_id` | UUID | Foreign key to cases |
| `category` | enum | `factual`, `inferential`, `evaluative`, `predictive`, `assumption` |
| `content` | text | The claim statement |
| `confidence_weight` | float | Lens-local confidence (0.0-1.0) |
| `evidence_status` | enum | `supported`, `unsupported`, `contested`, `superseded` |
| `review_by` | timestamp | Nullable; required when `evidence_status = 'unsupported'` |
| `as_of` | timestamp | Point-in-time assessment |
| `valid_from` | timestamp | When claim becomes valid |
| `valid_until` | timestamp | Nullable; when claim expires (null = still valid) |
| `possibly_stale` | boolean | Flag when `as_of` exceeds staleness threshold |
| `created_at` | timestamp | Creation timestamp |

### Evidence

| field | type | description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `content` | text | The evidence datum (quote, measurement, citation) |
| `source` | text | Source identifier (document, person, system) |
| `source_type` | enum | `document`, `measurement`, `citation`, `testimony`, `observation` |
| `as_of` | timestamp | Point-in-time when evidence was collected |
| `valid_from` | timestamp | When evidence becomes valid |
| `valid_until` | timestamp | Nullable; when evidence expires (null = still valid) |
| `possibly_stale` | boolean | Flag when `as_of` exceeds staleness threshold |
| `created_at` | timestamp | Creation timestamp |

### Decision

| field | type | description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `statement` | text | The decision statement |
| `state` | enum | `draft`, `proposed`, `adopted`, `rejected`, `superseded` |
| `created_at` | timestamp | Creation timestamp |
| `adopted_at` | timestamp | Nullable; when decision was adopted |

### Outcome

| field | type | description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `decision_id` | UUID | Foreign key to decisions (unique) |
| `status` | enum | `unknown`, `success`, `partial_success`, `failure`, `inconclusive` |
| `description` | text | Nullable; narrative description |
| `created_at` | timestamp | Creation timestamp |
| `updated_at` | timestamp | Last update timestamp |

### outcome_event

| field | type | description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `outcome_id` | UUID | Foreign key to outcomes |
| `sequence_number` | integer | Ordering within outcome (>= 1) |
| `event_type` | enum | `status_change`, `observation`, `measurement`, `correction` |
| `content` | text | Event description |
| `metadata` | jsonb | Nullable; structured event data |
| `created_at` | timestamp | Creation timestamp |

### Unknown

| field | type | description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `case_id` | UUID | Foreign key to cases |
| `description` | text | Description of the knowledge gap |
| `status` | enum | `identified`, `resolved`, `deferred` |
| `resolved_at` | timestamp | Nullable; when unknown was resolved |
| `created_at` | timestamp | Creation timestamp |

### Risk

| field | type | description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `case_id` | UUID | Foreign key to cases |
| `description` | text | Risk description |
| `severity` | enum | `low`, `medium`, `high`, `critical` |
| `likelihood` | enum | `unlikely`, `possible`, `likely`, `very_likely` |
| `created_at` | timestamp | Creation timestamp |

### Constraint

| field | type | description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `case_id` | UUID | Foreign key to cases |
| `type` | enum | `resource`, `temporal`, `regulatory`, `technical`, `organizational` |
| `description` | text | Constraint description |
| `created_at` | timestamp | Creation timestamp |

### Test

| field | type | description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `case_id` | UUID | Foreign key to cases |
| `description` | text | Test description |
| `status` | enum | `proposed`, `pending`, `completed`, `failed`, `cancelled` |
| `result` | text | Nullable; test result |
| `as_of` | timestamp | Point-in-time when test was executed |
| `valid_from` | timestamp | When test becomes valid |
| `valid_until` | timestamp | Nullable; when test expires (null = still valid) |
| `created_at` | timestamp | Creation timestamp |

### Synthesis

| field | type | description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `analysis_id` | UUID | Foreign key to analyses (unique) |
| `confidence_score` | float | Nullable; computed confidence (0.0-1.0) |
| `convergence_points` | jsonb | Array of claim IDs where lenses agree |
| `divergence_points` | jsonb | Array of claim IDs where lenses disagree |
| `summary` | text | Nullable; deterministic text summary (not LLM-generated) |
| `created_at` | timestamp | Creation timestamp |

### Trace

| field | type | description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `perspective_id` | UUID | Foreign key to perspectives |
| `lens_id` | UUID | Foreign key to lenses |
| `prompt_hash` | text | SHA-256 hash of prompt used |
| `model_name` | text | LLM model identifier |
| `model_parameters` | jsonb | Temperature, max_tokens, etc. |
| `request_payload` | jsonb | Full request sent to LLM |
| `response_payload` | jsonb | Full response from LLM |
| `latency_ms` | integer | Request latency in milliseconds |
| `error_state` | text | Nullable; error message if failed |
| `created_at` | timestamp | Creation timestamp |

### Evaluation

| field | type | description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `target_type` | enum | `case`, `analysis`, `decision`, `outcome` |
| `target_id` | UUID | Polymorphic target ID |
| `type` | enum | `accuracy`, `calibration`, `outcome_alignment`, `process_quality` |
| `findings` | jsonb | Structured evaluation findings |
| `created_at` | timestamp | Creation timestamp |

### Link Tables

#### decision_claims

| field | type | description |
|-------|------|-------------|
| `decision_id` | UUID | Foreign key to decisions |
| `claim_id` | UUID | Foreign key to claims |
| `created_at` | timestamp | Creation timestamp |

#### claim_claims

| field | type | description |
|-------|------|-------------|
| `claim_from_id` | UUID | Foreign key to claims (source) |
| `claim_to_id` | UUID | Foreign key to claims (target) |
| `relationship_type` | enum | `supports`, `contradicts`, `refines`, `depends_on` |
| `created_at` | timestamp | Creation timestamp |

#### claim_evidence

| field | type | description |
|-------|------|-------------|
| `claim_id` | UUID | Foreign key to claims |
| `evidence_id` | UUID | Foreign key to evidence_items |
| `support_type` | enum | `supports`, `undermines`, `contextualizes` |
| `created_at` | timestamp | Creation timestamp |

#### decision_cases

| field | type | description |
|-------|------|-------------|
| `decision_id` | UUID | Foreign key to decisions |
| `case_id` | UUID | Foreign key to cases |
| `created_at` | timestamp | Creation timestamp |

#### test_targets

| field | type | description |
|-------|------|-------------|
| `test_id` | UUID | Foreign key to tests |
| `target_type` | enum | `unknown`, `claim`, `risk` |
| `target_id` | UUID | Polymorphic target ID |
| `created_at` | timestamp | Creation timestamp |

#### case_predecessors

| field | type | description |
|-------|------|-------------|
| `case_id` | UUID | Foreign key to cases (successor) |
| `predecessor_case_id` | UUID | Foreign key to cases (predecessor) |
| `relationship_type` | enum | `evolves`, `references`, `supersedes` |
| `created_at` | timestamp | Creation timestamp |

---

## 4. Relationships & Cardinality

```
Case (1) ──< (0..*) Analysis
Case (1) ──< (1) Context
Case (1) ──< (0..*) Claim
Case (1) ──< (0..*) Unknown
Case (1) ──< (0..*) Risk
Case (1) ──< (0..*) Constraint
Case (1) ──< (0..*) Test
Case (*) ──<─> (*) Decision (via decision_cases)
Case (*) ──<─> (*) Case (via case_predecessors)

Analysis (1) ──< (1) Synthesis
Analysis (1) ──< (1..*) Perspective
Analysis (1) ──< (0..*) Evaluation

Lens (1) ──< (0..*) Perspective
Lens (1) ──< (0..*) Trace

Perspective (1) ──< (0..*) Claim
Perspective (1) ──< (0..*) Trace

Claim (*) ──<─> (*) Claim (via claim_claims, directed)
Claim (*) ──<─> (*) Evidence (via claim_evidence)
Claim (*) ──<─> (*) Decision (via decision_claims)

Decision (1) ──< (1) Outcome
Decision (1) ──< (0..*) Evaluation

Outcome (1) ──< (0..*) outcome_event

Test (*) ──<─> (*) Unknown|Claim|Risk (via test_targets, polymorphic)
```

**Integrity Constraints:**

- Every Case has exactly one Context (enforced by unique constraint on `contexts.case_id`).
- Every Decision has exactly one Outcome (enforced by unique constraint on `outcomes.decision_id`).
- Every Perspective belongs to exactly one Analysis and one Lens.
- `claim_claims` cannot be self-referential (`claim_from_id != claim_to_id`).
- `case_predecessors` cannot be self-referential (`case_id != predecessor_case_id`).
- `valid_until >= valid_from` where both are non-null (CHECK constraint).
- `review_by` is non-null when `claims.evidence_status = 'unsupported'` (CHECK constraint).
- `sequence_number >= 1` on all sequence fields (CHECK constraint).
- Confidence scores in [0.0, 1.0] range (CHECK constraint).
- `outcome_events.sequence_number` is unique within `outcome_id` (unique constraint).

---

## 5. Lifecycle / State Machines

### Case State Machine

```
[draft] ──(activate)──> [active] ──(archive)──> [archived]
   │                        │
   └────────────────────────┘
        (update)
```

**Transitions:**
- `draft → active`: User activates case for analysis.
- `active → archived`: User archives case (no deletion).
- `active → active`: Updates allowed while active.

### Analysis State Machine

```
[pending] ──(start)──> [running] ──(complete)──> [completed]
   │                        │
   │                        ├──(fail_all)──> [failed]
   │                        │
   │                        └──(fail_some)──> [partial]
```

**Transitions:**
- `pending → running`: Analysis execution begins.
- `running → completed`: All Perspectives complete successfully.
- `running → failed`: All Perspectives fail or Analysis-level error.
- `running → partial`: Some Perspectives complete, some fail (partial results preserved).

### Perspective State Machine

```
[pending] ──(start)──> [running] ──(complete)──> [completed]
   │                        │
   │                        └──(fail)──> [failed]
```

**Transitions:**
- `pending → running`: Lens execution begins.
- `running → completed`: Lens returns parseable output.
- `running → failed`: Lens timeout, unparseable response, or error.

### Decision State Machine

```
[draft] ──(propose)──> [proposed] ──(adopt)──> [adopted]
   │                        │
   │                        ├──(reject)──> [rejected]
   │                        │
   └────────────────────────┴──(supersede)──> [superseded]
```

**Transitions:**
- `draft → proposed`: Decision is proposed for consideration.
- `proposed → adopted`: Decision is adopted.
- `proposed → rejected`: Decision is rejected.
- `* → superseded`: Decision is superseded by another decision.

### Outcome State Machine

```
[unknown] ──(observe_success)──> [success]
   │
   ├──(observe_partial)──> [partial_success]
   │
   ├──(observe_failure)──> [failure]
   │
   └──(observe_inconclusive)──> [inconclusive]
```

**Transitions:**
- All transitions from `unknown` via `outcome_event` records.
- States are terminal (no transitions between non-unknown states).
- Corrections create new `outcome_event` with `event_type = 'correction'` but do not change status unless explicitly recorded.

---

## 6. Temporal Rules

**`as_of` Semantics:**
- `as_of` indicates the point-in-time when a Claim, Evidence, or Test was assessed or collected.
- `as_of` is set at creation and never updated (immutable).
- `as_of` may differ from `created_at` if backdating historical assessments.

**`valid_from` / `valid_until` Windows:**
- `valid_from` indicates when a Claim, Evidence, or Test becomes valid/applicable.
- `valid_until` (nullable) indicates when validity expires. `null` means still valid.
- `valid_until >= valid_from` where both are non-null (enforced by CHECK constraint).
- Default: `valid_from = created_at` if not specified.

**Staleness Detection:**
- Claims and Evidence have `possibly_stale` boolean flag.
- System computes staleness threshold: `as_of < NOW() - INTERVAL '90 days'` (configurable).
- When threshold exceeded, set `possibly_stale = true` (background job).
- Staleness does not invalidate—it flags for human review.

**Decay Flag Behavior:**
- `possibly_stale` is informational only—does not affect Synthesis computation.
- Human reviewer can update `valid_until` or add new Evidence to refresh.
- Staleness check runs daily via background job.

**Temporal Validity in Synthesis:**
- Synthesis computation considers only Claims/Evidence where `valid_until IS NULL OR valid_until > NOW()`.
- `as_of` timestamps are used for evidential density calculation (more recent = higher weight).
- Temporal windows do not affect convergence/divergence detection—only confidence weighting.

---

## 7. Invariants

1. **Every Case has exactly one Context.** Enforced by unique constraint on `contexts.case_id`.

2. **Every Decision has exactly one Outcome from creation.** Enforced by unique constraint on `outcomes.decision_id` and application-level trigger/constraint ensuring Outcome creation on Decision insert.

3. **Every Analysis has exactly one Synthesis.** Enforced by unique constraint on `syntheses.analysis_id`.

4. **Every Analysis contains exactly one Perspective per active Lens.** Enforced by application logic (no schema constraint due to dynamic Lens set).

5. **Confidence scores are in [0.0, 1.0] range.** Enforced by CHECK constraints on `analyses.confidence_score`, `syntheses.confidence_score`, `claims.confidence_weight`.

6. **`valid_until >= valid_from` where both are non-null.** Enforced by CHECK constraint on Claims, Evidence, Tests.

7. **`review_by` is non-null when `evidence_status = 'unsupported'`.** Enforced by CHECK constraint on Claims.

8. **`sequence_number >= 1`.** Enforced by CHECK constraints on Analyses, outcome_events.

9. **Claims without evidence are time-bounded.** When `evidence_status = 'unsupported'`, `review_by` must be set and `review_by <= created_at + INTERVAL '30 days'` (application-level validation).

10. **Synthesis is deterministic.** No LLM calls in Synthesis computation path. All metrics computed from structured Perspective outputs.

11. **Traces are immutable.** No UPDATE or DELETE on `traces` table (application-level policy).

12. **outcome_events are append-only.** No UPDATE or DELETE on `outcome_events` table (application-level policy).

13. **`claim_claims` cannot be self-referential.** Enforced by CHECK constraint: `claim_from_id != claim_to_id`.

14. **`case_predecessors` cannot be self-referential.** Enforced by CHECK constraint: `case_id != predecessor_case_id`.

15. **Perspectives are independent.** No foreign key or constraint linking Perspectives to each other—they operate independently during generation.

---

## 8. Non-Goals

- **No collaboration features.** Single-user system in v0. `owner_id` field exists for future multi-user but is unused.

- **No external data fetching.** All content is user-provided or extracted from Perspectives. No web scraping, API calls, or database lookups beyond the REFLEXIVE database.

- **No dashboards or visualizations.** Structured text output and scores only. No charts, graphs, or interactive UIs beyond basic CRUD.

- **No user-defined Lenses.** Only the five system-defined Lenses (`analytical`, `adversarial`, `historical_analogy`, `stakeholder_impact`, `premortem`).

- **No automatic cross-Case learning.** Cases are independent. No automatic pattern detection or claim reuse across Cases.

- **No RBAC or permissions.** Single-user system. `owner_id` exists but is nullable and unused in v0.

- **No distributed systems.** Single process, single database. No queues, workers, or microservices.

- **No real-time updates.** Polling or explicit refresh required. No WebSockets or server-sent events.

- **No version control for Cases.** Cases are versioned via `analyses.sequence_number` but Case itself is not versioned.

- **No export/import.** No serialization format for Cases or bulk operations.

---

## 9. Worked Examples

### Example 1: Strategic Acquisition Decision

**Case:** "Should we acquire Company X?"

**Stimulus:** `stimulus_type = 'decision_request'`, `stimulus_content = 'Should we acquire Company X for $500M?'`

**Context:** `domain = 'M&A'`, `key_entities = ['Company X', 'Our Company', 'Market Competitors']`, `assumptions_initial = ['Market conditions stable', 'Regulatory approval likely']`

**Analysis:** `sequence_number = 1`, runs all 5 Lenses in parallel.

**Perspectives:**
- `analytical`: Extracts Claims: "Company X revenue growing 15% YoY" (factual), "Acquisition creates market synergies" (inferential), "ROI exceeds hurdle rate" (evaluative).
- `adversarial`: Extracts Claims: "Integration risks are high" (risk), "Cultural mismatch likely" (evaluative), "Overpayment risk exists" (risk).
- `historical_analogy`: Extracts Claims: "Similar acquisitions in 2019 had 60% success rate" (factual), "Integration failures correlated with size mismatch" (inferential).
- `stakeholder_impact`: Extracts Claims: "Employees face job uncertainty" (factual), "Shareholders benefit from synergies" (evaluative).
- `premortem`: Extracts Claims: "Failure likely due to integration delays" (predictive), "Regulatory rejection possible" (risk).

**Claims:** 15 total Claims extracted. Some Claims link via `claim_claims`: "Acquisition creates synergies" `supports` "ROI exceeds hurdle rate". "Integration risks are high" `contradicts` "Acquisition creates synergies".

**Decision:** Created separately: `statement = 'Acquire Company X for $500M'`, linked to Case via `decision_cases`.

**Outcome:** Created with Decision: `status = 'unknown'`. Later updated via `outcome_event`: `event_type = 'status_change'`, `content = 'Acquisition completed'`, Outcome status → `success`.

**Synthesis:** Computes convergence (Lenses agree on revenue growth claim), divergence (disagreement on integration risk), `confidence_score = 0.72` (high agreement, strong evidence).

---

### Example 2: Research Assessment with Unknowns

**Case:** "What is the impact of Policy Y on Group Z?"

**Stimulus:** `stimulus_type = 'assessment_request'`, `stimulus_content = 'Assess impact of Policy Y on Group Z'`

**Analysis:** Runs 5 Lenses.

**Unknowns:** Created during Perspective extraction:
- "Exact size of Group Z population" (`status = 'identified'`)
- "Baseline metrics before Policy Y" (`status = 'identified'`)

**Claims:** Some Claims have `evidence_status = 'unsupported'`:
- "Policy Y reduces costs by 20%" (`evidence_status = 'unsupported'`, `review_by = created_at + 30 days`)

**Tests:** Created to resolve Unknowns:
- `description = 'Survey Group Z to determine population size'`, `target_type = 'unknown'`, `target_id = <unknown_id>`
- `description = 'Retrieve historical data from database'`, `target_type = 'unknown'`, `target_id = <unknown_id>`

**Evidence:** Added later:
- `content = 'Group Z population: 15,000 (from survey)'`, links to Unknown via Test completion.
- `content = 'Baseline cost: $2M/month (from database)'`, links to Claim "Policy Y reduces costs by 20%".

**Synthesis:** `confidence_score = 0.45` (low due to unsupported Claims and unresolved Unknowns).

---

### Example 3: Policy Scenario with Constraints and Risks

**Case:** "Should we implement Policy Y?"

**Stimulus:** `stimulus_type = 'decision_request'`

**Constraints:** Created during analysis:
- `type = 'regulatory'`, `description = 'Must comply with GDPR'`
- `type = 'temporal'`, `description = 'Implementation must complete within 6 months'`
- `type = 'resource'`, `description = 'Budget limit: $1M'`

**Risks:** Extracted from Perspectives:
- `description = 'Policy Y may violate GDPR if not implemented carefully'`, `severity = 'high'`, `likelihood = 'possible'`
- `description = 'Budget overrun likely given complexity'`, `severity = 'medium'`, `likelihood = 'likely'`

**Claims:** Links to Constraints and Risks:
- "Policy Y complies with GDPR" (`category = 'factual'`) links to Constraint "Must comply with GDPR".
- "Budget overrun likely" (`category = 'predictive'`) links to Risk "Budget overrun likely".

**Decision:** `statement = 'Implement Policy Y with GDPR compliance measures'`, `state = 'adopted'`.

**Outcome:** `status = 'unknown'` initially. Later: `status = 'partial_success'` via `outcome_event`: "Policy implemented but 2 months late and $200K over budget".

---

### Example 4: Case with Predecessor

**Case A:** "Should we launch Product X?" (completed Analysis, Decision adopted, Outcome = `success`)

**Case B:** "Should we scale Product X to Region Y?" (new Case)

**Predecessor Link:** `case_predecessors`: `case_id = <Case B>`, `predecessor_case_id = <Case A>`, `relationship_type = 'evolves'`

**Context B:** References Case A: `relevant_history = 'Product X launched successfully in Region A (see Case A)'`

**Claims:** Case B Claims can reference Case A Claims via `claim_claims`:
- Case B Claim: "Product X is proven in Region A" `depends_on` Case A Claim: "Product X launch succeeded"

**Analysis B:** Uses historical_analogy Lens which references Case A as historical precedent.

**Synthesis B:** Higher `confidence_score` due to predecessor evidence: `confidence_score = 0.78`.

---

### Example 5: Failed Analysis with Partial Results

**Case:** "Should we enter Market Z?"

**Analysis:** `state = 'running'`, starts all 5 Lenses in parallel.

**Perspectives:**
- `analytical`: `state = 'completed'`, extracts 8 Claims.
- `adversarial`: `state = 'completed'`, extracts 6 Claims.
- `historical_analogy`: `state = 'failed'` (timeout after 45s, 2 retries exhausted).
- `stakeholder_impact`: `state = 'completed'`, extracts 5 Claims.
- `premortem`: `state = 'failed'` (unparseable JSON response, 2 retries exhausted).

**Analysis State:** `state = 'partial'` (3 of 5 Perspectives completed).

**Synthesis:** Still computed from 3 completed Perspectives:
- `convergence_points`: Claims where analytical, adversarial, and stakeholder_impact agree.
- `divergence_points`: Claims where they disagree.
- `confidence_score = 0.58` (lower due to missing Lenses, but still computed).

**Trace:** Both failed Perspectives have Traces with `error_state = 'timeout'` and `error_state = 'unparseable_response'` respectively.

**Partial Results Preserved:** 19 Claims, 12 Evidence items, 3 Risks extracted and stored. Analysis marked `partial` but usable.

---

# ARTIFACT 02 — Architecture Decision Record — v0.1.0

## ADR-001: Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Runtime | Node.js 20 + TypeScript | Mature ecosystem, strong Postgres support, type safety reduces errors. |
| Database | Postgres 16 | ACID guarantees, jsonb for flexible structured data, excellent performance. |
| API Framework | Express.js or Fastify | Minimal overhead, standard HTTP patterns, easy to reason about. |
| Migration Tool | node-pg-migrate | Versioned migrations, rollback support, integrates with Node.js workflow. |
| Deployment | Docker Compose | Single-machine deployment, Orbstack-compatible, reproducible environments. |
| UUID Generation | pgcrypto (gen_random_uuid()) | Native Postgres function, no extension dependency, standard UUID v4. |

**Tradeoffs:**
- Node.js: Single-threaded event loop limits CPU-bound work, but Lens calls are I/O-bound (LLM API calls), so acceptable.
- Postgres 16: Overkill for v0 scale, but provides future-proofing for jsonb queries and potential pgvector integration.
- Docker Compose: Not production-grade for multi-machine, but sufficient for v0 single-machine constraint.

---

## ADR-002: Determinism Boundary

| Component | Deterministic? | Rationale |
|-----------|----------------|-----------|
| Lens prompt generation | No | LLM-generated prompts (though templates are deterministic). |
| Lens API calls | No | LLM responses are non-deterministic. |
| Perspective extraction | Yes | Structured parsing of LLM JSON responses (deterministic extraction logic). |
| Claim extraction | Yes | Rule-based extraction from Perspective `raw_output` jsonb. |
| Evidence extraction | Yes | Rule-based extraction from Perspective `raw_output` jsonb. |
| Convergence detection | Yes | Set intersection of Claim IDs across Perspectives (deterministic). |
| Divergence detection | Yes | Set difference of Claim IDs across Perspectives (deterministic). |
| Confidence score | Yes | Formula: `(inter_lens_agreement * 0.6) + (evidential_density * 0.4)` where both are computed from structured data. |
| Synthesis summary | No (optional) | If natural-language summary is generated, it uses LLM and is flagged `llm_generated = true`. Default: no summary, scores only. |
| Temporal staleness flags | Yes | `as_of < NOW() - INTERVAL '90 days'` is deterministic. |
| Outcome status updates | Yes | Deterministic state machine transitions based on `outcome_event` records. |

**Enforcement:**
- Synthesis computation path has zero LLM calls. All inputs are structured jsonb from Perspectives.
- If Synthesis summary is added later, it must be clearly separated (different function, different field, `llm_generated` flag).

---

## ADR-003: Storage Strategy

**Normalized Tables (default):**
- All entities (Cases, Analyses, Perspectives, Claims, Evidence, Decisions, Outcomes) use normalized tables.
- Foreign keys enforce referential integrity.
- Enums enforce domain constraints.

**jsonb Usage (exceptions only):**

| Field | Entity | Rationale |
|-------|--------|-----------|
| `key_entities` | Context | Variable-length array of entity descriptions. No queries filter by individual entity. |
| `assumptions_initial` | Context | Variable-length array of assumption text. No queries filter by individual assumption. |
| `confidence_breakdown` | Analysis | Per-lens confidence contributions: `{lens_id: confidence_score}`. Queried for display only, not filtered. |
| `convergence_points` | Synthesis | Array of Claim IDs where lenses agree. Computed once, displayed as-is. No individual Claim queries. |
| `divergence_points` | Synthesis | Array of Claim IDs where lenses disagree. Computed once, displayed as-is. No individual Claim queries. |
| `raw_output` | Perspective | Full LLM JSON response. Stored for debugging/reproducibility. Parsed once into Claims/Evidence, then rarely queried. |
| `request_payload` | Trace | Full LLM API request. Immutable, queried for debugging only. |
| `response_payload` | Trace | Full LLM API response. Immutable, queried for debugging only. |
| `model_parameters` | Trace | LLM parameters object. Display/debugging only. |
| `metadata` | outcome_event | Variable event-specific data. No queries filter by metadata contents. |
| `findings` | Evaluation | Structured evaluation results. Display only, no filtering. |

**Rules:**
1. Use normalized tables if field is queried/filtered/indexed.
2. Use jsonb if field is variable-length, rarely queried, or display-only.
3. Never use jsonb for foreign key relationships (use join tables).
4. Never use jsonb for fields that affect Synthesis computation (use normalized Claims/Evidence).

---

## ADR-004: Prompt Versioning Doctrine

**Prompts are infrastructure, not content.**

**Storage:**
- Prompts are stored in database table `lens_prompts` (not shown in Artifact 01 but implied by `lens.prompt_hash`).
- Each prompt version has: `id`, `lens_id`, `version`, `content`, `content_hash` (SHA-256), `created_at`.
- `lens.prompt_hash` references `lens_prompts.content_hash`.

**Versioning:**
- Prompt changes create new `lens_prompts` record with incremented `version`.
- Old prompts are never deleted or mutated (immutable).
- `lens.prompt_hash` points to active prompt version.

**Traceability:**
- `traces.prompt_hash` stores the exact prompt hash used for that Lens call.
- Reproducibility: Given a Trace, can reconstruct exact prompt via `lens_prompts` lookup.

**Rationale:**
- Prompts are code—they affect system behavior. Versioning enables rollback, A/B testing, and debugging.
- Content-hashing ensures integrity and enables deduplication.
- Immutability guarantees historical Traces remain reproducible.

---

## ADR-005: Failure Posture

**Single Lens Timeout:**
- After 45s, mark Perspective `state = 'failed'`, create Trace with `error_state = 'timeout'`.
- Retry up to 2 additional attempts (total 3 attempts) with exponential backoff: 5s, 10s.
- If all retries fail, Perspective remains `failed`, Analysis continues with other Lenses.

**Single Lens Unparseable Response:**
- If JSON parsing fails or schema validation fails, mark Perspective `state = 'failed'`, create Trace with `error_state = 'unparseable_response'`.
- Retry up to 2 additional attempts with same prompt.
- If all retries fail, Perspective remains `failed`, Analysis continues.

**Multiple Lens Failures:**
- If 2+ Lenses fail but 1+ succeed, mark Analysis `state = 'partial'`.
- Preserve all successful Perspective outputs (Claims, Evidence, etc.).
- Compute Synthesis from successful Perspectives only.
- `confidence_score` may be lower due to missing Lenses, but still computed.

**All Lenses Fail:**
- Mark Analysis `state = 'failed'`.
- No Synthesis created.
- All Traces preserved with error states.
- Case remains `active`—user can retry Analysis.

**Retry Policy:**
- Max 3 attempts per Lens (initial + 2 retries).
- Backoff: 5s, 10s (exponential).
- Retries only on timeout or unparseable response (not on LLM errors like rate limits—those fail immediately).

**Partial Results:**
- Partial Analyses preserve all extracted Claims, Evidence, Unknowns, Risks, Constraints, Tests.
- Synthesis is computed if at least 1 Perspective succeeded.
- User can see which Lenses failed via `perspectives.state` and `traces.error_state`.

---

## ADR-006: Latency Budget

**Per-Lens Limit:**
- 45 seconds maximum per Lens API call (enforced by timeout).
- Includes: prompt construction, LLM API call, response parsing, extraction.

**Parallel Execution:**
- All active Lenses execute in parallel (Promise.all or equivalent).
- Total wall-clock time for Analysis = max(Lens latencies) + overhead (~2s for extraction/synthesis).

**Total Analysis Budget:**
- Best case: ~47s (45s Lens + 2s overhead).
- Worst case: ~47s (same, since parallel).
- If retries occur: up to 3x per Lens, but still parallel across Lenses.

**Background Jobs:**
- Staleness detection: runs daily, < 60s total per Analysis check.
- Synthesis computation: < 5s for typical Analysis (deterministic, no LLM calls).

**Enforcement:**
- HTTP request timeout: 60s (allows Analysis to complete in normal case).
- Lens timeout: 45s (hard limit, enforced by API client).
- Background job timeout: 60s (staleness check).

---

## ADR-007: Schema Migration Strategy

**Tool:** `node-pg-migrate`

**Versioning Convention:**
- Filenames: `YYYYMMDDHHMMSS-description.sql`
- Example: `20260207120000-create-reflexive-schema.sql`

**Migration Structure:**
- Up migration: CREATE TABLE, ALTER TABLE, etc.
- Down migration: DROP TABLE, ALTER TABLE (reverse), etc.
- All migrations are reversible (down migration required).

**Versioning:**
- Schema version stored in `schema_migrations` table (managed by node-pg-migrate).
- Application checks schema version on startup, fails if mismatch.

**Rationale:**
- `node-pg-migrate` is Node.js-native, integrates with TypeScript, supports rollback.
- Timestamp-based versioning avoids merge conflicts.
- Reversible migrations enable safe rollbacks during development.

---

## ADR-008: Audit & Traceability

**Immutable Entities:**
- `traces`: No UPDATE or DELETE. Traces are append-only logs of Lens calls.
- `outcome_events`: No UPDATE or DELETE. Events are append-only logs of Outcome changes.

**Append-Only Entities:**
- `cases`: UPDATE allowed (state changes, title updates), DELETE prohibited (archive only).
- `analyses`: UPDATE allowed (state changes), DELETE prohibited.
- `perspectives`: UPDATE allowed (state changes), DELETE prohibited.
- `claims`: UPDATE allowed (evidence_status, valid_until, possibly_stale), DELETE prohibited.
- `evidence_items`: UPDATE allowed (possibly_stale, valid_until), DELETE prohibited.
- `decisions`: UPDATE allowed (state changes), DELETE prohibited.
- `outcomes`: UPDATE allowed (status, description), DELETE prohibited.

**Mutable Entities (with conditions):**
- `contexts`: UPDATE allowed (domain, key_entities, etc.), DELETE prohibited (Case must have Context).
- `syntheses`: UPDATE prohibited after `analysis.completed_at` is set (frozen once Analysis completes).
- `evaluations`: UPDATE prohibited (evaluations are point-in-time snapshots).

**Reproducibility:**
- Every Trace stores: `prompt_hash`, `model_name`, `model_parameters`, `request_payload`, `response_payload`.
- Given a Trace, can reconstruct exact Lens call (prompt lookup via `prompt_hash`, model params, request/response).
- Traces are never mutated, ensuring historical Analyses remain reproducible.

**Enforcement:**
- Application-level policies (no DELETE on traces, outcome_events).
- Database-level: No CASCADE DELETE on critical relationships (prevents accidental deletion).
- Soft deletes: Cases use `archived_at` instead of DELETE.

---

# ARTIFACT 03 — Data Schema (Postgres 16 DDL) — v0.1.0

```sql
-- REFLEXIVE Schema v0.1.0
-- Postgres 16 DDL
-- Migration tool: node-pg-migrate

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum Types
CREATE TYPE case_state AS ENUM ('draft', 'active', 'archived');
CREATE TYPE stimulus_type AS ENUM ('decision_request', 'assessment_request', 'research_question', 'problem_statement');
CREATE TYPE analysis_state AS ENUM ('pending', 'running', 'completed', 'failed', 'partial');
CREATE TYPE perspective_state AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE lens_orientation AS ENUM ('convergent', 'divergent', 'orthogonal');
CREATE TYPE claim_category AS ENUM ('factual', 'inferential', 'evaluative', 'predictive', 'assumption');
CREATE TYPE evidence_status AS ENUM ('supported', 'unsupported', 'contested', 'superseded');
CREATE TYPE support_type AS ENUM ('supports', 'undermines', 'contextualizes');
CREATE TYPE claim_relationship_type AS ENUM ('supports', 'contradicts', 'refines', 'depends_on');
CREATE TYPE decision_state AS ENUM ('draft', 'proposed', 'adopted', 'rejected', 'superseded');
CREATE TYPE outcome_status AS ENUM ('unknown', 'success', 'partial_success', 'failure', 'inconclusive');
CREATE TYPE outcome_event_type AS ENUM ('status_change', 'observation', 'measurement', 'correction');
CREATE TYPE source_type AS ENUM ('document', 'measurement', 'citation', 'testimony', 'observation');
CREATE TYPE unknown_status AS ENUM ('identified', 'resolved', 'deferred');
CREATE TYPE risk_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE risk_likelihood AS ENUM ('unlikely', 'possible', 'likely', 'very_likely');
CREATE TYPE constraint_type AS ENUM ('resource', 'temporal', 'regulatory', 'technical', 'organizational');
CREATE TYPE test_status AS ENUM ('proposed', 'pending', 'completed', 'failed', 'cancelled');
CREATE TYPE target_type AS ENUM ('unknown', 'claim', 'risk');
CREATE TYPE eval_type AS ENUM ('accuracy', 'calibration', 'outcome_alignment', 'process_quality');
CREATE TYPE eval_target_type AS ENUM ('case', 'analysis', 'decision', 'outcome');
CREATE TYPE predecessor_relationship_type AS ENUM ('evolves', 'references', 'supersedes');

-- Tables
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID,
    title TEXT NOT NULL,
    stimulus_type stimulus_type NOT NULL,
    stimulus_content TEXT NOT NULL,
    state case_state NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMP
);

CREATE TABLE contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL UNIQUE REFERENCES cases(id) ON DELETE RESTRICT,
    domain TEXT,
    key_entities JSONB,
    relevant_history TEXT,
    assumptions_initial JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE lenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    version TEXT NOT NULL,
    orientation lens_orientation NOT NULL,
    analytical_angle TEXT NOT NULL,
    prompt_hash TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(name, version)
);

CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    sequence_number INTEGER NOT NULL CHECK (sequence_number >= 1),
    state analysis_state NOT NULL DEFAULT 'pending',
    confidence_score FLOAT CHECK (confidence_score IS NULL OR (confidence_score >= 0.0 AND confidence_score <= 1.0)),
    confidence_breakdown JSONB,
    -- confidence_breakdown schema: {lens_id: confidence_score}
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(case_id, sequence_number)
);

CREATE TABLE perspectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE RESTRICT,
    lens_id UUID NOT NULL REFERENCES lenses(id) ON DELETE RESTRICT,
    lens_version TEXT NOT NULL,
    state perspective_state NOT NULL DEFAULT 'pending',
    raw_output JSONB,
    extracted_claims_count INTEGER DEFAULT 0,
    extracted_evidence_count INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perspective_id UUID REFERENCES perspectives(id) ON DELETE SET NULL,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    category claim_category NOT NULL,
    content TEXT NOT NULL,
    confidence_weight FLOAT NOT NULL CHECK (confidence_weight >= 0.0 AND confidence_weight <= 1.0),
    evidence_status evidence_status NOT NULL DEFAULT 'supported',
    review_by TIMESTAMP,
    as_of TIMESTAMP NOT NULL DEFAULT NOW(),
    valid_from TIMESTAMP NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMP,
    possibly_stale BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (valid_until IS NULL OR valid_until >= valid_from),
    CHECK (evidence_status != 'unsupported' OR review_by IS NOT NULL)
);

CREATE TABLE evidence_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    source TEXT,
    source_type source_type NOT NULL,
    as_of TIMESTAMP NOT NULL DEFAULT NOW(),
    valid_from TIMESTAMP NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMP,
    possibly_stale BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

CREATE TABLE decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement TEXT NOT NULL,
    state decision_state NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    adopted_at TIMESTAMP
);

CREATE TABLE outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL UNIQUE REFERENCES decisions(id) ON DELETE RESTRICT,
    status outcome_status NOT NULL DEFAULT 'unknown',
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE outcome_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outcome_id UUID NOT NULL REFERENCES outcomes(id) ON DELETE RESTRICT,
    sequence_number INTEGER NOT NULL CHECK (sequence_number >= 1),
    event_type outcome_event_type NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(outcome_id, sequence_number)
);

CREATE TABLE unknowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    status unknown_status NOT NULL DEFAULT 'identified',
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    severity risk_severity NOT NULL,
    likelihood risk_likelihood NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE constraints_ (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    type constraint_type NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    status test_status NOT NULL DEFAULT 'proposed',
    result TEXT,
    as_of TIMESTAMP,
    valid_from TIMESTAMP NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

CREATE TABLE syntheses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL UNIQUE REFERENCES analyses(id) ON DELETE RESTRICT,
    confidence_score FLOAT CHECK (confidence_score IS NULL OR (confidence_score >= 0.0 AND confidence_score <= 1.0)),
    convergence_points JSONB NOT NULL DEFAULT '[]',
    -- convergence_points schema: [claim_id UUID]
    divergence_points JSONB NOT NULL DEFAULT '[]',
    -- divergence_points schema: [claim_id UUID]
    summary TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE traces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perspective_id UUID NOT NULL REFERENCES perspectives(id) ON DELETE RESTRICT,
    lens_id UUID NOT NULL REFERENCES lenses(id) ON DELETE RESTRICT,
    prompt_hash TEXT NOT NULL,
    model_name TEXT NOT NULL,
    model_parameters JSONB NOT NULL,
    -- model_parameters schema: {temperature: float, max_tokens: integer, ...}
    request_payload JSONB NOT NULL,
    response_payload JSONB NOT NULL,
    latency_ms INTEGER NOT NULL,
    error_state TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type eval_target_type NOT NULL,
    target_id UUID NOT NULL,
    type eval_type NOT NULL,
    findings JSONB NOT NULL,
    -- findings schema: variable, evaluation-specific
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Link Tables
CREATE TABLE decision_claims (
    decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE RESTRICT,
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (decision_id, claim_id)
);

CREATE TABLE claim_claims (
    claim_from_id UUID NOT NULL REFERENCES claims(id) ON DELETE RESTRICT,
    claim_to_id UUID NOT NULL REFERENCES claims(id) ON DELETE RESTRICT,
    relationship_type claim_relationship_type NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (claim_from_id, claim_to_id),
    CHECK (claim_from_id != claim_to_id)
);

CREATE TABLE claim_evidence (
    claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE RESTRICT,
    evidence_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE RESTRICT,
    support_type support_type NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (claim_id, evidence_id)
);

CREATE TABLE decision_cases (
    decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE RESTRICT,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (decision_id, case_id)
);

CREATE TABLE test_targets (
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE RESTRICT,
    target_type target_type NOT NULL,
    target_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (test_id, target_type, target_id)
);

CREATE TABLE case_predecessors (
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    predecessor_case_id UUID NOT NULL REFERENCES cases(id) ON DELETE RESTRICT,
    relationship_type predecessor_relationship_type NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (case_id, predecessor_case_id),
    CHECK (case_id != predecessor_case_id)
);

-- Indexes
CREATE INDEX idx_cases_state ON cases(state);
CREATE INDEX idx_cases_owner_id ON cases(owner_id);
CREATE INDEX idx_cases_created_at ON cases(created_at);

CREATE INDEX idx_contexts_case_id ON contexts(case_id);

CREATE INDEX idx_analyses_case_id ON analyses(case_id);
CREATE INDEX idx_analyses_state ON analyses(state);
CREATE INDEX idx_analyses_created_at ON analyses(created_at);

CREATE INDEX idx_perspectives_analysis_id ON perspectives(analysis_id);
CREATE INDEX idx_perspectives_lens_id ON perspectives(lens_id);
CREATE INDEX idx_perspectives_lens_version ON perspectives(lens_id, lens_version);
CREATE INDEX idx_perspectives_state ON perspectives(state);

CREATE INDEX idx_claims_case_id ON claims(case_id);
CREATE INDEX idx_claims_perspective_id ON claims(perspective_id);
CREATE INDEX idx_claims_category ON claims(category);
CREATE INDEX idx_claims_evidence_status ON claims(evidence_status);
CREATE INDEX idx_claims_as_of ON claims(as_of);
CREATE INDEX idx_claims_possibly_stale ON claims(possibly_stale);

CREATE INDEX idx_evidence_items_as_of ON evidence_items(as_of);
CREATE INDEX idx_evidence_items_possibly_stale ON evidence_items(possibly_stale);

CREATE INDEX idx_decisions_state ON decisions(state);
CREATE INDEX idx_decisions_created_at ON decisions(created_at);

CREATE INDEX idx_outcomes_decision_id ON outcomes(decision_id);
CREATE INDEX idx_outcomes_status ON outcomes(status);

CREATE INDEX idx_outcome_events_outcome_id ON outcome_events(outcome_id);
CREATE INDEX idx_outcome_events_sequence ON outcome_events(outcome_id, sequence_number);

CREATE INDEX idx_unknowns_case_id ON unknowns(case_id);
CREATE INDEX idx_unknowns_status ON unknowns(status);

CREATE INDEX idx_risks_case_id ON risks(case_id);
CREATE INDEX idx_risks_severity ON risks(severity);

CREATE INDEX idx_constraints_case_id ON constraints_(case_id);

CREATE INDEX idx_tests_case_id ON tests(case_id);
CREATE INDEX idx_tests_status ON tests(status);

CREATE INDEX idx_syntheses_analysis_id ON syntheses(analysis_id);

CREATE INDEX idx_traces_perspective_id ON traces(perspective_id);
CREATE INDEX idx_traces_lens_id ON traces(lens_id);
CREATE INDEX idx_traces_prompt_hash ON traces(prompt_hash);
CREATE INDEX idx_traces_created_at ON traces(created_at);

CREATE INDEX idx_evaluations_target ON evaluations(target_type, target_id);

CREATE INDEX idx_decision_claims_decision_id ON decision_claims(decision_id);
CREATE INDEX idx_decision_claims_claim_id ON decision_claims(claim_id);

CREATE INDEX idx_claim_claims_from ON claim_claims(claim_from_id);
CREATE INDEX idx_claim_claims_to ON claim_claims(claim_to_id);

CREATE INDEX idx_claim_evidence_claim_id ON claim_evidence(claim_id);
CREATE INDEX idx_claim_evidence_evidence_id ON claim_evidence(evidence_id);

CREATE INDEX idx_decision_cases_decision_id ON decision_cases(decision_id);
CREATE INDEX idx_decision_cases_case_id ON decision_cases(case_id);

CREATE INDEX idx_test_targets_test_id ON test_targets(test_id);
CREATE INDEX idx_test_targets_target ON test_targets(target_type, target_id);

CREATE INDEX idx_case_predecessors_case_id ON case_predecessors(case_id);
CREATE INDEX idx_case_predecessors_predecessor ON case_predecessors(predecessor_case_id);

-- Trigger: Ensure Outcome created when Decision is inserted
-- Note: Application-level enforcement recommended (transactional), but trigger provided as safety net
CREATE OR REPLACE FUNCTION ensure_outcome_on_decision()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO outcomes (decision_id, status)
    VALUES (NEW.id, 'unknown')
    ON CONFLICT (decision_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_outcome_on_decision
    AFTER INSERT ON decisions
    FOR EACH ROW
    EXECUTE FUNCTION ensure_outcome_on_decision();

-- Trigger: Update cases.updated_at on update
CREATE OR REPLACE FUNCTION update_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION update_cases_updated_at();

-- Trigger: Update outcomes.updated_at on update
CREATE OR REPLACE FUNCTION update_outcomes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_outcomes_updated_at
    BEFORE UPDATE ON outcomes
    FOR EACH ROW
    EXECUTE FUNCTION update_outcomes_updated_at();
```

## Schema Notes

**Invariants Enforced at Schema Level:**
- Confidence scores in [0.0, 1.0] range (CHECK constraints on `analyses.confidence_score`, `syntheses.confidence_score`, `claims.confidence_weight`).
- `valid_until >= valid_from` (CHECK constraints on Claims, Evidence, Tests).
- `review_by` non-null when `evidence_status = 'unsupported'` (CHECK constraint on Claims).
- `sequence_number >= 1` (CHECK constraints on Analyses, outcome_events).
- Self-referential prevention (`claim_claims`, `case_predecessors` CHECK constraints).
- Unique constraints: `contexts.case_id`, `outcomes.decision_id`, `syntheses.analysis_id`, `analyses(case_id, sequence_number)`, `outcome_events(outcome_id, sequence_number)`.

**Invariants Enforced at Application Level:**
- Every Decision has an Outcome (trigger provided as safety net, but application should create in same transaction).
- No DELETE on `traces`, `outcome_events` (application-level policy, no CASCADE DELETE).
- Cases never deleted (archive only, application-level policy).
- Every Analysis has exactly one Perspective per active Lens (application logic, dynamic Lens set).
- Claims without evidence are time-bounded (`review_by <= created_at + 30 days`, application-level validation).

**Postgres-Specific Features:**
- `gen_random_uuid()` for UUID generation (pgcrypto extension, but function is built-in Postgres 13+).
- JSONB for flexible structured data (key_entities, confidence_breakdown, convergence_points, etc.).
- CHECK constraints for domain validation.
- Triggers for automatic timestamp updates and Outcome creation safety net.

**Migration Tool Assumption:**
Designed for use with `node-pg-migrate`. Timestamp-based versioning convention: `YYYYMMDDHHMMSS-description.sql`. All migrations should include reversible DOWN migrations.
