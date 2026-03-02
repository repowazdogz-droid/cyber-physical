"""
Control feasibility rules.

Checks control mode, sensing, and closed-loop adequacy.
"""

from ..models import ProcedureContext, RobotConcept, AnatomySpec, DimensionResult, Status


def evaluate_control(
    procedure: ProcedureContext,
    robot: RobotConcept,
    anatomy: AnatomySpec,
) -> DimensionResult:
    """
    Evaluate control feasibility.

    Checks:
    - Control mode adequacy for procedure complexity
    - Closed-loop requirement
    - Sensing modalities adequacy
    """
    issues = []
    suggestions = []
    knobs = {}
    score = 1.0
    status = Status.GREEN

    control = robot.control

    # Control mode check
    control_mode = control.control_mode
    complex_anatomies = ["nasal_passage", "esophagus"]  # High curvature, narrow
    
    if control_mode == "semi_autonomous":
        if anatomy.name in complex_anatomies:
            if not control.closed_loop:
                issues.append(
                    f"Semi-autonomous control without closed-loop feedback "
                    f"risky for complex anatomy {anatomy.name}"
                )
                score *= 0.5
                status = Status.RED
                knobs["closed_loop"] = {
                    "current": False,
                    "target": True,
                }
                suggestions.append("Enable closed-loop control for safety")
            elif len(control.sensing_modalities) == 0:
                issues.append(
                    f"Semi-autonomous control requires sensing modalities "
                    f"for {anatomy.name}"
                )
                score *= 0.6
                if status == Status.GREEN:
                    status = Status.AMBER
                suggestions.append("Add force and/or position sensing")
        else:
            suggestions.append("Semi-autonomous control acceptable for this anatomy")

    elif control_mode == "manual":
        if anatomy.name in complex_anatomies:
            suggestions.append(
                "Manual control may be challenging for complex anatomy, "
                "consider teleop or semi-autonomous"
            )
        else:
            suggestions.append("Manual control acceptable")

    elif control_mode == "teleop":
        if not control.closed_loop:
            suggestions.append("Closed-loop feedback recommended for teleoperation")
        else:
            suggestions.append("Teleop with closed-loop is a good choice")

    # Sensing modalities check
    sensing = control.sensing_modalities
    has_force_sensing = "force" in sensing
    has_position_sensing = "position" in sensing or "pose" in sensing

    if control_mode in ["semi_autonomous", "teleop"]:
        if not has_force_sensing:
            issues.append(
                f"{control_mode} control should include force sensing "
                f"for safety"
            )
            score *= 0.7
            if status == Status.GREEN:
                status = Status.AMBER
            suggestions.append("Add force sensing modality")
        
        if not has_position_sensing:
            suggestions.append("Position sensing recommended for navigation")
        else:
            suggestions.append("Position sensing present, good for navigation")

    # Closed-loop check
    if not control.closed_loop:
        if control_mode == "semi_autonomous":
            issues.append("Semi-autonomous control requires closed-loop feedback")
            score *= 0.5
            status = Status.RED
        elif anatomy.name in complex_anatomies:
            suggestions.append("Closed-loop feedback recommended for complex anatomy")
    else:
        suggestions.append("Closed-loop control enabled, good for safety")

    method = {
        "complex_anatomies": complex_anatomies,
        "required_sensing_for_autonomous": ["force"],
        "recommended_sensing": ["force", "position"],
    }

    return DimensionResult(
        name="control",
        status=status,
        score=max(0.0, min(1.0, score)),
        issues=issues,
        suggestions=suggestions,
        knobs=knobs,
        method=method,
    )



