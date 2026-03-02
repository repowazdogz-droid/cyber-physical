"""
Preset profiles for materials, actuators, environments, and scale classification.
"""

from typing import Dict, Optional


# Material profiles
MATERIAL_PROFILES: Dict[str, Dict[str, any]] = {
    "silicone": {
        "compliance": "high",
        "temperature_limit": "moderate",
        "fatigue_resistance": "moderate",
        "manufacturing_maturity": "high",
        "biointerface": False,
        "anisotropy": False,
        "damping": "moderate",
        "force_density": "moderate",
        "durability": "high",
    },
    "elastomer_gel": {
        "compliance": "very_high",
        "temperature_limit": "moderate",
        "fatigue_resistance": "moderate",
        "manufacturing_maturity": "low",
        "biointerface": False,
        "anisotropy": False,
        "damping": "high",
        "force_density": "low",
        "durability": "moderate",
    },
    "fabric_composite": {
        "compliance": "moderate",
        "temperature_limit": "high",
        "fatigue_resistance": "high",
        "manufacturing_maturity": "moderate",
        "biointerface": False,
        "anisotropy": True,
        "damping": "low",
        "force_density": "high",
        "durability": "high",
    },
    "hydrogel": {
        "compliance": "high",
        "temperature_limit": "low",
        "fatigue_resistance": "low",
        "manufacturing_maturity": "low",
        "biointerface": True,
        "anisotropy": False,
        "damping": "high",
        "force_density": "low",
        "durability": "low",
    },
}

# Actuator profiles
ACTUATOR_PROFILES: Dict[str, Dict[str, any]] = {
    "pneumatic": {
        "compliance": "high",
        "latency": "moderate",
        "simplicity": "high",
        "force_density": "moderate",
        "precision": "moderate",
        "needs_pressure_source": True,
        "needs_routing": False,
        "response_time": "moderate",
        "thermal_coupling": False,
        "voltage_requirements": False,
    },
    "hydraulic": {
        "compliance": "moderate",
        "latency": "moderate",
        "simplicity": "moderate",
        "force_density": "high",
        "precision": "moderate",
        "needs_pressure_source": True,
        "needs_routing": False,
        "response_time": "moderate",
        "thermal_coupling": False,
        "voltage_requirements": False,
    },
    "tendon": {
        "compliance": "moderate",
        "latency": "low",
        "simplicity": "moderate",
        "force_density": "high",
        "precision": "high",
        "needs_pressure_source": False,
        "needs_routing": True,
        "response_time": "fast",
        "thermal_coupling": False,
        "voltage_requirements": False,
    },
    "shape_memory": {
        "compliance": "low",
        "latency": "high",
        "simplicity": "moderate",
        "force_density": "moderate",
        "precision": "moderate",
        "needs_pressure_source": False,
        "needs_routing": False,
        "response_time": "slow",
        "thermal_coupling": True,
        "voltage_requirements": False,
    },
    "EAP": {
        "compliance": "moderate",
        "latency": "low",
        "simplicity": "low",
        "force_density": "low",
        "precision": "high",
        "needs_pressure_source": False,
        "needs_routing": False,
        "response_time": "fast",
        "thermal_coupling": False,
        "voltage_requirements": True,
    },
}

# Environment profiles
ENVIRONMENT_PROFILES: Dict[str, Dict[str, any]] = {
    "dry_lab": {
        "requires_sealing": False,
        "requires_corrosion_resistance": False,
        "requires_biointerface": False,
        "requires_low_friction": False,
        "complexity": "low",
    },
    "in_body_endoluminal": {
        "requires_sealing": True,
        "requires_corrosion_resistance": True,
        "requires_biointerface": True,
        "requires_low_friction": True,
        "complexity": "high",
    },
    "underwater_ocean": {
        "requires_sealing": True,
        "requires_corrosion_resistance": True,
        "requires_biointerface": False,
        "requires_low_friction": False,
        "complexity": "moderate",
    },
    "field_env": {
        "requires_sealing": True,
        "requires_corrosion_resistance": True,
        "requires_biointerface": False,
        "requires_low_friction": False,
        "complexity": "high",
    },
}

# Scale buckets (diameter in mm)
SCALE_MICRO = (0.0, 5.0)
SCALE_SMALL = (5.0, 30.0)
SCALE_MEDIUM = (30.0, 150.0)
SCALE_LARGE = (150.0, float("inf"))


def classify_scale(diameter_mm: float) -> str:
    """Classify scale based on diameter."""
    if SCALE_MICRO[0] <= diameter_mm < SCALE_MICRO[1]:
        return "MICRO"
    elif SCALE_SMALL[0] <= diameter_mm < SCALE_SMALL[1]:
        return "SMALL"
    elif SCALE_MEDIUM[0] <= diameter_mm < SCALE_MEDIUM[1]:
        return "MEDIUM"
    elif diameter_mm >= SCALE_LARGE[0]:
        return "LARGE"
    else:
        return "UNKNOWN"


def get_material_profile(name: str) -> Optional[Dict[str, any]]:
    """Get material profile by name."""
    return MATERIAL_PROFILES.get(name)


def get_actuator_profile(name: str) -> Optional[Dict[str, any]]:
    """Get actuator profile by name."""
    return ACTUATOR_PROFILES.get(name)


def get_environment_profile(name: str) -> Optional[Dict[str, any]]:
    """Get environment profile by name."""
    return ENVIRONMENT_PROFILES.get(name)


