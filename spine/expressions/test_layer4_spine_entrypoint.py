"""
Layer 4 Spine Entrypoint Tests - Nasty Cases

Purpose:
- Prove Layer 4 holds the line (refusal-first) on malformed payloads
- Deterministic: same inputs -> same outputs
- Does NOT change Expressions 1–6

Run:
  cd ~/Omega/spine/expressions
  python3 -m py_compile test_layer4_spine_entrypoint.py
  python3 test_layer4_spine_entrypoint.py
"""

from __future__ import annotations

from typing import Any, Dict

from spine_entrypoint import call_spine
from spine_payload_builder import build_spine_payload


def _assert(cond: bool, msg: str) -> None:
    if not cond:
        raise AssertionError(msg)


def _run_case(name: str, payload: Dict[str, Any], expect: str) -> None:
    result = call_spine(payload)
    got = result.get("final_disposition")
    print(f"{name}: final_disposition={got}")
    _assert(got == expect, f"{name}: expected {expect}, got {got}")


def test_1_missing_required_value_refuse() -> None:
    payload = build_spine_payload(
        required_keys=["key_a"],
        values={},  # missing key_a
        uncertainty={"key_a": False},
        timestamp_utc="2024-01-15T10:30:00Z",
        spine_version="dev",
        # Minimal extras so builder returns a dict and orchestrator can run
        allowed_actions=["action_x"],
        preference_order=["action_x"],
        risk_score=0.2,
        confidence=0.9,
        proposed_action={"type": "action_x"},
        allowed_action_keys=["type"],
        required_action_keys=["type"],
        action_key_types={"type": "str"},
        action_value_ranges={},
    )
    _run_case("test_1_missing_required_value_refuse", payload, "refuse")


def test_2_required_key_uncertain_refuse() -> None:
    payload = build_spine_payload(
        required_keys=["key_a"],
        values={"key_a": "value_a"},
        uncertainty={"key_a": True},  # uncertain required key -> refuse at gate_1
        timestamp_utc="2024-01-15T10:30:00Z",
        spine_version="dev",
        allowed_actions=["action_x"],
        preference_order=["action_x"],
        risk_score=0.2,
        confidence=0.9,
        proposed_action={"type": "action_x"},
        allowed_action_keys=["type"],
        required_action_keys=["type"],
        action_key_types={"type": "str"},
        action_value_ranges={},
    )
    _run_case("test_2_required_key_uncertain_refuse", payload, "refuse")


def test_3_no_overlap_actions_refuse() -> None:
    payload = build_spine_payload(
        required_keys=["key_a"],
        values={"key_a": "value_a"},
        uncertainty={"key_a": False},
        allowed_actions=["action_x"],     # allowed only action_x
        preference_order=["action_z"],    # preference has no overlap -> refuse at gate_2
        risk_score=0.2,
        confidence=0.9,
        proposed_action={"type": "action_x"},
        allowed_action_keys=["type"],
        required_action_keys=["type"],
        action_key_types={"type": "str"},
        action_value_ranges={},
        timestamp_utc="2024-01-15T10:30:00Z",
        spine_version="dev",
    )
    _run_case("test_3_no_overlap_actions_refuse", payload, "refuse")


def test_4_high_risk_safe_mode() -> None:
    payload = build_spine_payload(
        required_keys=["key_a"],
        values={"key_a": "value_a"},
        uncertainty={"key_a": False},
        allowed_actions=["action_x"],
        preference_order=["action_x"],
        risk_score=0.8,   # high risk -> safe_mode at gate_3
        confidence=0.9,
        proposed_action={"type": "action_x"},
        allowed_action_keys=["type"],
        required_action_keys=["type"],
        action_key_types={"type": "str"},
        action_value_ranges={},
        timestamp_utc="2024-01-15T10:30:00Z",
        spine_version="dev",
    )
    _run_case("test_4_high_risk_safe_mode", payload, "safe_mode")


def test_5_invalid_action_schema_refuse() -> None:
    payload = build_spine_payload(
        required_keys=["key_a"],
        values={"key_a": "value_a"},
        uncertainty={"key_a": False},
        allowed_actions=["action_x"],
        preference_order=["action_x"],
        risk_score=0.2,
        confidence=0.9,
        # priority out of allowed range -> refuse at gate_4
        proposed_action={"type": "action_x", "priority": 15},
        allowed_action_keys=["type", "priority"],
        required_action_keys=["type"],
        action_key_types={"type": "str", "priority": "int"},
        action_value_ranges={"priority": [1, 10]},
        timestamp_utc="2024-01-15T10:30:00Z",
        spine_version="dev",
    )
    _run_case("test_5_invalid_action_schema_refuse", payload, "refuse")


if __name__ == "__main__":
    test_1_missing_required_value_refuse()
    test_2_required_key_uncertain_refuse()
    test_3_no_overlap_actions_refuse()
    test_4_high_risk_safe_mode()
    test_5_invalid_action_schema_refuse()
    print("OK: Layer-4 nasty cases passed")


