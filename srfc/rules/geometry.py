"""
Geometry feasibility rules.

Checks clearance, slenderness, and bend radius constraints.
"""

import math
from ..models import ProcedureContext, RobotConcept, AnatomySpec, DimensionResult, Status


def evaluate_geometry(
    procedure: ProcedureContext,
    robot: RobotConcept,
    anatomy: AnatomySpec,
) -> DimensionResult:
    """
    Evaluate geometry feasibility.

    Checks:
    - Clearance: robot diameter vs anatomy lumen
    - Slenderness: length/diameter ratio
    - Bend radius vs anatomy curvature
    """
    issues = []
    suggestions = []
    knobs = {}
    score = 1.0
    status = Status.GREEN

    geom = robot.geometry
    outer_diam = geom.outer_diameter_mm
    length = geom.length_mm
    min_bend_radius = geom.min_bend_radius_mm

    # Clearance check
    clearance_margin = 0.15  # 15% clearance margin required
    min_clearance = anatomy.lumen_min_mm * (1 - clearance_margin)
    max_clearance = anatomy.lumen_max_mm * (1 - clearance_margin)

    if outer_diam > max_clearance:
        issues.append(
            f"Robot diameter {outer_diam:.1f}mm exceeds safe clearance "
            f"({max_clearance:.1f}mm) for {anatomy.name} lumen"
        )
        score *= 0.3
        status = Status.RED
        knobs["outer_diameter_mm"] = {
            "current": outer_diam,
            "target_max": max_clearance,
            "delta": max_clearance - outer_diam,
        }
    elif outer_diam > anatomy.lumen_max_mm:
        issues.append(
            f"Robot diameter {outer_diam:.1f}mm exceeds maximum lumen "
            f"diameter {anatomy.lumen_max_mm:.1f}mm"
        )
        score *= 0.5
        status = Status.RED
        knobs["outer_diameter_mm"] = {
            "current": outer_diam,
            "target_max": anatomy.lumen_max_mm,
            "delta": anatomy.lumen_max_mm - outer_diam,
        }
    elif outer_diam < min_clearance:
        issues.append(
            f"Robot diameter {outer_diam:.1f}mm may be too small for "
            f"stable navigation (minimum {min_clearance:.1f}mm recommended)"
        )
        score *= 0.8
        if status == Status.GREEN:
            status = Status.AMBER
        suggestions.append("Consider increasing diameter for better stability")
    else:
        suggestions.append("Clearance within acceptable range")

    # Slenderness check
    if length > 0 and outer_diam > 0:
        slenderness = length / outer_diam
        if slenderness > 50:
            issues.append(
                f"Slenderness ratio {slenderness:.1f} is very high "
                f"(>50), risk of buckling"
            )
            score *= 0.6
            if status == Status.GREEN:
                status = Status.AMBER
            knobs["length_mm"] = {
                "current": length,
                "target_max": outer_diam * 50,
                "delta": outer_diam * 50 - length,
            }
        elif slenderness < 2:
            issues.append(
                f"Slenderness ratio {slenderness:.1f} is very low "
                f"(<2), may limit maneuverability"
            )
            score *= 0.8
            if status == Status.GREEN:
                status = Status.AMBER
            suggestions.append("Consider increasing length for better reach")
        else:
            suggestions.append(f"Slenderness ratio {slenderness:.1f} within acceptable range")

    # Bend radius vs curvature check
    # Convert curvature from deg/cm to approximate minimum radius
    # Rough approximation: radius = 180 / (curvature_deg_per_cm * 10) * 1000 mm
    if anatomy.max_curvature_deg_per_cm > 0:
        # Minimum radius needed: R = 180 / (curvature * π/180 * 10) * 1000
        # Simplified: R ≈ 18000 / (curvature_deg_per_cm * π) mm
        min_required_radius = 18000 / (anatomy.max_curvature_deg_per_cm * math.pi)
        
        if min_bend_radius > min_required_radius:
            issues.append(
                f"Minimum bend radius {min_bend_radius:.1f}mm exceeds "
                f"required {min_required_radius:.1f}mm for {anatomy.name} "
                f"curvature ({anatomy.max_curvature_deg_per_cm:.1f} deg/cm)"
            )
            score *= 0.4
            status = Status.RED
            knobs["min_bend_radius_mm"] = {
                "current": min_bend_radius,
                "target_max": min_required_radius,
                "delta": min_required_radius - min_bend_radius,
            }
        else:
            suggestions.append(
                f"Bend radius {min_bend_radius:.1f}mm acceptable for "
                f"{anatomy.name} curvature"
            )

    method = {
        "clearance_margin": clearance_margin,
        "slenderness_range": [2, 50],
        "curvature_approximation": "R ≈ 18000 / (curvature_deg_per_cm * π)",
    }

    return DimensionResult(
        name="geometry",
        status=status,
        score=max(0.0, min(1.0, score)),
        issues=issues,
        suggestions=suggestions,
        knobs=knobs,
        method=method,
    )



