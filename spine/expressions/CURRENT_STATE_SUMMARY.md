# Omega Spine Expressions 1-6: Current State Summary

## 1) Expression Contracts

### Expression 1: Decision Policy
**Function:** `decision_policy(observation: dict) -> dict`

**Required Input Keys:**
- `required_keys`: list[str]
- `values`: dict[str, any]
- `uncertainty`: dict[str, bool]

**Output Schema:**
- `action`: "refuse" | "proceed"
- `reason`: str
- `missing_keys`: list[str]
- `uncertain_keys`: list[str]

**Early-Stop Rules:** Refuses if observation not dict, missing top-level keys, missing/uncertain required keys.

---

### Expression 2: Bounded Choice Policy
**Function:** `bounded_choice_policy(observation: dict) -> dict`

**Required Input Keys:**
- `required_keys`: list[str]
- `values`: dict[str, any]
- `uncertainty`: dict[str, bool]
- `allowed_actions`: list[str]
- `preference_order`: list[str]

**Output Schema:**
- `action`: str (chosen action) | "refuse"
- `reason`: str
- `chosen_action`: str | None

**Early-Stop Rules:** Refuses if validation fails or no overlap between preference_order and allowed_actions.

---

### Expression 3: Triage Gate
**Function:** `triage_gate(observation: dict) -> dict`

**Required Input Keys:**
- `required_keys`: list[str]
- `values`: dict[str, any]
- `uncertainty`: dict[str, bool]
- `risk_score`: float [0.0, 1.0]
- `confidence`: float [0.0, 1.0]

**Output Schema:**
- `action`: "refuse" | "safe_mode" | "proceed"
- `reason`: str
- `missing_keys`: list[str]
- `uncertain_keys`: list[str]

**Early-Stop Rules:** Routes to safe_mode if risk_score >= 0.7 or confidence < 0.6. Refuses on validation failure.

---

### Expression 4: Action Schema Gate
**Function:** `action_schema_gate(observation: dict) -> dict`

**Required Input Keys:**
- `proposed_action`: dict
- `allowed_action_keys`: list[str]
- `required_action_keys`: list[str]
- `action_key_types`: dict[str, str]
- `action_value_ranges`: dict[str, [min, max]]
- `required_keys`: list[str]
- `values`: dict
- `uncertainty`: dict[str, bool]

**Output Schema:**
- `action`: "refuse" | "accept"
- `reason`: str
- `violations`: list[str]

**Early-Stop Rules:** Refuses on any schema violation.

---

### Expression 5: Decision Trace Builder
**Function:** `decision_trace_builder(observation: dict) -> dict`

**Required Input Keys:**
- `observation`: dict (raw observation snapshot)
- `gate_results`: dict with gate_1, gate_2, gate_3, gate_4
- `final_disposition`: str
- `timestamp_utc`: str

**Optional Input Keys:**
- `spine_version`: str (defaults to "dev")
- `modules_used`: list[str]
- `inputs_present_keys`: list[str]

**Output Schema:**
- `trace_type`: "omega_decision_trace"
- `trace_version`: "1.0.0"
- `spine_version`: str
- `timestamp_utc`: str
- `final_disposition`: str
- `gates`: list[dict] (each with gate, action, reason)
- `observation_snapshot`: dict
- `reason`: str | None (None for success, str for error)
- `policy_limits`: list[str] (5 items)
- `audience_summary`: dict with clinician, exec, regulator
- `provenance`: dict with timestamp_utc, inputs_present_keys, modules_used

**Early-Stop Rules:** Returns error trace (refuse disposition) on validation failure.

---

### Expression 6: Spine Orchestrator
**Function:** `spine_orchestrator(payload: dict) -> dict`

**Required Input Keys:**
- All keys required by gates 1-4
- `timestamp_utc`: str

**Optional Input Keys:**
- `spine_version`: str (defaults to "dev")

**Output Schema:**
- `final_disposition`: "refuse" | "safe_mode" | "proceed"
- `gate_results`: dict with gate_1 through gate_4 results
- `trace`: output from decision_trace_builder

**Early-Stop Rules (Orchestrator):**
1. If payload not dict → immediate refuse, all gates skipped
2. If gate_1 returns "refuse" → stop, gates 2-4 skipped, final_disposition = "refuse"
3. If gate_2 returns "refuse" → stop, gates 3-4 skipped, final_disposition = "refuse"
4. If gate_3 returns "refuse" → stop, gate_4 skipped, final_disposition = "refuse"
5. If gate_3 returns "safe_mode" → skip gate_4, final_disposition = "safe_mode"
6. If all gates pass → final_disposition = "proceed"

---

## 2) Legibility & Trust Fields

**Confirmed:** All fields appear in BOTH success and error traces.

**Exact Keys:**
- `trace_version`: "1.0.0" (string)
- `spine_version`: str (from input or "dev")
- `policy_limits`: list[str] (5 items: standardized across all traces)
- `audience_summary`: dict with keys: `clinician`, `exec`, `regulator` (all strings)
- `provenance`: dict with keys: `timestamp_utc`, `inputs_present_keys`, `modules_used`

**Verification:** Schema consistent across success and error traces (same keys, same policy_limits count).

---

## 3) Schema Inconsistencies

**Status:** ✅ NONE DETECTED

**Previous Issues (Now Fixed):**
- ✅ `reason` field: Success traces now include `'reason': None` for consistency
- ✅ `policy_limits` count: All traces (success and error) now use full 5-item list

**Current State:** All traces have identical schema structure.

---

## 4) Proposed Patches

**Status:** ✅ NO PATCHES NEEDED

Schema is consistent. All Legibility & Trust fields present in both success and error traces.

---

## 5) Next Expression(s) for Simulation/Protocol Workflows

**Goal:** Support "simulation / protocol meaning → decision graph → stress test" while preserving:
- "no recommendations"
- "no autonomous decisions"

**Proposed Expressions:**

### Expression 7: Protocol Meaning Parser
**Function:** `protocol_meaning_parser(protocol_definition: dict, node_types: list[str]) -> dict`

**Purpose:** Parse protocol/simulation definitions into structured decision graph nodes without making recommendations.

**Inputs:**
- `protocol_definition`: dict (protocol/simulation spec)
- `node_types`: list[str] (allowed node types: decision, condition, action, terminal)

**Outputs:**
- `decision_graph`: dict with nodes and edges
- `parsed_nodes`: list[dict] (node_id, type, constraints, assumptions)
- `validation_errors`: list[str]

**Behavior:** Structures protocol into graph. Does NOT recommend paths or optimize.

---

### Expression 8: Decision Graph Validator
**Function:** `decision_graph_validator(decision_graph: dict, required_node_types: list[str], constraint_rules: dict) -> dict`

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
**Function:** `stress_test_scenario_generator(decision_graph: dict, stress_parameters: dict, scenario_count: int) -> dict`

**Purpose:** Generate stress test scenarios from decision graph without recommending outcomes.

**Inputs:**
- `decision_graph`: dict (validated)
- `stress_parameters`: dict (failure_modes, edge_cases, boundary_conditions)
- `scenario_count`: int

**Outputs:**
- `scenarios`: list[dict] (scenario_id, inputs, expected_path, assumptions)
- `coverage_metrics`: dict (nodes_covered, edges_covered, failure_modes_tested)

**Behavior:** Enumerates test scenarios. Does NOT execute or predict outcomes.

---

**Files to Create:**
1. `seventh_expression_protocol_meaning_parser.py`
2. `test_seventh_expression_protocol_meaning_parser.py`
3. `eighth_expression_decision_graph_validator.py`
4. `test_eighth_expression_decision_graph_validator.py`
5. `ninth_expression_stress_test_scenario_generator.py`
6. `test_ninth_expression_stress_test_scenario_generator.py`

**Integration:** Expressions 7-9 can be composed by Expression 6 (orchestrator) or run independently. They produce structured outputs (graphs, scenarios) but never recommend actions or predict outcomes.

---

## Summary

**Current State:** ✅ Expressions 1-6 complete, tested, and schema-consistent.

**Legibility & Trust:** ✅ All fields present in success and error traces.

**Schema Consistency:** ✅ No inconsistencies detected.

**Next Build Step:** Expressions 7-9 for simulation/protocol workflows (structure, validate, enumerate — no recommendations).





















































