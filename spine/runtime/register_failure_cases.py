#!/usr/bin/env python3
"""Register failure injection cases in the registry."""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from spine.runtime.registry import CaseRegistry

registry = CaseRegistry(registry_path=str(Path(__file__).parent / "test_registry"))

# Case data manually extracted from YAML files
failure_cases_data = [
    {
        "name": "Top-heavy gripper with COG outside support polygon",
        "domain": "robotic_design",
        "constraints": [
            "gripper_mass: 2.5kg",
            "payload_mass: 1.0kg",
            "total_mass: 3.5kg",
            "center_of_mass_height: 0.45m",
            "support_polygon_width: 0.08m",
            "must_not_tip_over",
            "must_not_slip"
        ],
        "uncertainties": [
            "surface_friction_coefficient: 0.6",
            "payload_distribution: unknown"
        ],
        "objectives": ["stable_grasping", "precise_manipulation"],
        "design": {
            "mass_kg": 3.5,
            "cog_height_m": 0.45,
            "support_width_m": 0.08,
            "tip_over_margin": -0.12
        },
        "metadata": {
            "injected_failure": "center_of_mass_instability",
            "expected_detection": "Mass limit violation OR tip-over failure mode",
            "decision_delta_target": 3
        }
    },
    {
        "name": "Joint torque exceeds actuator limit",
        "domain": "robotic_design",
        "constraints": [
            "max_joint_torque: 8.5Nm",
            "actuator_limit: 6.0Nm",
            "must_not_exceed_actuator_limits",
            "smooth_motion_required"
        ],
        "uncertainties": [
            "dynamic_load_variation: unknown_range",
            "friction_model_accuracy: low"
        ],
        "objectives": ["adequate_grip_force", "precise_positioning"],
        "design": {
            "max_torque_nm": 8.5,
            "actuator_limit_nm": 6.0,
            "violation_margin": -2.5
        },
        "metadata": {
            "injected_failure": "excessive_torque",
            "expected_detection": "Force limit violation OR excessive force damage failure mode",
            "decision_delta_target": 3
        }
    },
    {
        "name": "Low friction coefficient on wet tissue",
        "domain": "robotic_design",
        "constraints": [
            "grip_force: 5.0N",
            "normal_force: 8.0N",
            "friction_coefficient: 0.1",
            "must_not_slip",
            "tissue_surface: wet"
        ],
        "uncertainties": [
            "tissue_compliance: unknown_range",
            "surface_wetness_variation: high"
        ],
        "objectives": ["secure_grasping", "no_tissue_damage"],
        "design": {
            "friction_coefficient": 0.1,
            "max_friction_force_n": 0.8,
            "required_grip_n": 5.0,
            "slip_margin": -4.2
        },
        "metadata": {
            "injected_failure": "insufficient_grip_friction",
            "expected_detection": "Slip under load failure mode",
            "decision_delta_target": 3
        }
    },
    {
        "name": "Range of motion exceeds joint limit",
        "domain": "robotic_design",
        "constraints": [
            "required_joint_angle: 185_degrees",
            "joint_limit: 170_degrees",
            "must_not_exceed_joint_limits",
            "full_workspace_access"
        ],
        "uncertainties": [
            "workspace_requirements: variable",
            "joint_clearance_tolerance: unknown"
        ],
        "objectives": ["adequate_reach", "smooth_articulation"],
        "design": {
            "required_angle_deg": 185,
            "joint_limit_deg": 170,
            "violation_deg": 15
        },
        "metadata": {
            "injected_failure": "joint_binding",
            "expected_detection": "Joint limit violation OR mechanical interference",
            "decision_delta_target": 2
        }
    },
    {
        "name": "Jerk exceeds safety limit",
        "domain": "robotic_design",
        "constraints": [
            "max_acceleration: 45mps2",
            "jerk_limit: 500mps3",
            "actual_jerk: 750mps3",
            "must_not_exceed_jerk_limits",
            "smooth_motion"
        ],
        "uncertainties": [
            "control_bandwidth: unknown",
            "vibration_response: untested"
        ],
        "objectives": ["fast_positioning", "patient_comfort"],
        "design": {
            "max_acceleration_mps2": 45,
            "jerk_limit_mps3": 500,
            "actual_jerk_mps3": 750,
            "violation_mps3": 250
        },
        "metadata": {
            "injected_failure": "acceleration_spike",
            "expected_detection": "Acceleration limit violation",
            "decision_delta_target": 2
        }
    },
    {
        "name": "Payload exceeds rated capacity",
        "domain": "robotic_design",
        "constraints": [
            "payload_mass: 15.0kg",
            "arm_rated_capacity: 10.0kg",
            "must_not_exceed_mass_limit",
            "safe_operation"
        ],
        "uncertainties": [
            "dynamic_load_multiplier: 1.2-1.5",
            "fatigue_degradation: unknown"
        ],
        "objectives": ["adequate_payload_capacity", "long_term_reliability"],
        "design": {
            "payload_mass_kg": 15.0,
            "rated_capacity_kg": 10.0,
            "violation_kg": 5.0
        },
        "metadata": {
            "injected_failure": "mass_violation",
            "expected_detection": "Mass limit formal constraint violation",
            "decision_delta_target": 3
        }
    },
    {
        "name": "Two links intersect at operating configuration",
        "domain": "robotic_design",
        "constraints": [
            "link1_radius: 0.025m",
            "link2_radius: 0.030m",
            "minimum_clearance_required: 0.01m",
            "operating_config: [45deg, 120deg, -30deg]",
            "must_not_self_collide"
        ],
        "uncertainties": [
            "clearance_tolerance: unknown",
            "deformation_under_load: variable"
        ],
        "objectives": ["full_workspace_access", "collision_free_motion"],
        "design": {
            "min_clearance_mm": 1.0,
            "actual_clearance_mm": -3.0,
            "self_collision_detected": True,
            "collision_pairs": ["link1", "link2"]
        },
        "metadata": {
            "injected_failure": "self_collision",
            "expected_detection": "Self-collision formal constraint violation",
            "decision_delta_target": 3
        }
    },
    {
        "name": "Continuous load at 95% actuator capacity",
        "domain": "robotic_design",
        "constraints": [
            "continuous_load: 5.7Nm",
            "actuator_continuous_rating: 6.0Nm",
            "duty_cycle: 100%",
            "must_not_exceed_continuous_rating",
            "thermal_management_required"
        ],
        "uncertainties": [
            "thermal_rise_rate: unknown",
            "cooling_efficiency: variable"
        ],
        "objectives": ["sustained_operation", "thermal_safety"],
        "design": {
            "continuous_load_nm": 5.7,
            "continuous_rating_nm": 6.0,
            "utilization_percent": 95.0,
            "thermal_margin": 0.3
        },
        "metadata": {
            "injected_failure": "actuator_saturation",
            "expected_detection": "Thermal overload risk OR force limit concern",
            "decision_delta_target": 2
        }
    },
    {
        "name": "Operating frequency near structural resonance",
        "domain": "robotic_design",
        "constraints": [
            "operating_frequency: 48Hz",
            "structural_resonance: 50Hz",
            "frequency_separation_required: 10Hz",
            "must_avoid_resonance",
            "vibration_control"
        ],
        "uncertainties": [
            "damping_ratio: unknown_range",
            "mode_shape_variation: variable"
        ],
        "objectives": ["stable_operation", "low_vibration"],
        "design": {
            "operating_freq_hz": 48,
            "resonance_freq_hz": 50,
            "separation_hz": 2.0,
            "required_separation_hz": 10.0,
            "violation_hz": -8.0
        },
        "metadata": {
            "injected_failure": "resonance_excitation",
            "expected_detection": "Resonance risk OR vibration failure mode",
            "decision_delta_target": 2
        }
    },
    {
        "name": "Motor duty cycle causes thermal overload",
        "domain": "robotic_design",
        "constraints": [
            "motor_power: 45W",
            "duty_cycle: 95%",
            "thermal_capacity: 50W_continuous",
            "ambient_temp: 35C",
            "must_not_overheat",
            "thermal_safety_critical"
        ],
        "uncertainties": [
            "heat_sink_efficiency: unknown",
            "ambient_variation: high"
        ],
        "objectives": ["continuous_operation", "thermal_stability"],
        "design": {
            "motor_power_w": 45,
            "duty_cycle_percent": 95,
            "effective_power_w": 42.75,
            "thermal_capacity_w": 50,
            "margin_w": 7.25,
            "estimated_temp_rise_c": 85
        },
        "metadata": {
            "injected_failure": "thermal_runaway",
            "expected_detection": "Thermal overload risk OR material degradation",
            "decision_delta_target": 2
        }
    }
]

print("Registering failure injection cases...")

for case_data in failure_cases_data:
    case_yaml_dict = {
        "problem": {
            "name": case_data["name"],
            "domain": case_data["domain"]
        },
        "constraints": case_data["constraints"],
        "uncertainties": case_data["uncertainties"],
        "objectives": case_data["objectives"],
        "metadata": case_data["metadata"]
    }
    
    case_id = registry.register_case(
        name=case_data["name"],
        domain=case_data["domain"],
        case_yaml=case_yaml_dict,
        design_data=case_data.get("design"),
        tags=["failure_injection", "physics", "test"],
        notes=f"Injected failure: {case_data['metadata']['injected_failure']}"
    )
    print(f"Registered: {case_id} - {case_data['name'][:50]}...")

print(f"\nTotal cases in registry: {len(registry.list_cases())}")
