"""
Tether feasibility rules.

Checks tether routing, bundle size, and line count constraints.
"""

from ..models import ProcedureContext, RobotConcept, AnatomySpec, DimensionResult, Status


def evaluate_tether(
    procedure: ProcedureContext,
    robot: RobotConcept,
    anatomy: AnatomySpec,
) -> DimensionResult:
    """
    Evaluate tether feasibility.

    Checks:
    - Tether bundle diameter vs anatomy clearance
    - Number of lines vs complexity
    - Routing feasibility
    """
    issues = []
    suggestions = []
    knobs = {}
    score = 1.0
    status = Status.GREEN

    tether = robot.tether
    geometry = robot.geometry

    if not tether.has_tether:
        suggestions.append("No tether specified (may be wireless or self-contained)")
        return DimensionResult(
            name="tether",
            status=Status.GREEN,
            score=1.0,
            issues=issues,
            suggestions=suggestions,
            knobs=knobs,
            method={"has_tether": False},
        )

    # Bundle diameter check
    bundle_diam = tether.total_bundle_diameter_mm
    clearance_margin = 0.2  # 20% margin for tether bundle
    max_bundle_diam = anatomy.lumen_min_mm * (1 - clearance_margin)

    if bundle_diam > max_bundle_diam:
        issues.append(
            f"Tether bundle diameter {bundle_diam:.1f}mm exceeds safe "
            f"clearance {max_bundle_diam:.1f}mm for {anatomy.name}"
        )
        score *= 0.4
        status = Status.RED
        knobs["total_bundle_diameter_mm"] = {
            "current": bundle_diam,
            "target_max": max_bundle_diam,
            "delta": max_bundle_diam - bundle_diam,
        }
    elif bundle_diam > max_bundle_diam * 0.9:
        issues.append(
            f"Tether bundle diameter {bundle_diam:.1f}mm approaches "
            f"clearance limit {max_bundle_diam:.1f}mm"
        )
        score *= 0.7
        if status == Status.GREEN:
            status = Status.AMBER
        suggestions.append("Consider reducing bundle diameter or number of lines")
    else:
        suggestions.append(
            f"Bundle diameter {bundle_diam:.1f}mm acceptable for {anatomy.name}"
        )

    # Number of lines check
    num_lines = tether.num_lines
    # Typical: 1-2 for pneumatic, 2-4 for electrical, 1-2 for other
    # Total reasonable: 4-8 lines
    if num_lines > 8:
        issues.append(
            f"Number of tether lines {num_lines} is high (>8), "
            f"may complicate routing"
        )
        score *= 0.6
        if status == Status.GREEN:
            status = Status.AMBER
        knobs["num_lines"] = {
            "current": num_lines,
            "target_max": 8,
            "delta": 8 - num_lines,
        }
        suggestions.append("Consider multiplexing or reducing line count")
    elif num_lines > 6:
        suggestions.append(
            f"{num_lines} lines is acceptable but consider optimization"
        )
    else:
        suggestions.append(f"{num_lines} lines is reasonable")

    # Bundle vs robot diameter check
    if bundle_diam > geometry.outer_diameter_mm * 0.5:
        issues.append(
            f"Tether bundle {bundle_diam:.1f}mm is large relative to "
            f"robot diameter {geometry.outer_diameter_mm:.1f}mm"
        )
        score *= 0.7
        if status == Status.GREEN:
            status = Status.AMBER
        suggestions.append("Consider smaller bundle or larger robot diameter")

    # Routing feasibility (narrow anatomies)
    if anatomy.lumen_min_mm < 10:
        if bundle_diam > anatomy.lumen_min_mm * 0.3:
            suggestions.append(
                f"Narrow anatomy {anatomy.name} may challenge tether routing, "
                f"ensure adequate clearance"
            )

    method = {
        "clearance_margin": clearance_margin,
        "max_recommended_lines": 8,
        "bundle_to_robot_ratio_threshold": 0.5,
    }

    return DimensionResult(
        name="tether",
        status=status,
        score=max(0.0, min(1.0, score)),
        issues=issues,
        suggestions=suggestions,
        knobs=knobs,
        method=method,
    )



