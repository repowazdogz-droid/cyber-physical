"""
Multi-knob interaction analysis.

Deterministic rule-based analysis of conflicting/synergistic adjustments.
"""

from typing import List
from ..models import CompileResult, DimensionResult


def analyse_interactions(result: CompileResult) -> List[str]:
    """
    Very simple rule-based multi-knob interaction analysis.
    Looks for known conflicting/synergistic adjustments.
    Returns a list of human-readable warnings/summaries.
    """
    notes: List[str] = []

    dims = result.dimensions

    geom = dims.get("geometry")
    mech = dims.get("mechanics")
    safety = dims.get("safety")
    materials = dims.get("materials")

    # Example: wall_thickness + diameter
    if geom and mech:
        wt_knob = mech.knobs.get("wall_thickness_mm")
        diam_knob = geom.knobs.get("outer_diameter_mm") or geom.knobs.get("robot_diameter_mm")
        if wt_knob and diam_knob:
            # If both suggest increases, flag clearance risk
            if isinstance(wt_knob, dict) and isinstance(diam_knob, dict):
                wt_delta = wt_knob.get("delta", 0)
                diam_delta = diam_knob.get("delta", 0)
                if wt_delta > 0 and diam_delta > 0:
                    notes.append(
                        "Increasing both wall thickness and diameter may worsen clearance; "
                        "check lumen geometry before applying both adjustments."
                    )

    # Example: friction + pressure
    if safety and materials:
        friction_knob = materials.knobs.get("friction_coeff")
        pressure_knob = safety.knobs.get("max_contact_pressure_kpa") or safety.knobs.get("contact_pressure_kpa")
        if friction_knob and pressure_knob:
            if isinstance(friction_knob, dict) and isinstance(pressure_knob, dict):
                friction_delta = friction_knob.get("delta", 0)
                pressure_delta = pressure_knob.get("delta", 0)
                if friction_delta > 0 and pressure_delta > 0:
                    notes.append(
                        "Increasing both friction and contact pressure increases tissue injury risk; "
                        "consider changing only one or revising the control strategy."
                    )

    # Example: actuation pressure + safety pressure
    actuation = dims.get("actuation")
    if actuation and safety:
        act_pressure_knob = actuation.knobs.get("max_pressure_kpa")
        safety_pressure_knob = safety.knobs.get("max_contact_pressure_kpa")
        if act_pressure_knob and safety_pressure_knob:
            if isinstance(act_pressure_knob, dict) and isinstance(safety_pressure_knob, dict):
                act_delta = act_pressure_knob.get("delta", 0)
                safety_delta = safety_pressure_knob.get("delta", 0)
                # If actuation wants to increase but safety wants to decrease
                if act_delta > 0 and safety_delta < 0:
                    notes.append(
                        "Actuation pressure increase conflicts with safety pressure limits; "
                        "review actuation strategy or safety margins."
                    )

    return notes



