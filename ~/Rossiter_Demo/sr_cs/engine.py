"""
Main compilation engine for SR-CS v0.
"""

from typing import Dict

from .models import CompileResult, RiskLevel
from . import rules, presets


REQUIRED_FIELDS = [
    "case_name",
    "material",
    "actuator",
    "diameter_mm",
    "length_mm",
    "target_env",
    "latency_budget_ms",
    "force_requirement",
    "sensing",
    "control_strategy",
]


def compile_from_dict(spec: Dict) -> CompileResult:
    """
    Compile a soft robotics spec into a CompileResult.

    Args:
        spec: Dictionary containing case specification

    Returns:
        CompileResult with evaluation across all dimensions

    Raises:
        ValueError: If required fields are missing
    """
    # Validate required fields
    missing_fields = [field for field in REQUIRED_FIELDS if field not in spec]
    if missing_fields:
        raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")

    # Evaluate each dimension
    dimensions = [
        rules.evaluate_materials(spec, presets),
        rules.evaluate_actuation(spec, presets),
        rules.evaluate_morphology(spec),
        rules.evaluate_control_latency(spec),
        rules.evaluate_environment_interface(spec),
        rules.evaluate_integration(spec),
    ]

    # Aggregate overall status (worst of dimension statuses)
    status_priority = {RiskLevel.RED: 3, RiskLevel.AMBER: 2, RiskLevel.GREEN: 1}
    overall_status = max(dimensions, key=lambda d: status_priority[d.status]).status

    # Aggregate overall score (weighted average, equal weights)
    overall_score = sum(d.score for d in dimensions) / len(dimensions)

    # Generate frontier notes based on combinations
    frontier_notes = _generate_frontier_notes(spec, dimensions)

    return CompileResult(
        case_name=spec["case_name"],
        overall_status=overall_status,
        overall_score=overall_score,
        dimensions=dimensions,
        frontier_notes=frontier_notes,
        metadata={
            "material": spec.get("material", ""),
            "actuator": spec.get("actuator", ""),
            "scale": presets.classify_scale(spec.get("diameter_mm", 0.0)),
        },
    )


def _generate_frontier_notes(spec: Dict, dimensions: list) -> list:
    """Generate frontier notes based on spec combinations."""
    notes = []
    material = spec.get("material", "").lower()
    actuator = spec.get("actuator", "").lower()
    diameter_mm = spec.get("diameter_mm", 0.0)
    target_env = spec.get("target_env", "").lower()
    scale = presets.classify_scale(diameter_mm)

    # Pneumatic + small scale + endoluminal
    if actuator == "pneumatic" and scale in ["SMALL", "MICRO"] and target_env == "in_body_endoluminal":
        notes.append("Frontier: fluidic logic and microfluidic control for endoluminal pneumatic systems")

    # Tendon + pneumatic hybrid potential
    if actuator == "tendon" and any(d.status == RiskLevel.AMBER for d in dimensions if d.name.value == "ACTUATION"):
        notes.append("Frontier: tendon-pneumatic hybrid actuation for improved compliance and precision")

    # Fabric composite + high aspect ratio
    if material == "fabric_composite":
        aspect_ratio = spec.get("length_mm", 0.0) / spec.get("diameter_mm", 1.0) if spec.get("diameter_mm", 0.0) > 0 else 0
        if aspect_ratio > 10:
            notes.append("Frontier: anisotropic material design for high-aspect-ratio soft manipulators")

    # EAP + micro scale
    if actuator == "EAP" and scale == "MICRO":
        notes.append("Frontier: EAP-based micro-actuation with integrated sensing")

    # Multiple sensing modalities
    sensing = spec.get("sensing", [])
    if len(sensing) >= 2:
        notes.append("Frontier: multi-modal sensing fusion for soft robotics control")

    # Model-based control in complex env
    if spec.get("control_strategy", "").lower() == "model_based" and target_env == "in_body_endoluminal":
        notes.append("Frontier: model-based control with real-time adaptation for endoluminal navigation")

    return notes


