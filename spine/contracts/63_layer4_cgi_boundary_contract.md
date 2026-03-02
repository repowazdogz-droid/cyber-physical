# Contract 63: Layer-4 CGI Boundary Contract

**Status:** Active  
**Version:** 1.0  
**Date:** 2024-01-15

## 1) Definition

Layer 4 boundary is:
- the input normalization and call interface into Expressions 1–6
- the place where malformed inputs are rejected before execution

Layer 4 boundary is not:
- a decision maker
- a recommender
- a fixer of upstream intent

## 2) Canonical Entrypoints (Must Exist)

Two public entrypoints are supported. No other public entrypoints are allowed.

### Entrypoint 1: Direct Payload Path
```python
call_spine(payload: dict) -> dict
```
- Accepts a complete spine payload dictionary
- Returns orchestrator output (final_disposition, gate_results, trace)
- Does not mutate payload
- Does not validate payload structure (gates handle validation)

### Entrypoint 2: ProtocolGraph Path (CGI Path)
```python
call_spine_from_protocol_graph(
    protocol_graph: dict,
    *,
    known_facts: dict,
    uncertainty: dict,
    allowed_actions: list[str],
    preference_order: list[str],
    risk_score: float,
    confidence: float,
    proposed_action: dict,
    allowed_action_keys: list[str],
    required_action_keys: list[str],
    action_key_types: dict[str, str],
    action_value_ranges: dict[str, list],
    timestamp_utc: str,
    spine_version: str = "dev"
) -> dict
```
- Validates protocol_graph via Expression 7
- Adapts protocol_graph + facts to observation via Expression 8
- Builds payload via canonical constructor
- Returns orchestrator output
- If protocol_graph invalid: returns refusal output (no crash, no partial execution)

## 3) Canonical Constructor (Must Exist)

`build_spine_payload(...)` is the ONLY supported payload constructor.

Callers must not hand-craft payload dicts. All payloads must be constructed via:
```python
from spine_payload_builder import build_spine_payload

payload = build_spine_payload(
    required_keys=...,
    values=...,
    uncertainty=...,
    # ... all required fields
)
```

## 4) Required Payload Keys (Spine Payload Contract)

Layer 4 must provide these exact keys to Expression 6 (spine_orchestrator):

### Gate 1 Inputs
- `required_keys`: list[str]
- `values`: dict[str, any]
- `uncertainty`: dict[str, bool]

### Gate 2 Inputs
- `allowed_actions`: list[str]
- `preference_order`: list[str]

### Gate 3 Inputs
- `risk_score`: float (0.0 to 1.0)
- `confidence`: float (0.0 to 1.0)

### Gate 4 Inputs
- `proposed_action`: dict
- `allowed_action_keys`: list[str]
- `required_action_keys`: list[str]
- `action_key_types`: dict[str, str]
- `action_value_ranges`: dict[str, list] (for numeric keys only)

### Trace Metadata
- `timestamp_utc`: str (ISO-like string, no parsing required)
- `spine_version`: str (optional, defaults to "dev")

## 5) ProtocolGraph Invocation Rules (CGI Path)

When using `call_spine_from_protocol_graph`:

1. **Validation Required**: ProtocolGraph must be validated by Expression 7 (`protocol_graph_validator`) before use.

2. **Adapter Required**: Observation must be produced only by Expression 8 adapter (`protocol_graph_to_observation`). No hand-crafted observations.

3. **Refusal on Invalid Graph**: If Expression 7 refuses, Layer 4 must return a refusal output with:
   - `final_disposition: "refuse"`
   - `gate_results: {}`
   - `trace` with `final_disposition: "refuse"` and `reason: "protocol_graph invalid"`
   - No crash, no partial execution, no gate calls

## 6) Determinism & Conservatism

### Determinism Rules
- Same inputs => same outputs (no clocks, no randomness, no network calls)
- All timestamps must be provided by caller (no `datetime.now()`)
- No stateful behavior between calls

### Conservatism Rules
- Any missing/invalid structure => refuse (never "best effort")
- Empty or malformed inputs => deterministic refusal
- Unknown keys in payload => passed through (gates handle rejection)

## 7) Forbidden Behaviors

Layer 4 must not:
- change gate logic or override gate outputs
- infer missing facts
- add recommendations / "next best action"
- mutate caller inputs in-place
- silently coerce types (except explicit, documented adapter rules in Expression 8)
- add default values beyond those explicitly documented
- skip gates or reorder gate execution
- modify trace content after Expression 6 returns

## 8) Logging & Trace Handling

- Layer 4 may print a summary via `_trace_summary()` helper, but must never rewrite the trace.
- Trace returned from Expression 6 is authoritative.
- Layer 4 does not add, remove, or modify trace fields.
- Trace structure is defined by Expression 5 (decision_trace_builder).

## 9) Test Obligations (Must Remain Passing)

Layer 4 is considered valid only if:

1. **Expression Tests**: `run_all_expression_tests.py` passes (all 8 expressions)

2. **Layer-4 Nasty Cases**: `test_layer4_spine_entrypoint.py` passes with exact expected outcomes:
   - Missing required value → `final_disposition: "refuse"`
   - Required key uncertain → `final_disposition: "refuse"`
   - No overlap actions → `final_disposition: "refuse"`
   - High risk → `final_disposition: "safe_mode"`
   - Invalid action schema → `final_disposition: "refuse"`

3. **ProtocolGraph Path**: Invalid protocol graphs must refuse deterministically (no crashes, no partial execution)

4. **Entrypoint Demo**: `spine_entrypoint.py` demo runs without exceptions

## 10) Immutability

This contract changes only via explicit revision. No silent edits, no "clarifications" that change behavior.

---

**Authority:** This contract defines the Layer 4 boundary. All implementations must conform to these rules.

**Enforcement:** Layer 4 code must pass all test obligations (Section 9) to be considered valid.




















































