"""
Eighth Omega Expression: Protocol Graph → Observation Adapter

Purpose:
Adapt a validated ProtocolGraph v0.1 into a spine-compatible observation
for Expression 1 (decision_policy), without making decisions or traversal.

HARD RULES:
- No recommendations
- No diagnosis
- No graph traversal
- No edge evaluation
- No inference
- Deterministic and conservative

This function does not learn, optimize, or predict. It only adapts structure.
"""

from typing import Any, Dict, List


def protocol_graph_to_observation(
    protocol_graph: Any,
    known_facts: Any,
    uncertainty: Any
) -> Dict[str, Any]:
    """
    Deterministic adapter:
      ProtocolGraph v0.1 + known_facts + uncertainty -> Observation dict
      suitable for Expressions 1–3 (required_keys/values/uncertainty).

    Conservative behavior:
      - If inputs are invalid, returns empty observation (so downstream refuses).
      - For any required_input missing an uncertainty flag, defaults to True.
    """
    if not isinstance(protocol_graph, dict):
        return {"required_keys": [], "values": {}, "uncertainty": {}}

    if not isinstance(known_facts, dict):
        return {"required_keys": [], "values": {}, "uncertainty": {}}

    if uncertainty is None:
        uncertainty = {}
    if not isinstance(uncertainty, dict):
        return {"required_keys": [], "values": {}, "uncertainty": {}}

    required_inputs = protocol_graph.get("required_inputs")
    if not isinstance(required_inputs, list):
        return {"required_keys": [], "values": {}, "uncertainty": {}}

    # Ensure required_inputs are all non-empty strings
    required_keys: List[str] = []
    for item in required_inputs:
        if not isinstance(item, str) or item.strip() == "":
            return {"required_keys": [], "values": {}, "uncertainty": {}}
        required_keys.append(item)

    # values: pass through exactly the known_facts dict (no inference)
    values: Dict[str, Any] = dict(known_facts)

    # uncertainty: ensure every required_key has a bool flag, default True if missing
    out_uncertainty: Dict[str, bool] = {}
    for key in required_keys:
        flag = uncertainty.get(key, True)
        out_uncertainty[key] = bool(flag)

    return {"required_keys": required_keys, "values": values, "uncertainty": out_uncertainty}

