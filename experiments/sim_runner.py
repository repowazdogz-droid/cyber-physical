"""Simplified physics simulation models for closed-loop experiments."""

import math
from typing import Dict, Any


def run_slip_experiment(friction_coeff: float, normal_force_n: float, surface_type: str) -> Dict[str, Any]:
    """
    Simulate slip experiment.
    
    Args:
        friction_coeff: Coefficient of friction
        normal_force_n: Normal force in Newtons
        surface_type: Surface type (steel, tissue, silicone, glass, textured)
        
    Returns:
        Dict with slipped (bool), slip_force_n, max_grip_force_n
    """
    # Surface-specific friction modifiers
    surface_modifiers = {
        "steel": 1.0,
        "tissue": 0.6,  # Wet tissue has lower friction
        "silicone": 0.8,
        "glass": 0.7,
        "textured": 1.2  # Textured surface increases effective friction
    }
    
    effective_friction = friction_coeff * surface_modifiers.get(surface_type, 1.0)
    
    # Maximum grip force before slip
    max_grip_force_n = effective_friction * normal_force_n
    
    # Slip occurs if tangential force exceeds max grip force
    # For simulation, assume tangential force is 70% of max grip (typical operating condition)
    tangential_force_n = 0.7 * max_grip_force_n
    
    slipped = tangential_force_n > max_grip_force_n
    
    return {
        "slipped": slipped,
        "slip_force_n": max_grip_force_n,
        "max_grip_force_n": max_grip_force_n,
        "tangential_force_n": tangential_force_n,
        "effective_friction": effective_friction
    }


def run_force_experiment(applied_force_n: float, tissue_stiffness: float, gripper_config: str) -> Dict[str, Any]:
    """
    Simulate force/deformation experiment.
    
    Args:
        applied_force_n: Applied force in Newtons
        tissue_stiffness: Tissue stiffness in N/mm
        gripper_config: Gripper configuration (soft, medium, rigid)
    
    Returns:
        Dict with max_deformation_mm, tissue_damage (bool), force_profile
    """
    # Gripper compliance modifiers
    compliance_modifiers = {
        "soft": 1.5,  # More compliant
        "medium": 1.0,
        "rigid": 0.5  # Less compliant
    }
    
    compliance = compliance_modifiers.get(gripper_config, 1.0)
    
    # Deformation = force / stiffness (simplified linear model)
    deformation_mm = (applied_force_n / tissue_stiffness) * compliance
    
    # Tissue damage threshold (typical: 0.5-2.0 mm depending on tissue type)
    damage_threshold_mm = 1.5  # Conservative threshold
    
    tissue_damage = deformation_mm > damage_threshold_mm
    
    # Force profile (simplified: linear ramp)
    force_profile = {
        "time_s": [0, 0.1, 0.2, 0.3],
        "force_n": [0, applied_force_n * 0.5, applied_force_n * 0.8, applied_force_n]
    }
    
    return {
        "max_deformation_mm": deformation_mm,
        "tissue_damage": tissue_damage,
        "force_profile": force_profile,
        "damage_threshold_mm": damage_threshold_mm
    }


def run_fatigue_experiment(cycles: int, load_n: float, material: str) -> Dict[str, Any]:
    """
    Simulate fatigue experiment.
    
    Args:
        cycles: Number of cycles
        load_n: Load in Newtons
        material: Material type (silicone, rubber, polymer)
    
    Returns:
        Dict with cycles_to_failure, degradation_pct
    """
    # Material-specific fatigue properties
    fatigue_properties = {
        "silicone": {"endurance_limit_n": 5.0, "fatigue_coefficient": 1e6},
        "rubber": {"endurance_limit_n": 8.0, "fatigue_coefficient": 2e6},
        "polymer": {"endurance_limit_n": 10.0, "fatigue_coefficient": 5e6}
    }
    
    props = fatigue_properties.get(material, fatigue_properties["silicone"])
    endurance_limit = props["endurance_limit_n"]
    fatigue_coeff = props["fatigue_coefficient"]
    
    # Simplified fatigue model: N = N0 * (S_endurance / S_actual)^b
    # Where b ≈ 3 for elastomers
    if load_n <= endurance_limit:
        cycles_to_failure = float('inf')
    else:
        stress_ratio = load_n / endurance_limit
        cycles_to_failure = fatigue_coeff / (stress_ratio ** 3)
    
    # Degradation percentage (linear accumulation)
    if cycles_to_failure == float('inf'):
        degradation_pct = 0.0
    else:
        degradation_pct = min(100.0, (cycles / cycles_to_failure) * 100.0)
    
    return {
        "cycles_to_failure": cycles_to_failure if cycles_to_failure != float('inf') else 1e9,
        "degradation_pct": degradation_pct,
        "failed": degradation_pct >= 100.0
    }


def run_thermal_experiment(power_w: float, duty_cycle: float, duration_s: float, cooling: str) -> Dict[str, Any]:
    """
    Simulate thermal experiment.
    
    Args:
        power_w: Power dissipation in Watts
        duty_cycle: Duty cycle (0.0-1.0)
        duration_s: Duration in seconds
        cooling: Cooling type (none, passive, active_fan)
    
    Returns:
        Dict with peak_temp_c, steady_state_temp_c, overheated (bool)
    """
    # Cooling efficiency
    cooling_efficiency = {
        "none": 0.0,
        "passive": 0.3,
        "active_fan": 0.7
    }
    
    efficiency = cooling_efficiency.get(cooling, 0.0)
    
    # Thermal model: T = T_ambient + (P * (1 - efficiency)) / (h * A)
    # Simplified: T = T_ambient + P_effective / thermal_resistance
    ambient_temp_c = 25.0  # Room temperature
    thermal_resistance = 0.5  # K/W (typical for small actuator)
    
    effective_power = power_w * duty_cycle * (1.0 - efficiency)
    steady_state_temp_c = ambient_temp_c + (effective_power / thermal_resistance)
    
    # Transient response (simplified exponential)
    thermal_time_constant = 60.0  # seconds
    if duration_s < thermal_time_constant:
        # Still heating up
        temp_ratio = 1.0 - math.exp(-duration_s / thermal_time_constant)
        peak_temp_c = ambient_temp_c + (steady_state_temp_c - ambient_temp_c) * temp_ratio
    else:
        # Reached steady state
        peak_temp_c = steady_state_temp_c
    
    # Overheat threshold (typical: 60-70°C for soft actuators)
    overheat_threshold_c = 65.0
    overheated = peak_temp_c > overheat_threshold_c
    
    return {
        "peak_temp_c": peak_temp_c,
        "steady_state_temp_c": steady_state_temp_c,
        "overheated": overheated,
        "overheat_threshold_c": overheat_threshold_c,
        "effective_power_w": effective_power
    }
