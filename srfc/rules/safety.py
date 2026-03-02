"""
Safety feasibility rules.

Aggregates safety concerns from other dimensions into a safety view.
"""

from ..models import ProcedureContext, RobotConcept, AnatomySpec, DimensionResult, Status


def evaluate_safety(
    procedure: ProcedureContext,
    robot: RobotConcept,
    anatomy: AnatomySpec,
) -> DimensionResult:
    """
    Evaluate safety feasibility.

    Combines safety-relevant checks:
    - Contact pressure (from actuation + geometry)
    - Tip force (from actuation)
    - Dwell time constraints
    - Tissue damage risk indicators
    """
    issues = []
    suggestions = []
    knobs = {}
    score = 1.0
    status = Status.GREEN

    safety = robot.safety
    actuation = robot.actuation
    geometry = robot.geometry

    # Contact pressure check (aggregate from actuation and anatomy)
    max_pressure = safety.max_contact_pressure_kpa
    anatomy_limit = anatomy.max_contact_pressure_kpa
    safe_limit = min(max_pressure, anatomy_limit)

    if actuation.mode == "pneumatic" and actuation.max_pressure_kpa is not None:
        if actuation.max_pressure_kpa > safe_limit:
            issues.append(
                f"Actuation pressure {actuation.max_pressure_kpa:.1f}kPa "
                f"exceeds safe contact pressure {safe_limit:.1f}kPa"
            )
            score *= 0.4
            status = Status.RED
            knobs["max_contact_pressure_kpa"] = {
                "current": actuation.max_pressure_kpa,
                "target_max": safe_limit,
                "delta": safe_limit - actuation.max_pressure_kpa,
            }

    # Tip force check
    max_force = safety.max_tip_force_n
    if actuation.mode == "tendon" and actuation.max_tendon_force_n is not None:
        if actuation.max_tendon_force_n > max_force:
            issues.append(
                f"Tendon force {actuation.max_tendon_force_n:.2f}N exceeds "
                f"safe tip force {max_force:.2f}N"
            )
            score *= 0.4
            status = Status.RED
            knobs["max_tip_force_n"] = {
                "current": actuation.max_tendon_force_n,
                "target_max": max_force,
                "delta": max_force - actuation.max_tendon_force_n,
            }

    # Dwell time check (informational)
    if safety.max_dwell_time_min < 10:
        suggestions.append(
            f"Maximum dwell time {safety.max_dwell_time_min:.1f}min is "
            f"conservative for {anatomy.name}"
        )
    elif safety.max_dwell_time_min > 60:
        suggestions.append(
            f"Maximum dwell time {safety.max_dwell_time_min:.1f}min allows "
            f"extended procedures"
        )

    # Geometry-based safety (clearance)
    clearance_ratio = geometry.outer_diameter_mm / anatomy.lumen_max_mm
    if clearance_ratio > 0.9:
        issues.append(
            f"Robot diameter {geometry.outer_diameter_mm:.1f}mm occupies "
            f"{clearance_ratio*100:.0f}% of lumen, minimal clearance margin"
        )
        score *= 0.6
        if status == Status.GREEN:
            status = Status.AMBER
        suggestions.append("Increase clearance margin for safety")

    # Material friction safety (high friction = tissue damage risk)
    if robot.materials.friction_coeff > 0.7:
        issues.append(
            f"High friction coefficient {robot.materials.friction_coeff:.2f} "
            f"may increase tissue damage risk"
        )
        score *= 0.7
        if status == Status.GREEN:
            status = Status.AMBER
        suggestions.append("Consider lower friction material or lubrication")

    # Overall safety summary
    if status == Status.GREEN:
        suggestions.append("No blocking safety issues identified")
    elif status == Status.AMBER:
        suggestions.append("Safety margins acceptable but could be improved")
    else:
        suggestions.append("Critical safety issues must be addressed")

    method = {
        "pressure_limit_source": "min(safety.max_contact_pressure_kpa, anatomy.max_contact_pressure_kpa)",
        "clearance_threshold": 0.9,
        "friction_threshold": 0.7,
    }

    return DimensionResult(
        name="safety",
        status=status,
        score=max(0.0, min(1.0, score)),
        issues=issues,
        suggestions=suggestions,
        knobs=knobs,
        method=method,
    )



