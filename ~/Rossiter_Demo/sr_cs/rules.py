"""
Deterministic scoring rules for each constraint dimension.
"""

from typing import Dict, List

from .models import DimensionResult, DimensionName, RiskLevel
from . import presets


def evaluate_materials(spec: Dict, presets_module) -> DimensionResult:
    """Evaluate materials dimension."""
    material = spec.get("material", "").lower()
    target_env = spec.get("target_env", "").lower()
    diameter_mm = spec.get("diameter_mm", 0.0)

    material_profile = presets_module.get_material_profile(material)
    env_profile = presets_module.get_environment_profile(target_env)

    issues: List[str] = []
    suggestions: List[str] = []
    status = RiskLevel.GREEN
    score = 0.9

    # Unknown material
    if not material_profile:
        status = RiskLevel.RED
        score = 0.2
        issues.append(f"Unknown material: {material}")
        return DimensionResult(
            name=DimensionName.MATERIALS,
            status=status,
            score=score,
            issues=issues,
            suggestions=suggestions,
        )

    # Environment compatibility
    if env_profile:
        if env_profile.get("requires_biointerface") and not material_profile.get("biointerface"):
            status = RiskLevel.AMBER
            score = 0.5
            issues.append(f"Material {material} lacks biointerface properties for {target_env}")
            suggestions.append("Consider hydrogel or bio-compatible silicone variants")

        # Hydrogel in dry/abrasive environments
        if material == "hydrogel" and target_env == "dry_lab":
            status = RiskLevel.AMBER
            score = 0.6
            issues.append("Hydrogel may dehydrate in dry lab environment")
            suggestions.append("Consider silicone or elastomer_gel for dry environments")

    # Manufacturing maturity
    maturity = material_profile.get("manufacturing_maturity", "unknown")
    if maturity == "low":
        if status == RiskLevel.GREEN:
            status = RiskLevel.AMBER
            score = 0.65
        issues.append(f"Low manufacturing maturity for {material}")
        suggestions.append("Consider prototyping with higher-maturity alternatives first")

    # Fatigue risk at scale
    scale = presets_module.classify_scale(diameter_mm)
    fatigue = material_profile.get("fatigue_resistance", "unknown")
    if fatigue == "low" and scale in ["MEDIUM", "LARGE"]:
        if status == RiskLevel.GREEN:
            status = RiskLevel.AMBER
            score = 0.7
        issues.append(f"Low fatigue resistance may be problematic at {scale.lower()} scale")
        suggestions.append("Consider fatigue testing and material reinforcement")

    return DimensionResult(
        name=DimensionName.MATERIALS,
        status=status,
        score=score,
        issues=issues,
        suggestions=suggestions,
    )


def evaluate_actuation(spec: Dict, presets_module) -> DimensionResult:
    """Evaluate actuation dimension."""
    actuator = spec.get("actuator", "").lower()
    latency_budget_ms = spec.get("latency_budget_ms", 1000)
    length_mm = spec.get("length_mm", 0.0)
    diameter_mm = spec.get("diameter_mm", 0.0)

    actuator_profile = presets_module.get_actuator_profile(actuator)
    scale = presets_module.classify_scale(diameter_mm)

    issues: List[str] = []
    suggestions: List[str] = []
    status = RiskLevel.GREEN
    score = 0.9

    # Unknown actuator
    if not actuator_profile:
        status = RiskLevel.RED
        score = 0.2
        issues.append(f"Unknown actuator: {actuator}")
        return DimensionResult(
            name=DimensionName.ACTUATION,
            status=status,
            score=score,
            issues=issues,
            suggestions=suggestions,
        )

    # Pneumatic + tight latency + long length
    if actuator == "pneumatic":
        if latency_budget_ms < 20 and length_mm > 100:
            status = RiskLevel.RED
            score = 0.3
            issues.append(f"Pneumatic actuation may struggle with {latency_budget_ms}ms latency budget at {length_mm}mm length")
            suggestions.append("Consider tendon-driven or EAP for faster response")
        elif latency_budget_ms < 50 and length_mm > 150:
            if status == RiskLevel.GREEN:
                status = RiskLevel.AMBER
                score = 0.6
            issues.append("Long pneumatic lines increase latency")
            suggestions.append("Consider distributed actuation or hybrid approaches")

    # Hydraulic at micro scale
    if actuator == "hydraulic" and scale == "MICRO":
        status = RiskLevel.RED
        score = 0.25
        issues.append("Hydraulic actuation is challenging at micro scale due to leak risks")
        suggestions.append("Consider pneumatic or tendon-driven actuation for micro scale")

    # Tendon routing complexity
    if actuator == "tendon":
        aspect_ratio = length_mm / diameter_mm if diameter_mm > 0 else 0
        if aspect_ratio > 20:
            if status == RiskLevel.GREEN:
                status = RiskLevel.AMBER
                score = 0.65
            issues.append(f"High aspect ratio ({aspect_ratio:.1f}) increases tendon routing complexity")
            suggestions.append("Consider tendon routing optimization and friction mitigation")

    # Shape memory response time
    if actuator == "shape_memory":
        if latency_budget_ms < 100:
            status = RiskLevel.RED
            score = 0.3
            issues.append(f"Shape memory actuators typically have slow response times (>100ms)")
            suggestions.append("Consider pneumatic or EAP for faster response")

    return DimensionResult(
        name=DimensionName.ACTUATION,
        status=status,
        score=score,
        issues=issues,
        suggestions=suggestions,
    )


def evaluate_morphology(spec: Dict) -> DimensionResult:
    """Evaluate morphology dimension."""
    length_mm = spec.get("length_mm", 0.0)
    diameter_mm = spec.get("diameter_mm", 0.0)
    target_env = spec.get("target_env", "").lower()

    issues: List[str] = []
    suggestions: List[str] = []
    status = RiskLevel.GREEN
    score = 0.9

    if diameter_mm <= 0 or length_mm <= 0:
        status = RiskLevel.RED
        score = 0.2
        issues.append("Invalid dimensions: length and diameter must be positive")
        return DimensionResult(
            name=DimensionName.MORPHOLOGY,
            status=status,
            score=score,
            issues=issues,
            suggestions=suggestions,
        )

    aspect_ratio = length_mm / diameter_mm
    env_profile = presets.get_environment_profile(target_env)
    complexity = env_profile.get("complexity", "low") if env_profile else "low"

    # Slenderness issues
    if aspect_ratio > 15:
        if complexity == "high":
            status = RiskLevel.AMBER
            score = 0.6
            issues.append(f"High aspect ratio ({aspect_ratio:.1f}) increases buckling risk in complex environments")
            suggestions.append("Consider intermediate support structures or reduced aspect ratio")
        elif complexity == "moderate":
            if status == RiskLevel.GREEN:
                status = RiskLevel.AMBER
                score = 0.7
            issues.append(f"High aspect ratio ({aspect_ratio:.1f}) may affect steering precision")
            suggestions.append("Consider active steering mechanisms")

    # Very short/thick morphology
    if aspect_ratio < 0.5:
        if status == RiskLevel.GREEN:
            status = RiskLevel.AMBER
            score = 0.75
        issues.append(f"Low aspect ratio ({aspect_ratio:.1f}) may limit workspace")
        suggestions.append("Consider elongation mechanisms or different morphology")

    return DimensionResult(
        name=DimensionName.MORPHOLOGY,
        status=status,
        score=score,
        issues=issues,
        suggestions=suggestions,
    )


def evaluate_control_latency(spec: Dict) -> DimensionResult:
    """Evaluate control latency dimension."""
    actuator = spec.get("actuator", "").lower()
    latency_budget_ms = spec.get("latency_budget_ms", 1000)
    length_mm = spec.get("length_mm", 0.0)
    control_strategy = spec.get("control_strategy", "").lower()
    target_env = spec.get("target_env", "").lower()

    actuator_profile = presets.get_actuator_profile(actuator)
    env_profile = presets.get_environment_profile(target_env)

    issues: List[str] = []
    suggestions: List[str] = []
    status = RiskLevel.GREEN
    score = 0.9

    # Estimate expected latency (deterministic heuristic)
    base_latency_ms = 50  # Base system latency
    actuator_latency_ms = 0

    if actuator_profile:
        latency_level = actuator_profile.get("latency", "moderate")
        if latency_level == "low":
            actuator_latency_ms = 10
        elif latency_level == "moderate":
            actuator_latency_ms = 30
        else:  # high
            actuator_latency_ms = 100

    # Length-dependent latency (propagation delay estimate)
    length_factor = max(1.0, length_mm / 100.0)  # 1ms per 100mm roughly
    length_latency_ms = length_factor * 5

    expected_latency_ms = base_latency_ms + actuator_latency_ms + length_latency_ms

    # Compare to budget
    margin = latency_budget_ms - expected_latency_ms
    margin_ratio = margin / latency_budget_ms if latency_budget_ms > 0 else 0

    if margin < 0:
        status = RiskLevel.RED
        score = 0.3
        issues.append(f"Expected latency ({expected_latency_ms:.0f}ms) exceeds budget ({latency_budget_ms}ms)")
        suggestions.append("Consider faster actuator or reduce length")
    elif margin_ratio < 0.2:
        status = RiskLevel.AMBER
        score = 0.6
        issues.append(f"Tight latency margin ({margin:.0f}ms) between expected ({expected_latency_ms:.0f}ms) and budget ({latency_budget_ms}ms)")
        suggestions.append("Consider latency optimization strategies")
    elif margin_ratio < 0.4:
        if status == RiskLevel.GREEN:
            status = RiskLevel.AMBER
            score = 0.75
        issues.append(f"Moderate latency margin ({margin:.0f}ms)")
        suggestions.append("Monitor latency in implementation")

    # Control strategy in complex environments
    complexity = env_profile.get("complexity", "low") if env_profile else "low"
    if control_strategy == "open_loop" and complexity == "high":
        if status == RiskLevel.GREEN:
            status = RiskLevel.AMBER
            score = 0.65
        issues.append("Open-loop control risky in high-complexity environments")
        suggestions.append("Consider closed-loop or model-based control")

    return DimensionResult(
        name=DimensionName.CONTROL_LATENCY,
        status=status,
        score=score,
        issues=issues,
        suggestions=suggestions,
    )


def evaluate_environment_interface(spec: Dict) -> DimensionResult:
    """Evaluate environment interface dimension."""
    material = spec.get("material", "").lower()
    actuator = spec.get("actuator", "").lower()
    target_env = spec.get("target_env", "").lower()

    material_profile = presets.get_material_profile(material)
    actuator_profile = presets.get_actuator_profile(actuator)
    env_profile = presets.get_environment_profile(target_env)

    issues: List[str] = []
    suggestions: List[str] = []
    status = RiskLevel.GREEN
    score = 0.9

    if not env_profile:
        status = RiskLevel.RED
        score = 0.2
        issues.append(f"Unknown environment: {target_env}")
        return DimensionResult(
            name=DimensionName.ENVIRONMENT_INTERFACE,
            status=status,
            score=score,
            issues=issues,
            suggestions=suggestions,
        )

    # Sealing requirements
    if env_profile.get("requires_sealing"):
        if actuator in ["pneumatic", "hydraulic"]:
            if status == RiskLevel.GREEN:
                status = RiskLevel.AMBER
                score = 0.7
            issues.append(f"{actuator} actuation requires sealing for {target_env}")
            suggestions.append("Ensure robust sealing design and testing")

    # Biointerface requirements
    if env_profile.get("requires_biointerface"):
        if material_profile and not material_profile.get("biointerface"):
            status = RiskLevel.AMBER
            score = 0.6
            issues.append(f"Material {material} may not provide adequate biointerface for {target_env}")
            suggestions.append("Consider hydrogel or bio-compatible materials")

    # Low friction requirements
    if env_profile.get("requires_low_friction"):
        if material_profile and material_profile.get("anisotropy"):
            if status == RiskLevel.GREEN:
                status = RiskLevel.AMBER
                score = 0.75
            issues.append("Anisotropic materials may have directional friction")
            suggestions.append("Consider surface treatment or coating for low friction")

    # Corrosion resistance
    if env_profile.get("requires_corrosion_resistance"):
        if material == "hydrogel":
            status = RiskLevel.AMBER
            score = 0.65
            issues.append("Hydrogel may degrade in corrosive environments")
            suggestions.append("Consider silicone or fabric_composite for better durability")

    return DimensionResult(
        name=DimensionName.ENVIRONMENT_INTERFACE,
        status=status,
        score=score,
        issues=issues,
        suggestions=suggestions,
    )


def evaluate_integration(spec: Dict) -> DimensionResult:
    """Evaluate integration dimension."""
    sensing = spec.get("sensing", [])
    target_env = spec.get("target_env", "").lower()
    control_strategy = spec.get("control_strategy", "").lower()
    actuator = spec.get("actuator", "").lower()

    env_profile = presets.get_environment_profile(target_env)
    actuator_profile = presets.get_actuator_profile(actuator)

    issues: List[str] = []
    suggestions: List[str] = []
    status = RiskLevel.GREEN
    score = 0.9

    complexity = env_profile.get("complexity", "low") if env_profile else "low"

    # Sensing in complex environments
    if complexity == "high" and not sensing:
        status = RiskLevel.RED
        score = 0.3
        issues.append("No sensing specified for high-complexity environment")
        suggestions.append("Add pressure, position, or force sensing for closed-loop control")
    elif complexity == "moderate" and not sensing:
        if status == RiskLevel.GREEN:
            status = RiskLevel.AMBER
            score = 0.65
        issues.append("No sensing specified for moderate-complexity environment")
        suggestions.append("Consider adding sensing for improved control")

    # Closed-loop without sensing
    if control_strategy == "closed_loop" and not sensing:
        status = RiskLevel.RED
        score = 0.25
        issues.append("Closed-loop control requires sensing but none specified")
        suggestions.append("Add appropriate sensors (pressure, position, force)")

    # Multiple high-demand features
    feature_count = 0
    if actuator_profile and actuator_profile.get("needs_pressure_source"):
        feature_count += 1
    if actuator_profile and actuator_profile.get("needs_routing"):
        feature_count += 1
    if len(sensing) > 2:
        feature_count += 1
    if control_strategy == "model_based":
        feature_count += 1

    if feature_count >= 3:
        if status == RiskLevel.GREEN:
            status = RiskLevel.AMBER
            score = 0.7
        issues.append("High integration complexity from multiple demanding features")
        suggestions.append("Consider phased integration or simplified initial design")

    return DimensionResult(
        name=DimensionName.INTEGRATION,
        status=status,
        score=score,
        issues=issues,
        suggestions=suggestions,
    )


