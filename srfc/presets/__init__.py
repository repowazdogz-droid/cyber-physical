"""
Preset loader for SRFC.

Loads anatomy, material, actuator, and safety presets from JSON files.
"""

import importlib.resources
import json
from typing import Dict, Any

from ..models import AnatomySpec, RobotMaterialSpec, SafetyEnvelopeSpec


def _load_json(filename: str) -> Dict[str, Any]:
    """Load a JSON file from the presets package."""
    try:
        with importlib.resources.open_text("srfc.presets", filename) as f:
            return json.load(f)
    except FileNotFoundError:
        raise FileNotFoundError(f"Preset file '{filename}' not found in srfc.presets")
    except Exception as e:
        raise RuntimeError(f"Failed to load preset file '{filename}': {e}")


def load_anatomy(name: str) -> AnatomySpec:
    """Load an anatomy specification by name."""
    data = _load_json("anatomies.json")
    if name not in data:
        available = ", ".join(data.keys())
        raise ValueError(f"Anatomy '{name}' not found. Available: {available}")
    
    anat_data = data[name]
    return AnatomySpec(
        name=anat_data["name"],
        lumen_min_mm=float(anat_data["lumen_min_mm"]),
        lumen_max_mm=float(anat_data["lumen_max_mm"]),
        max_curvature_deg_per_cm=float(anat_data["max_curvature_deg_per_cm"]),
        max_contact_pressure_kpa=float(anat_data["max_contact_pressure_kpa"]),
        notes=anat_data.get("notes", "")
    )


def load_material(name: str) -> RobotMaterialSpec:
    """Load a material specification by name."""
    data = _load_json("materials.json")
    if name not in data:
        available = ", ".join(data.keys())
        raise ValueError(f"Material '{name}' not found. Available: {available}")
    
    mat_data = data[name]
    return RobotMaterialSpec(
        name=mat_data["name"],
        youngs_modulus_kpa=float(mat_data["youngs_modulus_kpa"]),
        shore_hardness=float(mat_data["shore_hardness"]),
        friction_coeff=float(mat_data["friction_coeff"]),
        max_strain=float(mat_data["max_strain"]),
        notes=mat_data.get("notes", "")
    )


def load_actuator_preset(name: str) -> Dict[str, Any]:
    """Load an actuator preset by name (returns dict, not a dataclass)."""
    data = _load_json("actuators.json")
    if name not in data:
        available = ", ".join(data.keys())
        raise ValueError(f"Actuator preset '{name}' not found. Available: {available}")
    
    return data[name]


def load_safety_defaults(anatomy_name: str) -> SafetyEnvelopeSpec:
    """Load safety defaults, with anatomy-specific overrides if available."""
    data = _load_json("safety.json")
    
    # Try anatomy-specific first, fall back to defaults
    if anatomy_name in data:
        safety_data = data[anatomy_name]
    elif "defaults" in data:
        safety_data = data["defaults"]
    else:
        raise ValueError(f"No safety defaults found for anatomy '{anatomy_name}' and no 'defaults' entry")
    
    return SafetyEnvelopeSpec(
        max_tip_force_n=float(safety_data["max_tip_force_n"]),
        max_contact_pressure_kpa=float(safety_data["max_contact_pressure_kpa"]),
        max_dwell_time_min=float(safety_data["max_dwell_time_min"])
    )


def load_all_presets() -> Dict[str, Any]:
    """Load all presets into a dictionary."""
    return {
        "manufacturing": _load_json("manufacturing.json"),
    }
