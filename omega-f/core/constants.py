"""Governance principles and constants"""
from enum import Enum

class GovernancePrinciple(Enum):
    """Core governance principles"""
    INFORMATION_SYMMETRY = "information_symmetry"
    POWER_CONSEQUENCE_MATCHING = "power_consequence_matching"
    POST_HOC_MITIGATION_INSUFFICIENCY = "post_hoc_mitigation_insufficiency"
    HUMAN_SOVEREIGNTY = "human_sovereignty"
    BOUNDED_AUTONOMY = "bounded_autonomy"
    ACCOUNTABILITY_TRACEABILITY = "accountability_traceability"

# Governance framework version
FRAMEWORK_VERSION = "1.0"
FRAMEWORK_NAME = "OMEGA-F Governance Framework"

# Determination number prefix
DETERMINATION_PREFIX = "OMEGA-F"

# Standard violation severities
SEVERITY_LEVELS = {
    "critical": 4,
    "high": 3,
    "medium": 2,
    "low": 1
}

# Confidence levels
CONFIDENCE_LEVELS = {
    "high": 0.8,
    "medium": 0.5,
    "low": 0.2
}

# Standard information visibility levels
VISIBILITY_LEVELS = {
    "full": "Complete operator visibility",
    "partial": "Limited operator visibility",
    "delayed": "Delayed operator visibility",
    "none": "No operator visibility"
}

# Standard control mechanism types
CONTROL_MECHANISM_TYPES = [
    "halt_authority",
    "emergency_stop",
    "human_approval_gate",
    "verification_checkpoint",
    "rollback_capability",
    "audit_trail",
    "monitoring_system",
    "override_mechanism"
]
