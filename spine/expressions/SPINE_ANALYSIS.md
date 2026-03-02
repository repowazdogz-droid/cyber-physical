# Omega Spine Expressions 1-6: Analysis & Next Steps

## 1) Contract Summary (Inputs/Outputs)

### Expression 1: Decision Policy
**Function:** `decision_policy(observation: dict) -> dict`

**Inputs:**
- `required_keys`: list[str]
- `values`: dict[str, any]
- `uncertainty`: dict[str, bool]

**Outputs:**
- `action`: "refuse" | "proceed"
- `reason`: str
- `missing_keys`: list[str]
- `uncertain_keys`: list[str]

**Behavior:** Refuses if observation not dict, missing top-level keys, missing/uncertain required keys. Otherwise proceeds.

---

### Expression 2: Bounded Choice Policy
**Function:** `bounded_choice_policy(observation: dict) -> dict`

**Inputs:**
- `required_keys`: list[str]
- `values`: dict[str, any]
- `uncertainty`: dict[str, bool]
- `allowed_actions`: list[str]
- `preference_order`: list[str]

**Outputs:**
- `action`: str (chosen action) | "refuse"
- `reason`: str
- `chosen_action`: str | None

**Behavior:** Refuses if validation fails or no overlap between preference_order and allowed_actions. Otherwise chooses first preferred action that is allowed.

---

### Expression 3: Triage Gate
**Function:** `triage_gate(observation: dict) -> dict`

**Inputs:**
- `required_keys`: list[str]
- `values`: dict[str, any]
- `uncertainty`: dict[str, bool]
- `risk_score`: float [0.0, 1.0]
- `confidence`: float [0.0, 1.0]

**Outputs:**
- `action`: "refuse" | "safe_mode" | "proceed"
- `reason`: str
- `missing_keys`: list[str]
- `uncertain_keys`: list[str]

**Behavior:** Routes to safe_mode if risk_score >= 0.7 or confidence < 0.6. Otherwise proceeds. Refuses on validation failure.

---

### Expression 4: Action Schema Gate
**Function:** `action_schema_gate(observation: dict) -> dict`

**Inputs:**
- `proposed_action`: dict
- `allowed_action_keys`: list[str]
- `required_action_keys`: list[str]
- `action_key_types`: dict[str, str]
- `action_value_ranges`: dict[str, [min, max]]
- `required_keys`: list[str]
- `values`: dict
- `uncertainty`: dict[str, bool]

**Outputs:**
- `action`: "refuse" | "accept"
- `reason`: str
- `violations`: list[str]

**Behavior:** Validates proposed_action against schema. Refuses on any violation. Accepts if all constraints satisfied.

---

### Expression 5: Decision Trace Builder
**Function:** `decision_trace_builder(observation: dict) -> dict`

**Inputs:**
- `observation`: dict (raw observation snapshot)
- `gate_results`: dict with gate_1, gate_2, gate_3, gate_4
- `final_disposition`: str
- `timestamp_utc`: str
- `spine_version`: str (optional)
- `modules_used`: list[str] (optional)
- `inputs_present_keys`: list[str] (optional)

**Outputs:**
- `trace_type`: "omega_decision_trace"
- `trace_version`: "1.0.0"
- `spine_version`: str
- `timestamp_utc`: str
- `final_disposition`: str
- `gates`: list[dict]
- `observation_snapshot`: dict
- `policy_limits`: list[str]
- `audience_summary`: dict with clinician, exec, regulator
- `provenance`: dict with timestamp_utc, inputs_present_keys, modules_used
- `reason`: str (ERROR TRACES ONLY - inconsistency)

**Behavior:** Builds trace from gate results. Returns error trace with refuse disposition on validation failure.

---

### Expression 6: Spine Orchestrator
**Function:** `spine_orchestrator(payload: dict) -> dict`

**Inputs:**
- All keys required by gates 1-4
- `timestamp_utc`: str
- `spine_version`: str (optional, defaults to "dev")

**Outputs:**
- `final_disposition`: "refuse" | "safe_mode" | "proceed"
- `gate_results`: dict with gate_1 through gate_4 results
- `trace`: output from decision_trace_builder

**Behavior:** Composes gates 1-4 in sequence. Stops early on refusal or safe_mode. Always produces trace.

---

## 2) Legibility & Trust Fields

**Fields present in ALL traces (success + error):**
- `trace_version`: "1.0.0"
- `spine_version`: str (from input or "dev")
- `policy_limits`: list[str]
- `audience_summary`: dict with clinician, exec, regulator
- `provenance`: dict with timestamp_utc, inputs_present_keys, modules_used

**Confirmed:** All Legibility & Trust fields appear in both success and error traces.

---

## 3) Trace Schema Inconsistencies

### Issue 1: `reason` field
- **Success traces:** No `reason` field (reasoning embedded in gates)
- **Error traces:** Has `reason` field (explains validation failure)
- **Impact:** Schema inconsistency makes trace parsing non-deterministic

### Issue 2: `policy_limits` count
- **Success traces:** 5 limits (full set)
- **Error traces:** 2 limits (truncated set)
- **Impact:** Inconsistent policy disclosure

### Proposed Patch (minimal, no gate behavior change):

**File:** `fifth_expression_decision_trace_builder.py`

1. Add `reason: None` to success trace return (line ~405)
2. Standardize `policy_limits` to full 5-item list in all error traces

**Changes:**
- Success trace: Add `'reason': None` to maintain schema consistency
- Error traces: Replace truncated `policy_limits` with full 5-item list

**Status:** ✅ PATCH APPLIED - Schema now consistent across success and error traces

---

## 4) Next Expression(s) for Simulation/Protocol → Decision Graph → Stress Test

**Goal:** Support "simulation / protocol meaning → decision graph → stress test" while preserving "no recommendation" stance.

**Required Expressions:**

### Expression 7: Protocol Meaning Parser
**Purpose:** Parse protocol/simulation definitions into structured decision graph nodes without making recommendations.

**Inputs:**
- `protocol_definition`: dict (protocol/simulation spec)
- `node_types`: list[str] (allowed node types: decision, condition, action, terminal)

**Outputs:**
- `decision_graph`: dict with nodes and edges
- `parsed_nodes`: list[dict] (node_id, type, constraints, assumptions)
- `validation_errors`: list[str]

**Behavior:** Parses protocol into graph structure. Does NOT recommend paths or optimize. Only structures.

---

### Expression 8: Decision Graph Validator
**Purpose:** Validate decision graph structure and constraints without executing or recommending.

**Inputs:**
- `decision_graph`: dict (from Expression 7)
- `required_node_types`: list[str]
- `constraint_rules`: dict (validation rules)

**Outputs:**
- `is_valid`: bool
- `validation_errors`: list[str]
- `graph_metrics`: dict (node_count, edge_count, cycles_detected, etc.)

**Behavior:** Validates graph structure. Does NOT execute or recommend paths.

---

### Expression 9: Stress Test Scenario Generator
**Purpose:** Generate stress test scenarios from decision graph without recommending outcomes.

**Inputs:**
- `decision_graph`: dict (validated)
- `stress_parameters`: dict (failure_modes, edge_cases, boundary_conditions)
- `scenario_count`: int

**Outputs:**
- `scenarios`: list[dict] (scenario_id, inputs, expected_path, assumptions)
- `coverage_metrics`: dict (nodes_covered, edges_covered, failure_modes_tested)

**Behavior:** Generates test scenarios. Does NOT execute or predict outcomes. Only enumerates test cases.

---

**Files to create:**
1. `seventh_expression_protocol_meaning_parser.py`
2. `test_seventh_expression_protocol_meaning_parser.py`
3. `eighth_expression_decision_graph_validator.py`
4. `test_eighth_expression_decision_graph_validator.py`
5. `ninth_expression_stress_test_scenario_generator.py`
6. `test_ninth_expression_stress_test_scenario_generator.py`

**Integration:** Expressions 7-9 can be composed by Expression 6 (orchestrator) or run independently. They produce structured outputs (graphs, scenarios) but never recommend actions or predict outcomes.

---

## Summary

**Current State:** Expressions 1-6 complete with Legibility & Trust fields. Two minor schema inconsistencies identified.

**Immediate Fix:** Standardize trace schema (add `reason: None` to success, full `policy_limits` to errors).

**Next Phase:** Expressions 7-9 for simulation/protocol → decision graph → stress test, maintaining "no recommendation" stance.

