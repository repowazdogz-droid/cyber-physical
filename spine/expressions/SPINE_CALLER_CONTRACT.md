# Spine Caller Contract (Layer 4) — v0.1

This document defines the **only valid caller contract** for invoking the Spine (Expressions 1–6) in `~/Omega/spine/expressions`.

Hard rule: **If any required field is missing, malformed, or uncertain where required, the system must refuse** (or safe_mode where explicitly defined by gate behavior). There are no silent defaults at the caller boundary.

---

## 1) Canonical Entry Point

Callers must invoke the spine through a single entry point (wrapper) that forwards a **payload dict** to the orchestrator (Expression 6).

- Input: `payload` (dict)
- Output: orchestrator result dict including:
  - `final_disposition`
  - `gate_results`
  - `trace`

No caller may bypass the canonical payload construction rules below.

---

## 2) Required Payload Shape (Top-Level Keys)

A valid payload is a JSON-serializable dictionary with these required keys:

### Observation / decision policy inputs (Gate 1)
- `required_keys`: `list[str]`
- `values`: `dict`
- `uncertainty`: `dict[str, bool]`

### Bounded choice policy inputs (Gate 2)
- `allowed_actions`: `list[str]`
- `preference_order`: `list[str]`

### Triage gate inputs (Gate 3)
- `risk_score`: `float` in `[0.0, 1.0]`
- `confidence`: `float` in `[0.0, 1.0]`

### Action schema gate inputs (Gate 4)
- `proposed_action`: `dict`
- `allowed_action_keys`: `list[str]`
- `required_action_keys`: `list[str]`
- `action_key_types`: `dict[str, str]` (supported: `"str"`, `"int"`, `"float"`, `"bool"`, `"dict"`, `"list"`)
- `action_value_ranges`: `dict[str, list]` where list is `[min, max]`

### Trace metadata (used by Expression 6 -> Expression 5)
- `timestamp_utc`: `str` (UTC timestamp string)
- `spine_version`: `str`

---

## 3) Mandatory vs Optional

### Mandatory
All keys listed in Section 2 are mandatory for a "golden path" call.

### Optional
No optional keys are defined in v0.1. If you need a new key, it must be:
1) specified here, and
2) validated deterministically before use.

---

## 4) Refusal Rules (Caller Boundary)

Caller must refuse (or ensure refusal occurs deterministically) if any of the following are true:

### 4.1 Payload structure
- Payload is not a `dict` → orchestrator will refuse immediately.

### 4.2 Missing required top-level keys
- Any required top-level key missing → refusal behavior is expected at the relevant gate.

### 4.3 Observation integrity (Gate 1 preconditions)
- `required_keys` must be a list of non-empty strings.
- Every key in `required_keys` must be present in `values`.
- Every key in `required_keys` must be present in `uncertainty`.
- If any required key has `uncertainty[key] == True` → Gate 1 refuses.

### 4.4 Action selection integrity (Gate 2 preconditions)
- `allowed_actions` and `preference_order` must be lists of strings.
- If no overlap exists between `allowed_actions` and `preference_order` → Gate 2 refuses.

### 4.5 Risk/confidence integrity (Gate 3 preconditions)
- `risk_score` and `confidence` must be within `[0.0, 1.0]`.
- If `risk_score >= 0.7` → Gate 3 returns `safe_mode`.
- If `confidence < 0.6` → Gate 3 returns `safe_mode`.

### 4.6 Proposed action schema integrity (Gate 4 preconditions)
- `proposed_action` must be a dict.
- All required action keys must be present.
- No disallowed action keys may be present.
- Typed keys must match declared types.
- Ranged values must fall within declared ranges.
- Any violation → Gate 4 refuses.

### 4.7 No silent defaults
- The caller should not auto-fill missing required keys with placeholder values.
- The only allowed "defaulting" behavior is explicit and conservative, and must be documented and validated. (v0.1 defines none.)

---

## 5) Golden Payload Example (Valid)

```json
{
  "required_keys": ["key_a", "key_b"],
  "values": {"key_a": "value_a", "key_b": "value_b"},
  "uncertainty": {"key_a": false, "key_b": false},

  "allowed_actions": ["action_x", "action_y", "action_z"],
  "preference_order": ["action_x", "action_y", "action_z"],

  "risk_score": 0.2,
  "confidence": 0.9,

  "proposed_action": {"type": "action_x", "target": "target_1", "priority": 5},
  "allowed_action_keys": ["type", "target", "priority"],
  "required_action_keys": ["type", "target"],
  "action_key_types": {"type": "str", "target": "str", "priority": "int"},
  "action_value_ranges": {"priority": [1, 10]},

  "timestamp_utc": "2024-01-15T10:30:00Z",
  "spine_version": "test-v0.1"
}
```





















































