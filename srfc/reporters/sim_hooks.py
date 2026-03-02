"""
Simulation scenario exporter.

Exports boundary conditions for simulation.
"""

from ..models import CompileResult


def export_sim_scenarios(result: CompileResult) -> dict:
    """
    Return a dict with simulation boundary conditions.

    Scenarios:
    - "nominal": Standard operating conditions
    - "tight_clearance": Minimum clearance case
    - "max_curvature": Maximum curvature case
    """
    anatomy = result.anatomy
    robot = result.robot
    geom = robot.geometry

    scenarios = {
        "nominal": {
            "lumen_diameter_mm": (anatomy.lumen_min_mm + anatomy.lumen_max_mm) / 2,
            "curvature_deg_per_cm": anatomy.max_curvature_deg_per_cm * 0.5,
            "contact_pressure_kpa": anatomy.max_contact_pressure_kpa * 0.5,
            "robot_diameter_mm": geom.outer_diameter_mm,
            "robot_length_mm": geom.length_mm,
            "min_bend_radius_mm": geom.min_bend_radius_mm,
        },
        "tight_clearance": {
            "lumen_diameter_mm": anatomy.lumen_min_mm,
            "curvature_deg_per_cm": anatomy.max_curvature_deg_per_cm * 0.7,
            "contact_pressure_kpa": anatomy.max_contact_pressure_kpa * 0.8,
            "robot_diameter_mm": geom.outer_diameter_mm,
            "robot_length_mm": geom.length_mm,
            "min_bend_radius_mm": geom.min_bend_radius_mm,
            "note": "Minimum clearance case - most challenging geometry",
        },
        "max_curvature": {
            "lumen_diameter_mm": anatomy.lumen_max_mm,
            "curvature_deg_per_cm": anatomy.max_curvature_deg_per_cm,
            "contact_pressure_kpa": anatomy.max_contact_pressure_kpa * 0.6,
            "robot_diameter_mm": geom.outer_diameter_mm,
            "robot_length_mm": geom.length_mm,
            "min_bend_radius_mm": geom.min_bend_radius_mm,
            "note": "Maximum curvature case - tests bend radius limits",
        },
    }

    # Add actuation parameters if available
    actuation = robot.actuation
    if actuation.max_pressure_kpa is not None:
        for scenario in scenarios.values():
            scenario["actuation_pressure_kpa"] = actuation.max_pressure_kpa * 0.8
    
    if actuation.max_tendon_force_n is not None:
        for scenario in scenarios.values():
            scenario["actuation_force_n"] = actuation.max_tendon_force_n * 0.8

    return scenarios



