"""
Materials feasibility rules.

Checks friction, hardness, and material-tissue compatibility.
"""

from ..models import ProcedureContext, RobotConcept, AnatomySpec, DimensionResult, Status


def evaluate_materials(
    procedure: ProcedureContext,
    robot: RobotConcept,
    anatomy: AnatomySpec,
) -> DimensionResult:
    """
    Evaluate materials feasibility.

    Checks:
    - Friction coefficient vs anatomy sensitivity
    - Shore hardness vs anatomy constraints
    - Material-tissue compatibility
    """
    issues = []
    suggestions = []
    knobs = {}
    score = 1.0
    status = Status.GREEN

    material = robot.materials
    friction_coeff = material.friction_coeff
    shore_hardness = material.shore_hardness

    # Friction check
    # Sensitive anatomies (nasal, trachea) need lower friction
    friction_thresholds = {
        "nasal_passage": 0.4,
        "trachea": 0.5,
        "esophagus": 0.6,
        "colon": 0.7,
    }

    threshold = friction_thresholds.get(anatomy.name, 0.6)
    if friction_coeff > threshold:
        issues.append(
            f"Friction coefficient {friction_coeff:.2f} exceeds recommended "
            f"threshold {threshold:.2f} for {anatomy.name}"
        )
        score *= 0.6
        if status == Status.GREEN:
            status = Status.AMBER
        knobs["friction_coeff"] = {
            "current": friction_coeff,
            "target_max": threshold,
            "delta": threshold - friction_coeff,
        }
        suggestions.append("Consider surface treatment or lubrication")
    else:
        suggestions.append(
            f"Friction coefficient {friction_coeff:.2f} acceptable for {anatomy.name}"
        )

    # Shore hardness check
    # Very sensitive anatomies need softer materials
    hardness_thresholds = {
        "nasal_passage": 30.0,
        "trachea": 40.0,
        "esophagus": 50.0,
        "colon": 60.0,
    }

    threshold = hardness_thresholds.get(anatomy.name, 50.0)
    if shore_hardness > threshold:
        issues.append(
            f"Shore hardness {shore_hardness:.1f} exceeds recommended "
            f"threshold {threshold:.1f} for {anatomy.name}"
        )
        score *= 0.7
        if status == Status.GREEN:
            status = Status.AMBER
        knobs["shore_hardness"] = {
            "current": shore_hardness,
            "target_max": threshold,
            "delta": threshold - shore_hardness,
        }
        suggestions.append("Consider softer material for delicate tissue")
    else:
        suggestions.append(
            f"Shore hardness {shore_hardness:.1f} acceptable for {anatomy.name}"
        )

    # Material notes check (warnings from preset)
    if material.notes:
        if "lubrication" in material.notes.lower() or "friction" in material.notes.lower():
            if friction_coeff > 0.6:
                suggestions.append(
                    "Material notes suggest lubrication may be required"
                )

    method = {
        "friction_thresholds": friction_thresholds,
        "hardness_thresholds": hardness_thresholds,
    }

    return DimensionResult(
        name="materials",
        status=status,
        score=max(0.0, min(1.0, score)),
        issues=issues,
        suggestions=suggestions,
        knobs=knobs,
        method=method,
    )



