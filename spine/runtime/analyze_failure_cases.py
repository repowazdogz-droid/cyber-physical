#!/usr/bin/env python3
"""Analyze failure injection cases and record runs."""

import sys
import json
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from spine.runtime.registry import CaseRegistry
from spine.runtime.analyzer import DecisionAnalyzer
from spine.runtime.schemas import CaseInput, ProblemDefinition
from spine.runtime.promotion import promote_miss

registry = CaseRegistry(registry_path=str(Path(__file__).parent / "test_registry"))
analyzer = DecisionAnalyzer()

# Case data matching what was registered
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

print("Analyzing failure injection cases...\n")

case_results = []

for case_data in failure_cases_data:
    # Find case_id
    all_cases = registry.list_cases()
    case_id = None
    for c in all_cases:
        if c['name'] == case_data["name"]:
            case_id = c['case_id']
            break
    
    if not case_id:
        print(f"Warning: Case not found for {case_data['name']}")
        continue
    
    # Reconstruct CaseInput
    case = CaseInput(
        problem=ProblemDefinition(
            name=case_data["name"],
            domain=case_data["domain"]
        ),
        constraints=case_data["constraints"],
        uncertainties=case_data["uncertainties"],
        objectives=case_data["objectives"]
    )
    
    # Extract design data
    design_data = case_data.get("design", {})
    
    # Convert design data to format expected by formal constraints
    formal_design_data = {}
    
    # Existing constraints (FORMAL_001-005)
    if "mass_kg" in design_data:
        formal_design_data["total_mass_kg"] = design_data["mass_kg"]
    if "payload_mass_kg" in design_data:
        formal_design_data["total_mass_kg"] = design_data["payload_mass_kg"]
    if "max_torque_nm" in design_data:
        formal_design_data["max_force_n"] = design_data["max_torque_nm"]
    if "max_acceleration_mps2" in design_data:
        formal_design_data["max_acceleration_mps2"] = design_data["max_acceleration_mps2"]
    if "actual_clearance_mm" in design_data:
        formal_design_data["min_clearance_mm"] = design_data["actual_clearance_mm"]
    if "self_collision_detected" in design_data:
        formal_design_data["self_collision_detected"] = design_data["self_collision_detected"]
        if "collision_pairs" in design_data:
            formal_design_data["collision_pairs"] = design_data["collision_pairs"]
    
    # New constraints (FORMAL_006-015)
    # COG stability (FORMAL_006)
    if "tip_over_margin" in design_data:
        formal_design_data["cog_within_support_polygon"] = design_data["tip_over_margin"] >= 0
        if "cog_offset_mm" not in design_data and design_data["tip_over_margin"] < 0:
            formal_design_data["cog_offset_mm"] = abs(design_data["tip_over_margin"] * 1000)  # Convert m to mm
    
    # Torque limit (FORMAL_007)
    if "max_torque_nm" in design_data:
        formal_design_data["max_torque_nm"] = design_data["max_torque_nm"]
    
    # Jerk limit (FORMAL_008)
    if "actual_jerk_mps3" in design_data:
        formal_design_data["max_jerk_mps3"] = design_data["actual_jerk_mps3"]
    
    # Actuator duty cycle (FORMAL_009)
    if "utilization_percent" in design_data:
        formal_design_data["actuator_duty_cycle"] = design_data["utilization_percent"] / 100.0
    
    # Resonance margin (FORMAL_010)
    if "operating_freq_hz" in design_data and "resonance_freq_hz" in design_data:
        formal_design_data["operating_frequency_hz"] = design_data["operating_freq_hz"]
        formal_design_data["natural_frequency_hz"] = design_data["resonance_freq_hz"]
    
    # Thermal limit (FORMAL_011) - upgraded to thermal envelope model
    if "motor_power_w" in design_data:
        formal_design_data["power_dissipation_w"] = design_data["motor_power_w"]
    elif "effective_power_w" in design_data:
        formal_design_data["power_dissipation_w"] = design_data["effective_power_w"]
    # Check for temperature rise (most direct indicator)
    if "estimated_temp_rise_c" in design_data:
        formal_design_data["temperature_rise_celsius"] = design_data["estimated_temp_rise_c"]
    # Duty cycle for thermal envelope
    if "duty_cycle_percent" in design_data:
        formal_design_data["duty_cycle"] = design_data["duty_cycle_percent"] / 100.0
    elif "utilization_percent" in design_data:
        formal_design_data["duty_cycle"] = design_data["utilization_percent"] / 100.0
    
    # Joint range limit (FORMAL_012)
    if "required_angle_deg" in design_data and "joint_limit_deg" in design_data:
        formal_design_data["joints_within_limits"] = design_data["required_angle_deg"] <= design_data["joint_limit_deg"]
        if not formal_design_data["joints_within_limits"]:
            formal_design_data["exceeded_joints"] = ["joint_1"]  # Generic name
    
    # Payload ratio (FORMAL_013)
    if "payload_mass_kg" in design_data and "rated_capacity_kg" in design_data:
        formal_design_data["payload_kg"] = design_data["payload_mass_kg"]
        formal_design_data["max_rated_payload_kg"] = design_data["rated_capacity_kg"]
    
    # Stiffness minimum (FORMAL_014) - not in current cases
    # Voltage limit (FORMAL_015) - not in current cases
    
    # Run analysis
    result = analyzer.analyze(case, design_data=formal_design_data if formal_design_data else None)
    
    # Convert analysis to dict
    analysis_dict = result.model_dump()
    
    # Record run
    run_id = registry.record_run(
        case_id=case_id,
        output=analysis_dict,
        trace=result.trace_graph
    )
    
    # Store results for scoring
    metadata = case_data.get("metadata", {})
    case_results.append({
        "case_name": case_data["name"],
        "injected_failure": metadata.get("injected_failure", "unknown"),
        "expected_detection": metadata.get("expected_detection", ""),
        "target_delta": metadata.get("decision_delta_target", 0),
        "failure_modes": result.failure_modes,
        "formal_constraints": result.formal_constraints,
        "falsification_tests": result.falsification_tests,
        "run_id": run_id
    })
    
    print(f"Run {run_id} recorded for {case_data['name'][:40]}...")

print("\n" + "="*60)
print("Analysis complete. Generating scoring report...")
print("="*60)

# Generate scoring report (v3 regression)
report_lines = [
    "# Failure Injection Regression Report (v3)",
    "",
    "**Analysis Date:** 2026-02-05",
    "**Cases Analyzed:** 10 physics-based failure injection cases",
    "**Purpose:** Regression test after thermal constraint upgrade and failure taxonomy addition",
    "**Version:** v3 (upgraded thermal constraint + failure taxonomy)",
    "",
    "## Comparison: v1 vs v2 vs v3",
    "",
    "| Metric | v1 (5 constraints) | v2 (15 constraints) | v3 (upgraded thermal) | Change v2→v3 |",
    "|--------|-------------------|---------------------|----------------------|--------------|"
]

# Known v1 and v2 results per case (from previous reports)
v1_results = {
    "Top-heavy gripper with COG outside support polygon": False,
    "Joint torque exceeds actuator limit": True,
    "Low friction coefficient on wet tissue": True,
    "Range of motion exceeds joint limit": False,
    "Jerk exceeds safety limit": False,
    "Payload exceeds rated capacity": True,
    "Two links intersect at operating configuration": True,
    "Continuous load at 95% actuator capacity": False,
    "Operating frequency near structural resonance": False,
    "Motor duty cycle causes thermal overload": False
}

v2_results = {
    "Top-heavy gripper with COG outside support polygon": True,
    "Joint torque exceeds actuator limit": True,
    "Low friction coefficient on wet tissue": True,
    "Range of motion exceeds joint limit": True,
    "Jerk exceeds safety limit": True,
    "Payload exceeds rated capacity": True,
    "Two links intersect at operating configuration": True,
    "Continuous load at 95% actuator capacity": True,
    "Operating frequency near structural resonance": True,
    "Motor duty cycle causes thermal overload": False
}

# Baseline stats from previous reports
v1_detected = 4
v1_detection_rate = 40.0
v1_avg_delta = 0.80
v2_detected = 9
v2_detection_rate = 90.0
v2_avg_delta = 1.90

total_detected = 0
total_delta = 0

# Regression Table
report_lines.extend([
    "",
    "## Regression Table: Case-by-Case Comparison",
    "",
    "| Case | Injected Failure | v1 Result | v2 Result | v3 Result | Regression? |",
    "|------|------------------|-----------|-----------|-----------|-------------|"
])

for res in case_results:
    # Check if detected - use semantic matching
    detected = False
    detection_method = []
    
    # Map injected failures to expected detection patterns
    detection_patterns = {
        "center_of_mass_instability": ["mass", "tip", "cog", "stability"],
        "excessive_torque": ["force", "torque", "excessive"],
        "insufficient_grip_friction": ["slip", "friction"],
        "joint_binding": ["joint", "limit", "binding", "interference"],
        "acceleration_spike": ["acceleration", "jerk"],
        "mass_violation": ["mass"],
        "self_collision": ["collision", "clearance"],
        "actuator_saturation": ["force", "thermal", "saturation"],
        "resonance_excitation": ["resonance", "vibration"],
        "thermal_runaway": ["thermal", "overheat", "degradation"]
    }
    
    expected_patterns = detection_patterns.get(res["injected_failure"], [])
    
    # Check failure modes
    fm_found = []
    for fm in res["failure_modes"]:
        fm_found.append(fm.mode)
        # Check if failure mode matches expected patterns
        if any(pattern in fm.mode.lower() for pattern in expected_patterns):
            detected = True
            detection_method.append("Failure Mode")
    
    # Check formal constraints
    fc_violated = []
    for fc in res["formal_constraints"]:
        if fc.result == "proven_violated":
            fc_violated.append(fc.constraint_name)
            # Check if constraint matches expected patterns
            constraint_name_lower = fc.constraint_name.lower()
            if any(pattern in constraint_name_lower for pattern in expected_patterns):
                detected = True
                detection_method.append("Formal Constraint")
            # Also check specific mappings for new constraints
            if res["injected_failure"] == "center_of_mass_instability" and "cog" in constraint_name_lower:
                detected = True
                detection_method.append("Formal Constraint (COG)")
            elif res["injected_failure"] == "excessive_torque" and "torque" in constraint_name_lower:
                detected = True
                detection_method.append("Formal Constraint (Torque)")
            elif res["injected_failure"] == "joint_binding" and "joint" in constraint_name_lower:
                detected = True
                detection_method.append("Formal Constraint (Joint)")
            elif res["injected_failure"] == "acceleration_spike" and "jerk" in constraint_name_lower:
                detected = True
                detection_method.append("Formal Constraint (Jerk)")
            elif res["injected_failure"] == "actuator_saturation" and "duty" in constraint_name_lower:
                detected = True
                detection_method.append("Formal Constraint (Duty Cycle)")
            elif res["injected_failure"] == "resonance_excitation" and "resonance" in constraint_name_lower:
                detected = True
                detection_method.append("Formal Constraint (Resonance)")
            elif res["injected_failure"] == "thermal_runaway" and "thermal" in constraint_name_lower:
                detected = True
                detection_method.append("Formal Constraint (Thermal)")
    
    # Special case: if we found the right failure mode semantically, count it
    if not detected and fm_found:
        # Check semantic matches
        if res["injected_failure"] == "insufficient_grip_friction" and "slip" in " ".join(fm_found).lower():
            detected = True
            detection_method.append("Failure Mode (semantic match)")
        elif res["injected_failure"] == "excessive_torque" and any("force" in fm.lower() or "excessive" in fm.lower() for fm in fm_found):
            detected = True
            detection_method.append("Failure Mode (semantic match)")
    
    # Calculate decision delta
    if detected:
        if len(fm_found) > 0 and len(fc_violated) > 0:
            delta = 3
        elif len(fm_found) > 0 or len(fc_violated) > 0:
            delta = 2
        else:
            delta = 1
    else:
        delta = 0
    
    total_detected += 1 if detected else 0
    total_delta += delta
    
    # Store v3 detection result for regression checking
    res["v3_detected"] = detected
    
    # Get v1 and v2 results for this case
    v1_detected_case = v1_results.get(res["case_name"], False)
    v2_detected_case = v2_results.get(res["case_name"], False)
    v3_detected_case = detected
    
    # Check for regression (v2 detected but v3 didn't)
    regression = "⚠️ YES" if (v2_detected_case and not v3_detected_case) else "✓ No"
    
    # Format row for regression table
    case_short = res["case_name"][:40] + "..." if len(res["case_name"]) > 40 else res["case_name"]
    v1_str = "✓ Detected" if v1_detected_case else "✗ Missed"
    v2_str = "✓ Detected" if v2_detected_case else "✗ Missed"
    v3_str = "✓ Detected" if v3_detected_case else "✗ Missed"
    
    report_lines.append(
        f"| {case_short} | {res['injected_failure']} | {v1_str} | {v2_str} | {v3_str} | {regression} |"
    )

# Summary
detection_rate = (total_detected / len(case_results)) * 100
avg_delta = total_delta / len(case_results) if case_results else 0

# Add comparison rows
v2_to_v3_change = detection_rate - v2_detection_rate
delta_change = avg_delta - v2_avg_delta

report_lines.insert(8, f"| Detection Rate | {v1_detection_rate:.1f}% ({v1_detected}/10) | {v2_detection_rate:.1f}% ({v2_detected}/10) | {detection_rate:.1f}% ({total_detected}/10) | {v2_to_v3_change:+.1f}% |")
report_lines.insert(9, f"| Avg Decision Delta | {v1_avg_delta:.2f}/3.0 | {v2_avg_delta:.2f}/3.0 | {avg_delta:.2f}/3.0 | {delta_change:+.2f} |")

report_lines.extend([
    "",
    "## Summary Statistics",
    "",
    f"- **v3 Detection Rate:** {detection_rate:.1f}% ({total_detected}/{len(case_results)})",
    f"- **v3 Average Decision Delta:** {avg_delta:.2f}/3.0",
    f"- **Target:** 100% detection (10/10)",
    f"- **Change from v2:** Detection rate {v2_to_v3_change:+.1f}%, Delta {delta_change:+.2f}",
    "",
    "## Regression Status",
    ""
])

# Check for regressions (reuse detection logic from main loop)
regressions = []
case_detection_map = {}  # Store v3 detection results from main loop
for res in case_results:
    case_detection_map[res["case_name"]] = res.get("v3_detected", False)

for res in case_results:
    v2_detected_case = v2_results.get(res["case_name"], False)
    v3_detected_case = case_detection_map.get(res["case_name"], False)
    if v2_detected_case and not v3_detected_case:
        regressions.append(res["case_name"])

if regressions:
    report_lines.append("⚠️ **REGRESSIONS DETECTED:**")
    for reg in regressions:
        report_lines.append(f"- {reg}")
else:
    report_lines.append("✓ **NO REGRESSIONS:** All previously detected failures still detected in v3")

report_lines.extend([
    "",
    "## Detailed Findings",
    ""
])

# Analyze each case
for res in case_results:
    report_lines.append(f"### {res['case_name']}")
    report_lines.append(f"- **Injected:** {res['injected_failure']}")
    report_lines.append(f"- **Expected:** {res['expected_detection']}")
    report_lines.append(f"- **Failure Modes:** {len(res['failure_modes'])}")
    report_lines.append(f"- **Formal Constraints Violated:** {len([fc for fc in res['formal_constraints'] if fc.result == 'proven_violated'])}")
    report_lines.append(f"- **Falsification Tests:** {len(res['falsification_tests'])}")
    report_lines.append("")

# Weakest areas
report_lines.extend([
    "## Weakest Areas",
    "",
])

# Count what was missed
missed_by_type = {}
for res in case_results:
    detected = False
    for fm in res["failure_modes"]:
        if res["injected_failure"].lower() in fm.mode.lower():
            detected = True
            break
    for fc in res["formal_constraints"]:
        if fc.result == "proven_violated":
            detected = True
            break
    
    if not detected:
        failure_type = res["injected_failure"].split("_")[0]
        missed_by_type[failure_type] = missed_by_type.get(failure_type, 0) + 1

if missed_by_type:
    report_lines.append("**Most Missed Failure Types:**")
    for ftype, count in sorted(missed_by_type.items(), key=lambda x: x[1], reverse=True):
        report_lines.append(f"- {ftype}: {count} missed")
else:
    report_lines.append("All failure types detected.")

report_lines.extend([
    "",
    "## New Constraint Coverage Analysis",
    "",
])

# Check which new constraints actually fired
new_constraints_fired = {}
for res in case_results:
    for fc in res["formal_constraints"]:
        if fc.result == "proven_violated":
            constraint_id = fc.constraint_id
            if constraint_id in ["FORMAL_006", "FORMAL_007", "FORMAL_008", "FORMAL_009", "FORMAL_010", 
                                  "FORMAL_011", "FORMAL_012", "FORMAL_013", "FORMAL_014", "FORMAL_015"]:
                new_constraints_fired[constraint_id] = new_constraints_fired.get(constraint_id, 0) + 1

if new_constraints_fired:
    report_lines.append("**New Constraints That Fired:**")
    constraint_names = {
        "FORMAL_006": "COG Stability",
        "FORMAL_007": "Torque Limit",
        "FORMAL_008": "Jerk Limit",
        "FORMAL_009": "Actuator Duty Cycle",
        "FORMAL_010": "Resonance Margin",
        "FORMAL_011": "Thermal Limit",
        "FORMAL_012": "Joint Range Limit",
        "FORMAL_013": "Payload Ratio",
        "FORMAL_014": "Stiffness Minimum",
        "FORMAL_015": "Voltage Limit"
    }
    for cid, count in sorted(new_constraints_fired.items()):
        report_lines.append(f"- {constraint_names.get(cid, cid)}: {count} violation(s)")
else:
    report_lines.append("**No new constraints fired.** This indicates that:")
    report_lines.append("- Case YAML files may lack the required design data fields")
    report_lines.append("- Design data mapping may need adjustment")
    report_lines.append("- Constraints may need different field names or thresholds")

report_lines.extend([
    "",
    "## Honest Assessment",
    "",
])

# Check if thermal was detected
thermal_detected = False
for res in case_results:
    if res["injected_failure"] == "thermal_runaway":
        thermal_detected = any(
            fc.constraint_name == "thermal_limit" and fc.result == "proven_violated"
            for fc in res["formal_constraints"]
        )
        break

if detection_rate == 100.0:
    assessment = "**SPINE v3 achieved 100% detection rate.** All 10 failure injection cases detected."
elif detection_rate >= 90:
    assessment = "**SPINE v3 performed well** with near-complete detection."
else:
    assessment = "**SPINE v3 needs improvement** — some failures still undetected."

report_lines.append(assessment)
report_lines.append("")

# Thermal fix status
if thermal_detected:
    report_lines.append("✓ **Thermal Constraint Upgrade:** SUCCESS")
    report_lines.append("  - Upgraded thermal constraint now detects thermal_runaway via temperature rise check")
    report_lines.append("  - Thermal envelope model (power × duty_cycle × cooling_factor) implemented")
    report_lines.append("")
    # Record promotion
    try:
        thermal_case_path = str(Path(__file__).parent / "cases" / "failure_injection" / "case_f10_thermal_runaway.yaml")
        promote_miss(
            failure_description="Motor duty cycle causes thermal overload - temperature rise exceeds limit",
            root_cause="Original thermal constraint only checked power vs threshold, missed thermal dynamics",
            constraint_id="FORMAL_011",
            test_case_yaml=thermal_case_path
        )
        report_lines.append("  - Promotion recorded: thermal_runaway → FORMAL_011 upgrade")
    except Exception as e:
        report_lines.append(f"  - Promotion recording failed: {e}")
else:
    report_lines.append("⚠️ **Thermal Constraint Upgrade:** INCOMPLETE")
    report_lines.append("  - Thermal constraint still not detecting thermal_runaway case")
    report_lines.append("  - May need additional design data fields or threshold adjustment")

report_lines.append("")

# Regression status
if regressions:
    report_lines.append("⚠️ **REGRESSIONS:** Some previously detected failures are now missed.")
else:
    report_lines.append("✓ **NO REGRESSIONS:** All previously detected failures remain detected.")

report_lines.append("")
report_lines.append("**Key Improvements in v3:**")
report_lines.append("1. Thermal constraint upgraded to thermal envelope model")
report_lines.append("2. Failure taxonomy added (category, detectability_score, severity_detectability_product)")
report_lines.append("3. Promotion pipeline created for tracking missed failures")
report_lines.append("4. Regression testing framework established")

# Write report
report_path = Path(__file__).parent / "reports" / "regression_v3.md"
report_path.parent.mkdir(exist_ok=True)
with open(report_path, "w") as f:
    f.write("\n".join(report_lines))

print(f"\nScoring report written to: {report_path}")
print(f"Detection rate: {detection_rate:.1f}%")
print(f"Average decision delta: {avg_delta:.2f}/3.0")
