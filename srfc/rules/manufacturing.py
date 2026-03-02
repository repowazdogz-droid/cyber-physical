"""
Manufacturing feasibility rules.

Checks unit cost, volume, sterilization, tolerance, and tooling constraints.
"""

from typing import Dict, Any
from ..models import ProcedureContext, RobotConcept, AnatomySpec, DimensionResult, Status


def evaluate_manufacturing(
    procedure: ProcedureContext,
    robot: RobotConcept,
    anatomy: AnatomySpec,
    presets: Dict[str, Any],
) -> DimensionResult:
    """
    Deterministic manufacturing feasibility checks.

    Uses rule-based thresholds from presets["manufacturing"].
    Considers: unit cost, volume, sterilization, tolerance, tooling.
    """
    mf = robot.manufacturing
    if mf is None:
        return DimensionResult(
            name="manufacturing",
            status=Status.AMBER,
            score=0.5,
            issues=["No manufacturing information provided."],
            suggestions=["Add manufacturing block with cost, volume, tolerances, and sterilization method."],
            knobs={},
        )

    cfg = presets.get("manufacturing", {})
    issues: list[str] = []
    suggestions: list[str] = []
    knobs: Dict[str, Dict[str, Any]] = {}

    # Thresholds
    max_unit_cost = cfg.get("max_unit_cost_estimate", 200.0)
    max_tolerance = cfg.get("max_tolerance_mm", 0.1)
    max_tooling_cost_sensitivity = cfg.get("max_tooling_risk", 1.0)  # placeholder scalar
    preferred_sterilization = set(cfg.get("preferred_sterilization_methods", ["steam", "EO", "gamma"]))

    score = 1.0

    # Unit cost vs volume
    if mf.unit_cost_estimate > max_unit_cost:
        issues.append(f"Unit cost estimate {mf.unit_cost_estimate:.2f} exceeds threshold {max_unit_cost:.2f}.")
        suggestions.append("Review BOM and manufacturing process for cost reduction.")
        knobs["unit_cost_estimate"] = {
            "current": mf.unit_cost_estimate,
            "target": max_unit_cost,
            "delta": max_unit_cost - mf.unit_cost_estimate,
        }
        score -= 0.2

    # Tolerance
    if mf.tolerance_mm < 0:
        issues.append("Tolerance must be non-negative.")
        score = min(score, 0.3)
    elif mf.tolerance_mm < max_tolerance:
        # very tight tolerance → manufacturability risk
        issues.append(
            f"Very tight tolerance {mf.tolerance_mm:.3f}mm; may require specialised tooling and QA."
        )
        suggestions.append("Assess whether tolerances can be relaxed without compromising safety/control.")
        knobs["tolerance_mm"] = {
            "current": mf.tolerance_mm,
            "target": max_tolerance,
            "delta": max_tolerance - mf.tolerance_mm,
        }
        score -= 0.15

    # Sterilization compatibility (simple rule: method should be in preferred set)
    if mf.sterilization_method not in preferred_sterilization:
        issues.append(
            f"Sterilisation method '{mf.sterilization_method}' is not in preferred set "
            f"{sorted(preferred_sterilization)}."
        )
        suggestions.append("Confirm sterilisation compatibility and regulatory expectations for chosen method.")
        score -= 0.1

    # Special tooling
    if mf.special_tooling_required:
        issues.append("Specialised tooling required; increases upfront cost and time-to-manufacture.")
        suggestions.append("Quantify tooling cost and amortisation over expected volume.")
        score -= 0.1

    status = Status.GREEN
    if score < 0.7:
        status = Status.AMBER
    if score < 0.4:
        status = Status.RED

    method = {
        "max_unit_cost_threshold": max_unit_cost,
        "max_tolerance_threshold": max_tolerance,
        "preferred_sterilization_methods": sorted(preferred_sterilization),
    }

    return DimensionResult(
        name="manufacturing",
        status=status,
        score=max(score, 0.0),
        issues=issues,
        suggestions=suggestions,
        knobs=knobs,
        method=method,
    )



