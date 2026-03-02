"""
Mechanics feasibility rules.

Checks strain limits, buckling risk, and material stress constraints.
"""

import math
from ..models import ProcedureContext, RobotConcept, AnatomySpec, DimensionResult, Status


def evaluate_mechanics(
    procedure: ProcedureContext,
    robot: RobotConcept,
    anatomy: AnatomySpec,
) -> DimensionResult:
    """
    Evaluate mechanics feasibility.

    Checks:
    - Predicted strain vs material max_strain
    - Buckling risk based on geometry and modulus
    - Stress concentration at bends
    """
    issues = []
    suggestions = []
    knobs = {}
    score = 1.0
    status = Status.GREEN

    geom = robot.geometry
    material = robot.materials
    min_bend_radius = geom.min_bend_radius_mm
    outer_diam = geom.outer_diameter_mm
    wall_thickness = geom.wall_thickness_mm
    youngs_modulus = material.youngs_modulus_kpa
    max_strain = material.max_strain

    # Strain check: approximate outer-fiber strain at minimum bend radius
    if min_bend_radius > 0 and outer_diam > 0:
        # Outer fiber strain: ε = (D/2) / R
        # where D is outer diameter, R is bend radius
        predicted_strain = (outer_diam / 2.0) / min_bend_radius

        if predicted_strain > max_strain:
            issues.append(
                f"Predicted outer-fiber strain {predicted_strain:.3f} exceeds "
                f"material max strain {max_strain:.3f} at minimum bend radius"
            )
            score *= 0.2
            status = Status.RED
            knobs["min_bend_radius_mm"] = {
                "current": min_bend_radius,
                "target_min": (outer_diam / 2.0) / max_strain,
                "delta": (outer_diam / 2.0) / max_strain - min_bend_radius,
            }
            knobs["youngs_modulus_kpa"] = {
                "current": youngs_modulus,
                "suggestion": "Consider higher modulus material",
            }
        elif predicted_strain > max_strain * 0.8:
            issues.append(
                f"Predicted strain {predicted_strain:.3f} approaches "
                f"material limit ({max_strain:.3f})"
            )
            score *= 0.7
            if status == Status.GREEN:
                status = Status.AMBER
            suggestions.append("Increase bend radius or use higher strain material")
        else:
            suggestions.append(
                f"Predicted strain {predicted_strain:.3f} well below "
                f"material limit ({max_strain:.3f})"
            )

    # Buckling risk check (simplified Euler buckling)
    if geom.length_mm > 0 and outer_diam > 0 and wall_thickness > 0:
        # Effective length factor (conservative: pinned-pinned = 1.0)
        # Critical buckling load: P_cr = π²EI / L²
        # For thin-walled tube: I ≈ π/64 * (D_outer^4 - D_inner^4)
        inner_diam = outer_diam - 2 * wall_thickness
        if inner_diam > 0:
            area_moment = (math.pi / 64.0) * (
                (outer_diam / 1000) ** 4 - (inner_diam / 1000) ** 4
            )  # Convert to m^4
            # Convert modulus to Pa
            E_pa = youngs_modulus * 1000
            length_m = geom.length_mm / 1000
            if length_m > 0:
                critical_load_n = (
                    (math.pi ** 2) * E_pa * area_moment / (length_m ** 2)
                )
                # Rough estimate: if critical load < 1N, flag as risky
                if critical_load_n < 1.0:
                    issues.append(
                        f"Estimated critical buckling load {critical_load_n:.3f}N "
                        f"is very low (<1N), high buckling risk"
                    )
                    score *= 0.5
                    if status == Status.GREEN:
                        status = Status.AMBER
                    knobs["wall_thickness_mm"] = {
                        "current": wall_thickness,
                        "target_min": wall_thickness * 1.5,
                        "delta": wall_thickness * 0.5,
                    }
                    suggestions.append("Increase wall thickness or reduce length")

    # Wall thickness sanity check
    if wall_thickness > outer_diam / 2:
        issues.append(
            f"Wall thickness {wall_thickness:.2f}mm exceeds half of "
            f"outer diameter {outer_diam:.2f}mm (invalid geometry)"
        )
        score *= 0.1
        status = Status.RED

    method = {
        "strain_model": "ε = (D/2) / R",
        "buckling_model": "Euler buckling (pinned-pinned)",
        "strain_threshold": max_strain,
    }

    return DimensionResult(
        name="mechanics",
        status=status,
        score=max(0.0, min(1.0, score)),
        issues=issues,
        suggestions=suggestions,
        knobs=knobs,
        method=method,
    )



