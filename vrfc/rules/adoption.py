from __future__ import annotations

from ..models import DimensionResult, ProcedureSpec, Status
from ..presets import Presets  # noqa: F401  # reserved for future use


def evaluate(spec: ProcedureSpec, presets: Presets) -> DimensionResult:
    section = spec.section("adoption", {})

    training_hours = float(section.get("training_hours", 0.0))
    requires_new_hardware = bool(section.get("requires_new_hardware", False))
    workflow_disruption = str(section.get("workflow_disruption", "low")).lower()

    issues = []
    suggestions = []

    disruption_factor = {"low": 0.2, "medium": 0.5, "high": 0.8}.get(workflow_disruption, 0.5)

    if training_hours <= 4 and disruption_factor <= 0.3 and not requires_new_hardware:
        status = Status.GREEN
        suggestions.append("Adoption burden appears low.")
    elif training_hours <= 12 and disruption_factor <= 0.6:
        status = Status.AMBER
        issues.append("Moderate adoption friction expected.")
        suggestions.append("Design training pathways and proctoring to smooth adoption.")
        if requires_new_hardware:
            suggestions.append("Consider hardware-light variants for earlier adoption.")
    else:
        status = Status.RED
        issues.append("High adoption burden (training, workflow, or hardware).")
        suggestions.append("Simplify workflow, reduce training time, or decouple from new hardware.")

    score = _score(training_hours, disruption_factor, requires_new_hardware)

    metrics = {
        "training_hours": training_hours,
        "workflow_disruption": workflow_disruption,
        "requires_new_hardware": requires_new_hardware,
    }

    result = DimensionResult(
        name="adoption",
        status=status,
        score=score,
        issues=issues,
        metrics=metrics,
        suggestions=suggestions,
    )

    result.method = {
        "dimension": "adoption",
        "logic": "rule-based assessment of training burden, workflow disruption, and capital requirements",
        "inputs": [
            "training_hours",
            "workflow_disruption",
            "requires_new_hardware",
        ],
        "notes": "No AI/ML used; deterministic scoring based on training hours (penalty if >4h), workflow disruption factor (low=0.2, medium=0.5, high=0.8), and hardware requirement flag.",
    }

    return result


def _score(training_hours: float, disruption_factor: float, requires_new_hardware: bool) -> float:
    base = 1.0

    if training_hours > 4:
        base -= min((training_hours - 4) / 20.0, 0.4)
    base -= disruption_factor * 0.4
    if requires_new_hardware:
        base -= 0.2

    return float(round(max(0.0, min(base, 1.0)), 3))

