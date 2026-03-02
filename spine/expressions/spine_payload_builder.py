def build_spine_payload(
    *,
    required_keys,
    values,
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
    Canonical Layer-4 payload builder.
    This is the ONLY supported way to construct a spine payload.
    No validation logic lives here — gates handle that.
    """

    return {
        "required_keys": required_keys,
        "values": values,
        "uncertainty": uncertainty,
        "allowed_actions": allowed_actions,
        "preference_order": preference_order,
        "risk_score": risk_score,
        "confidence": confidence,
        "proposed_action": proposed_action,
        "allowed_action_keys": allowed_action_keys,
        "required_action_keys": required_action_keys,
        "action_key_types": action_key_types,
        "action_value_ranges": action_value_ranges,
        "timestamp_utc": timestamp_utc,
        "spine_version": spine_version,
    }
