"""
Spine Entrypoint

Purpose:
- Single "call_spine(payload)" entrypoint (Layer 4 chassis)
- Calls Expression 6 spine_orchestrator
- Prints a small deterministic summary (no recommendations)

Notes:
- Does NOT modify Expressions 1–6
- Uses spine_payload_builder.py (Block 1)
"""

from __future__ import annotations

from typing import Any, Dict

from spine_payload_builder import build_spine_payload
from sixth_expression_spine_orchestrator import spine_orchestrator


def call_spine(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Canonical entrypoint. Deterministic wrapper around spine_orchestrator.
    Returns the orchestrator output dict (final_disposition, gate_results, trace).
    """
    return spine_orchestrator(payload)


def _trace_summary(result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Small, stable summary for humans/logs. No policy logic, no recommendations.
    """
    trace = result.get("trace", {}) if isinstance(result, dict) else {}
    gates = trace.get("gates", []) if isinstance(trace, dict) else []

    # Extract gate actions in order, if present.
    gate_actions = []
    if isinstance(gates, list):
        for g in gates:
            if isinstance(g, dict):
                gate_actions.append({"gate": g.get("gate"), "action": g.get("action")})

    return {
        "final_disposition": result.get("final_disposition"),
        "spine_version": trace.get("spine_version"),
        "timestamp_utc": trace.get("timestamp_utc"),
        "gate_actions": gate_actions,
    }


def call_spine_from_protocol_graph(
    protocol_graph,
    *,
    known_facts,
    uncertainty,
    allowed_actions,
    preference_order,
    risk_score,
    confidence,
    proposed_action,
    allowed_action_keys,
    required_action_keys,
    action_key_types,
    action_value_ranges,
    timestamp_utc,
    spine_version="dev",
):
    """
    CGI path: protocol_graph + facts -> observation -> payload -> spine.
    Deterministic. Conservative. No recommendations.
    """
    from seventh_expression_protocol_graph_validator import protocol_graph_validator

    # If you already have Expression 8 file/function, import it here:
    #   from eighth_expression_protocol_graph_to_observation_adapter import protocol_graph_to_observation
    # The function name MUST match your Expression 8 implementation.
    from eighth_expression_protocol_graph_observation_adapter import protocol_graph_to_observation

    v = protocol_graph_validator(protocol_graph)
    if v.get("action") != "accept":
        return {
            "final_disposition": "refuse",
            "gate_results": {},
            "trace": {
                "trace_type": "omega_decision_trace",
                "trace_version": "1.0.0",
                "spine_version": spine_version,
                "timestamp_utc": timestamp_utc or "",
                "final_disposition": "refuse",
                "gates": [],
                "observation_snapshot": {},
                "reason": "protocol_graph invalid",
                "policy_limits": [],
                "audience_summary": {},
                "provenance": {
                    "timestamp_utc": timestamp_utc or "",
                    "inputs_present_keys": [],
                    "modules_used": ["seventh_expression_protocol_graph_validator"],
                },
            },
        }

    obs = protocol_graph_to_observation(
        protocol_graph=protocol_graph,
        known_facts=known_facts,
        uncertainty=uncertainty,
    )

    from spine_payload_builder import build_spine_payload

    payload = build_spine_payload(
        required_keys=obs.get("required_keys", []),
        values=obs.get("values", {}),
        uncertainty=obs.get("uncertainty", {}),
        allowed_actions=allowed_actions,
        preference_order=preference_order,
        risk_score=risk_score,
        confidence=confidence,
        proposed_action=proposed_action,
        allowed_action_keys=allowed_action_keys,
        required_action_keys=required_action_keys,
        action_key_types=action_key_types,
        action_value_ranges=action_value_ranges,
        timestamp_utc=timestamp_utc,
        spine_version=spine_version,
    )

    return call_spine(payload)


if __name__ == "__main__":
    # Golden path demo (should PROCEED)
    # Minimal valid payload: one key, one action, simple schema
    payload_ok = build_spine_payload(
        required_keys=["key_a"],
        values={"key_a": "value_a"},
        uncertainty={"key_a": False},
        allowed_actions=["action_x"],
        preference_order=["action_x"],
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
    result_ok = call_spine(payload_ok)
    print("=== GOLDEN PATH RESULT ===")
    print(_trace_summary(result_ok))

    # Malformed demo (should REFUSE deterministically)
    # Missing required value: key_a is required but not in values
    payload_bad = build_spine_payload(
        required_keys=["key_a"],
        values={},  # missing key_a -> Gate 1 will refuse
        uncertainty={"key_a": False},
        allowed_actions=["action_x"],
        preference_order=["action_x"],
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
    result_bad = call_spine(payload_bad)
    print("=== MALFORMED RESULT ===")
    print(_trace_summary(result_bad))

