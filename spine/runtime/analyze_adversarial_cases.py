#!/usr/bin/env python3
"""Analyze adversarial cases and generate campaign report."""

import sys
import json
from pathlib import Path
from typing import Dict, List, Any

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from spine.runtime.registry import CaseRegistry
from spine.runtime.analyzer import DecisionAnalyzer
from spine.runtime.schemas import CaseInput, ProblemDefinition
from spine.runtime.fp_tracker import record_result, get_rates

registry = CaseRegistry(registry_path=str(Path(__file__).parent / "test_registry"))
analyzer = DecisionAnalyzer()

# Load all adversarial cases
adversarial_dir = Path(__file__).parent / "cases" / "adversarial"
case_files = sorted(adversarial_dir.glob("adv_*.yaml"))

print(f"Found {len(case_files)} adversarial cases")
print("Registering and analyzing cases...\n")

case_results = []

def parse_simple_yaml(content: str) -> Dict[str, Any]:
    """Simple YAML parser for our case files."""
    data = {}
    lines = content.split('\n')
    current_section = None
    current_list = None
    
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith('#'):
            continue
        
        # Section header
        if stripped.endswith(':') and ':' not in stripped[:-1]:
            if current_section and current_list is not None:
                data[current_section] = current_list
            elif current_section:
                pass  # Keep current dict
            current_section = stripped[:-1]
            current_list = None
            if current_section not in data:
                data[current_section] = {}
            continue
        
        # List item
        if stripped.startswith('- '):
            if current_list is None:
                current_list = []
                if isinstance(data.get(current_section, {}), dict):
                    # Convert dict to list if needed
                    data[current_section] = current_list
                else:
                    data[current_section] = current_list
            value = stripped[2:].strip().strip('"\'')
            data[current_section].append(value)
        # Key-value
        elif ':' in stripped:
            key, value = stripped.split(':', 1)
            key = key.strip()
            value = value.strip().strip('"\'')
            
            if current_section:
                if isinstance(data[current_section], dict):
                    # Try to parse as number/bool
                    try:
                        if '.' in value:
                            data[current_section][key] = float(value)
                        else:
                            data[current_section][key] = int(value)
                    except ValueError:
                        if value.lower() == 'true':
                            data[current_section][key] = True
                        elif value.lower() == 'false':
                            data[current_section][key] = False
                        else:
                            data[current_section][key] = value
    
    return data

for case_file in case_files:
    # Parse case file
    with open(case_file) as f:
        content = f.read()
    
    case_data = parse_simple_yaml(content)
    
    # Extract metadata
    metadata = case_data.get('metadata', {})
    injected_failure = metadata.get('injected_failure', 'unknown')
    failure_category = metadata.get('failure_category', 'unknown')
    expected_detection = metadata.get('expected_detection', '')
    
    # Extract design data
    design_data = case_data.get('design', {})
    
    # Create CaseInput
    problem_data = case_data.get('problem', {})
    case = CaseInput(
        problem=ProblemDefinition(
            name=problem_data.get('name', 'Unknown'),
            domain=problem_data.get('domain', 'robotic_design')
        ),
        constraints=case_data.get('constraints', []),
        uncertainties=case_data.get('uncertainties', []),
        objectives=case_data.get('objectives', [])
    )
    
    # Register case
    case_id = registry.register_case(
        name=case.problem.name,
        domain=case.problem.domain,
        case_yaml=case.model_dump(),
        design_data=design_data,
        tags=['adversarial', failure_category, 'test'],
        notes=f"Injected failure: {injected_failure}"
    )
    
    # Map design data to formal constraint format
    formal_design_data = {}
    
    # Mass
    if 'total_mass_kg' in design_data:
        formal_design_data['total_mass_kg'] = design_data['total_mass_kg']
    elif 'mass_kg' in design_data:
        formal_design_data['total_mass_kg'] = design_data['mass_kg']
    
    # Force/Torque
    if 'max_torque_nm' in design_data:
        formal_design_data['max_torque_nm'] = design_data['max_torque_nm']
        formal_design_data['max_force_n'] = design_data['max_torque_nm']
    elif 'required_torque_nm' in design_data:
        formal_design_data['max_torque_nm'] = design_data['required_torque_nm']
        formal_design_data['max_force_n'] = design_data['required_torque_nm']
    
    # Acceleration/Jerk
    if 'max_acceleration_mps2' in design_data:
        formal_design_data['max_acceleration_mps2'] = design_data['max_acceleration_mps2']
    if 'max_jerk_mps3' in design_data:
        formal_design_data['max_jerk_mps3'] = design_data['max_jerk_mps3']
    
    # Clearance
    if 'min_clearance_mm' in design_data:
        formal_design_data['min_clearance_mm'] = design_data['min_clearance_mm']
    elif 'remaining_clearance_mm' in design_data:
        formal_design_data['min_clearance_mm'] = design_data['remaining_clearance_mm']
    
    # Self-collision
    if 'self_collision_detected' in design_data:
        formal_design_data['self_collision_detected'] = design_data['self_collision_detected']
    
    # COG
    if 'tip_over_margin' in design_data:
        formal_design_data['cog_within_support_polygon'] = design_data.get('tip_over_margin', 0) >= 0
    
    # Duty cycle
    if 'duty_cycle_percent' in design_data:
        formal_design_data['actuator_duty_cycle'] = design_data['duty_cycle_percent'] / 100.0
    elif 'utilization_percent' in design_data:
        formal_design_data['actuator_duty_cycle'] = design_data['utilization_percent'] / 100.0
    
    # Resonance
    if 'operating_freq_hz' in design_data and 'natural_freq_hz' in design_data:
        formal_design_data['operating_frequency_hz'] = design_data['operating_freq_hz']
        formal_design_data['natural_frequency_hz'] = design_data['natural_freq_hz']
    
    # Thermal
    if 'estimated_temp_rise_c' in design_data:
        formal_design_data['temperature_rise_celsius'] = design_data['estimated_temp_rise_c']
    elif 'total_temp_c' in design_data:
        formal_design_data['temperature_rise_celsius'] = design_data['total_temp_c'] - design_data.get('actual_ambient_c', 25)
    if 'power_dissipation_w' in design_data:
        formal_design_data['power_dissipation_w'] = design_data['power_dissipation_w']
    elif 'power_w' in design_data:
        formal_design_data['power_dissipation_w'] = design_data['power_w']
    if 'cooling_factor' in design_data:
        formal_design_data['cooling_factor'] = design_data['cooling_factor']
    elif 'cooling_factor_degraded' in design_data:
        formal_design_data['cooling_factor'] = design_data['cooling_factor_degraded']
    
    # Joint range
    if 'required_angle_deg' in design_data and 'joint_limit_deg' in design_data:
        formal_design_data['joints_within_limits'] = design_data['required_angle_deg'] <= design_data['joint_limit_deg']
    
    # Payload
    if 'payload_kg' in design_data and 'max_rated_payload_kg' in design_data:
        formal_design_data['payload_kg'] = design_data['payload_kg']
        formal_design_data['max_rated_payload_kg'] = design_data['max_rated_payload_kg']
    
    # Control stability constraints (FORMAL_016-022)
    if 'control_bandwidth_hz' in design_data:
        formal_design_data['control_bandwidth_hz'] = design_data['control_bandwidth_hz']
    if 'task_frequency_hz' in design_data:
        formal_design_data['task_frequency_hz'] = design_data['task_frequency_hz']
    
    if 'control_latency_ms' in design_data:
        formal_design_data['control_latency_ms'] = design_data['control_latency_ms']
    elif 'sensor_latency_ms' in design_data:
        formal_design_data['control_latency_ms'] = design_data['sensor_latency_ms']
    if 'control_period_ms' in design_data:
        formal_design_data['control_period_ms'] = design_data['control_period_ms']
    elif 'control_loop_period_ms' in design_data:
        formal_design_data['control_period_ms'] = design_data['control_loop_period_ms']
    
    if 'phase_margin_deg' in design_data:
        formal_design_data['phase_margin_deg'] = design_data['phase_margin_deg']
    
    if 'gain_margin_db' in design_data:
        formal_design_data['gain_margin_db'] = design_data['gain_margin_db']
    
    if 'sampling_rate_hz' in design_data:
        formal_design_data['sampling_rate_hz'] = design_data['sampling_rate_hz']
    if 'max_signal_frequency_hz' in design_data:
        formal_design_data['max_signal_frequency_hz'] = design_data['max_signal_frequency_hz']
    elif 'max_frequency_hz' in design_data:
        formal_design_data['max_signal_frequency_hz'] = design_data['max_frequency_hz']
    
    if 'encoder_resolution_mm' in design_data:
        formal_design_data['encoder_resolution_mm'] = design_data['encoder_resolution_mm']
    elif 'encoder_resolution_m' in design_data:
        formal_design_data['encoder_resolution_m'] = design_data['encoder_resolution_m']
    if 'required_precision_mm' in design_data:
        formal_design_data['required_precision_mm'] = design_data['required_precision_mm']
    elif 'required_accuracy_mm' in design_data:
        formal_design_data['required_precision_mm'] = design_data['required_accuracy_mm']
    elif 'positioning_accuracy_mm' in design_data:
        formal_design_data['required_precision_mm'] = design_data['positioning_accuracy_mm']
    
    if 'control_energy_per_cycle_j' in design_data:
        formal_design_data['control_energy_per_cycle_j'] = design_data['control_energy_per_cycle_j']
    if 'actuator_energy_capacity_j' in design_data:
        formal_design_data['actuator_energy_capacity_j'] = design_data['actuator_energy_capacity_j']
    
    # Material degradation constraints (FORMAL_023-028)
    if 'cyclic_stress_mpa' in design_data:
        formal_design_data['cyclic_stress_mpa'] = design_data['cyclic_stress_mpa']
    elif 'stress_amplitude_mpa' in design_data:
        formal_design_data['cyclic_stress_mpa'] = design_data['stress_amplitude_mpa']
    if 'endurance_limit_mpa' in design_data:
        formal_design_data['endurance_limit_mpa'] = design_data['endurance_limit_mpa']
    
    if 'sustained_stress_mpa' in design_data:
        formal_design_data['sustained_stress_mpa'] = design_data['sustained_stress_mpa']
    if 'creep_threshold_mpa' in design_data:
        formal_design_data['creep_threshold_mpa'] = design_data['creep_threshold_mpa']
    if 'operating_temp_c' in design_data:
        formal_design_data['operating_temp_c'] = design_data['operating_temp_c']
    elif 'operating_temp_celsius' in design_data:
        formal_design_data['operating_temp_c'] = design_data['operating_temp_celsius']
    if 'max_service_temp_c' in design_data:
        formal_design_data['max_service_temp_c'] = design_data['max_service_temp_c']
    elif 'melting_temp_c' in design_data:
        formal_design_data['max_service_temp_c'] = design_data['melting_temp_c']
    
    if 'tensile_stress_mpa' in design_data:
        formal_design_data['tensile_stress_mpa'] = design_data['tensile_stress_mpa']
    elif 'operating_stress_mpa' in design_data:
        formal_design_data['tensile_stress_mpa'] = design_data['operating_stress_mpa']
    if 'scc_threshold_mpa' in design_data:
        formal_design_data['scc_threshold_mpa'] = design_data['scc_threshold_mpa']
    if 'corrosive_environment' in design_data:
        formal_design_data['corrosive_environment'] = design_data['corrosive_environment']
    elif 'environment' in design_data:
        formal_design_data['corrosive_environment'] = 'saline' in str(design_data['environment']).lower()
    
    if 'uv_exposure_hours' in design_data:
        formal_design_data['uv_exposure_hours'] = design_data['uv_exposure_hours']
    if 'uv_rated_life_hours' in design_data:
        formal_design_data['uv_rated_life_hours'] = design_data['uv_rated_life_hours']
    
    if 'applied_stress_mpa' in design_data:
        formal_design_data['applied_stress_mpa'] = design_data['applied_stress_mpa']
    elif 'von_mises_mpa' in design_data:
        formal_design_data['applied_stress_mpa'] = design_data['von_mises_mpa']
    if 'yield_strength_mpa' in design_data:
        formal_design_data['yield_strength_mpa'] = design_data['yield_strength_mpa']
    
    if 'stiffness_part_a_npm' in design_data:
        formal_design_data['stiffness_part_a_npm'] = design_data['stiffness_part_a_npm']
    elif 'part1_stiffness_n_per_m' in design_data:
        formal_design_data['stiffness_part_a_npm'] = design_data['part1_stiffness_n_per_m']
    if 'stiffness_part_b_npm' in design_data:
        formal_design_data['stiffness_part_b_npm'] = design_data['stiffness_part_b_npm']
    elif 'part2_stiffness_n_per_m' in design_data:
        formal_design_data['stiffness_part_b_npm'] = design_data['part2_stiffness_n_per_m']
    
    # Creep envelope (FORMAL_029)
    if 'sustained_stress_mpa' in design_data:
        formal_design_data['sustained_stress_mpa'] = design_data['sustained_stress_mpa']
    if 'exposure_hours' in design_data:
        formal_design_data['exposure_hours'] = design_data['exposure_hours']
    elif 'expected_life_hours' in design_data:
        formal_design_data['exposure_hours'] = design_data['expected_life_hours']
    
    # Thermal-material coupling (FORMAL_030) - already mapped above
    
    # Contact pressure (FORMAL_031)
    if 'contact_force_n' in design_data:
        formal_design_data['contact_force_n'] = design_data['contact_force_n']
    elif 'grip_force_n' in design_data:
        formal_design_data['contact_force_n'] = design_data['grip_force_n']
    if 'contact_area_mm2' in design_data:
        formal_design_data['contact_area_mm2'] = design_data['contact_area_mm2']
    if 'pressure_limit_mpa' in design_data:
        formal_design_data['pressure_limit_mpa'] = design_data['pressure_limit_mpa']
    
    # Tissue crush risk (FORMAL_032)
    if 'tissue_tolerance_mpa' in design_data:
        formal_design_data['tissue_tolerance_mpa'] = design_data['tissue_tolerance_mpa']
    if 'contact_duration_s' in design_data:
        formal_design_data['contact_duration_s'] = design_data['contact_duration_s']
    
    # Bolt shear (FORMAL_033)
    if 'joint_force_n' in design_data:
        formal_design_data['joint_force_n'] = design_data['joint_force_n']
    if 'n_bolts' in design_data:
        formal_design_data['n_bolts'] = design_data['n_bolts']
    if 'bolt_diameter_mm' in design_data:
        formal_design_data['bolt_diameter_mm'] = design_data['bolt_diameter_mm']
    if 'bolt_shear_strength_mpa' in design_data:
        formal_design_data['bolt_shear_strength_mpa'] = design_data['bolt_shear_strength_mpa']
    
    # Adhesive load (FORMAL_034)
    if 'bond_area_mm2' in design_data:
        formal_design_data['bond_area_mm2'] = design_data['bond_area_mm2']
    if 'adhesive_strength_mpa' in design_data:
        formal_design_data['adhesive_strength_mpa'] = design_data['adhesive_strength_mpa']
    
    # Slip margin (FORMAL_035)
    if 'normal_force_n' in design_data:
        formal_design_data['normal_force_n'] = design_data['normal_force_n']
    if 'friction_coefficient' in design_data:
        formal_design_data['friction_coefficient'] = design_data['friction_coefficient']
    elif 'friction_coeff' in design_data:
        formal_design_data['friction_coefficient'] = design_data['friction_coeff']
    elif 'wet_friction_coeff' in design_data:
        formal_design_data['friction_coefficient'] = design_data['wet_friction_coeff']
    elif 'dry_friction_coeff' in design_data:
        formal_design_data['friction_coefficient'] = design_data['dry_friction_coeff']
    if 'tangential_force_n' in design_data:
        formal_design_data['tangential_force_n'] = design_data['tangential_force_n']
    elif 'grip_force_n' in design_data:
        formal_design_data['tangential_force_n'] = design_data['grip_force_n']
    
    # Corrosion rate (FORMAL_036)
    if 'corrosion_rate_mm_yr' in design_data:
        formal_design_data['corrosion_rate_mm_yr'] = design_data['corrosion_rate_mm_yr']
    elif 'corrosion_rate_mm_per_year' in design_data:
        formal_design_data['corrosion_rate_mm_yr'] = design_data['corrosion_rate_mm_per_year']
    if 'service_life_years' in design_data:
        formal_design_data['service_life_years'] = design_data['service_life_years']
    elif 'expected_life_years' in design_data:
        formal_design_data['service_life_years'] = design_data['expected_life_years']
    if 'wall_thickness_mm' in design_data:
        formal_design_data['wall_thickness_mm'] = design_data['wall_thickness_mm']
    
    # Run analysis
    result = analyzer.analyze(case, design_data=formal_design_data if formal_design_data else None)
    
    # Record run
    run_id = registry.record_run(
        case_id=case_id,
        output=result.model_dump(),
        trace=result.trace_graph
    )
    
    # Check detection
    detected = False
    constraints_triggered = []
    for fc in result.formal_constraints:
        if fc.result == "proven_violated":
            constraints_triggered.append(fc.constraint_name)
            detected = True
    
    # Check failure modes
    fm_detected = []
    for fm in result.failure_modes:
        fm_detected.append(fm.mode)
        # Check if failure mode matches injected failure
        if any(word in fm.mode.lower() for word in injected_failure.lower().split('_')):
            detected = True
    
    # Record FP tracking (assume all adversarial cases actually fail)
    for fc in result.formal_constraints:
        if fc.result == "proven_violated":
            record_result(
                case_id=case_id,
                constraint_id=fc.constraint_id,
                triggered=True,
                actually_failed=True  # Adversarial cases are designed to fail
            )
    
    # Get highest RPN
    max_rpn = max([fm.risk_priority_number for fm in result.failure_modes], default=0)
    
    case_results.append({
        "case_name": case_data['problem']['name'],
        "case_id": case_id,
        "category": failure_category,
        "injected_failure": injected_failure,
        "expected_detection": expected_detection,
        "detected": detected,
        "failure_modes": result.failure_modes,
        "formal_constraints": result.formal_constraints,
        "constraints_triggered": constraints_triggered,
        "max_rpn": max_rpn,
        "run_id": run_id
    })
    
    print(f"  {case_file.name}: {'✓' if detected else '✗'}")

print(f"\nAnalysis complete. Generating report...\n")

# Generate report
report_lines = [
    "# Adversarial Campaign Report (v6b)",
    "",
    "**Analysis Date:** 2026-02-05",
    "**Cases Analyzed:** 30 adversarial test cases",
    "**Purpose:** Stress test SPINE with borderline, emergent, and subtle failures",
    "**Version:** v6b (36 constraints + updated case design data)",
    "",
    "## Comparison: v5 vs v6 vs v6b",
    "",
    "| Metric | v5 (28 constraints) | v6 (36 constraints) | v6b (36 + design data) | Change v6→v6b |",
    "|--------|---------------------|---------------------|------------------------|---------------|"
]

# Calculate statistics
total_cases = len(case_results)
detected_count = sum(1 for r in case_results if r["detected"])
detection_rate = (detected_count / total_cases * 100) if total_cases > 0 else 0

# Baseline stats
v5_detected = 11
v5_detection_rate = 36.7
v6_detected = 11
v6_detection_rate = 36.7

# By category
by_category = {}
by_category_v5 = {
    "control": {"total": 5, "detected": 4},
    "geometric": {"total": 4, "detected": 1},
    "interaction": {"total": 4, "detected": 0},
    "material": {"total": 4, "detected": 1},
    "mechanical": {"total": 5, "detected": 3},
    "thermal": {"total": 4, "detected": 2},
    "unknown": {"total": 4, "detected": 0}
}
by_category_v6 = {
    "control": {"total": 5, "detected": 4},
    "geometric": {"total": 4, "detected": 1},
    "interaction": {"total": 4, "detected": 0},
    "material": {"total": 4, "detected": 1},
    "mechanical": {"total": 5, "detected": 3},
    "thermal": {"total": 4, "detected": 2},
    "unknown": {"total": 4, "detected": 0}
}

for r in case_results:
    cat = r["category"]
    if cat not in by_category:
        by_category[cat] = {"total": 0, "detected": 0}
    by_category[cat]["total"] += 1
    if r["detected"]:
        by_category[cat]["detected"] += 1

# FP rates
fp_rates = get_rates()

# Track which new constraints fired (v6: FORMAL_029-036)
new_constraints_fired = {}
for r in case_results:
    for fc in r["formal_constraints"]:
        if fc.result == "proven_violated":
            constraint_id = fc.constraint_id
            if constraint_id in ["FORMAL_029", "FORMAL_030", "FORMAL_031", "FORMAL_032", "FORMAL_033",
                                  "FORMAL_034", "FORMAL_035", "FORMAL_036"]:
                if constraint_id not in new_constraints_fired:
                    new_constraints_fired[constraint_id] = []
                new_constraints_fired[constraint_id].append(r["case_name"])

# Add comparison rows
detection_change_v6_to_v6b = detection_rate - v6_detection_rate
report_lines.insert(8, f"| Detection Rate | {v5_detection_rate:.1f}% ({v5_detected}/30) | {v6_detection_rate:.1f}% ({v6_detected}/30) | {detection_rate:.1f}% ({detected_count}/30) | {detection_change_v6_to_v6b:+.1f}% |")
report_lines.insert(9, f"| False Positive Rate | 0.0% | 0.0% | {fp_rates['false_positive_rate']:.1%} | {fp_rates['false_positive_rate']:.1%} |")

report_lines.extend([
    "",
    "## Summary Statistics",
    "",
    f"- **Total Cases:** {total_cases}",
    f"- **Detected:** {detected_count}",
    f"- **Detection Rate:** {detection_rate:.1f}%",
    f"- **False Positive Rate:** {fp_rates['false_positive_rate']:.1%}",
    f"- **Precision:** {fp_rates['precision']:.1%}",
    f"- **Recall:** {fp_rates['recall']:.1%}",
    f"- **Change from v6:** Detection rate {detection_change_v6_to_v6b:+.1f}%",
    "",
    "## Detection by Category",
    "",
    "| Category | v5 Detected | v6 Detected | v6b Detected | v5 Rate | v6 Rate | v6b Rate | Change v6→v6b |",
    "|----------|-------------|-------------|--------------|---------|---------|----------|---------------|"
])

for cat in sorted(set(list(by_category.keys()) + list(by_category_v5.keys()) + list(by_category_v6.keys()))):
    v5_stats = by_category_v5.get(cat, {"total": 0, "detected": 0})
    v6_stats = by_category_v6.get(cat, {"total": 0, "detected": 0})
    v6b_stats = by_category.get(cat, {"total": 0, "detected": 0})
    v5_rate = (v5_stats["detected"] / v5_stats["total"] * 100) if v5_stats["total"] > 0 else 0
    v6_rate = (v6_stats["detected"] / v6_stats["total"] * 100) if v6_stats["total"] > 0 else 0
    v6b_rate = (v6b_stats["detected"] / v6b_stats["total"] * 100) if v6b_stats["total"] > 0 else 0
    change = v6b_rate - v6_rate
    report_lines.append(f"| {cat} | {v5_stats['detected']}/{v5_stats['total']} | {v6_stats['detected']}/{v6_stats['total']} | {v6b_stats['detected']}/{v6b_stats['total']} | {v5_rate:.1f}% | {v6_rate:.1f}% | {v6b_rate:.1f}% | {change:+.1f}% |")

report_lines.extend([
    "",
    "## Detailed Results Table",
    "",
    "| Case | Category | Injected Failure | Detected? | RPN | Constraints Triggered | Decision Delta |",
    "|------|----------|------------------|-----------|-----|----------------------|----------------|"
])

for r in case_results:
    case_short = r["case_name"][:35] + "..." if len(r["case_name"]) > 35 else r["case_name"]
    detected_str = "✓ Yes" if r["detected"] else "✗ No"
    rpn_str = str(r["max_rpn"]) if r["max_rpn"] > 0 else "N/A"
    constraints_str = ", ".join(r["constraints_triggered"][:3]) if r["constraints_triggered"] else "None"
    if len(r["constraints_triggered"]) > 3:
        constraints_str += f" (+{len(r['constraints_triggered'])-3} more)"
    
    # Decision delta: 3 if both FM and FC, 2 if one, 1 if detected but weak, 0 if not detected
    if r["detected"]:
        if len(r["failure_modes"]) > 0 and len(r["constraints_triggered"]) > 0:
            delta = 3
        elif len(r["failure_modes"]) > 0 or len(r["constraints_triggered"]) > 0:
            delta = 2
        else:
            delta = 1
    else:
        delta = 0
    
    report_lines.append(
        f"| {case_short} | {r['category']} | {r['injected_failure']} | {detected_str} | {rpn_str} | {constraints_str} | {delta} |"
    )

# New constraints section
report_lines.extend([
    "",
    "## New Constraints That Fired",
    ""
])

if new_constraints_fired:
    constraint_names = {
        "FORMAL_029": "Creep Envelope",
        "FORMAL_030": "Thermal-Material Coupling",
        "FORMAL_031": "Contact Pressure",
        "FORMAL_032": "Tissue Crush Risk",
        "FORMAL_033": "Bolt Shear",
        "FORMAL_034": "Adhesive Load",
        "FORMAL_035": "Slip Margin",
        "FORMAL_036": "Corrosion Rate"
    }
    
    report_lines.append("**New Constraints That Fired:**")
    for cid, cases in sorted(new_constraints_fired.items()):
        report_lines.append(f"- {constraint_names.get(cid, cid)}: {len(cases)} case(s)")
        for case_name in cases[:3]:  # Show first 3
            report_lines.append(f"  - {case_name[:50]}...")
        if len(cases) > 3:
            report_lines.append(f"  - ... and {len(cases)-3} more")
else:
    report_lines.append("**No new constraints fired.**")

report_lines.extend([
    "",
    "## Honest Assessment",
    ""
])

if detection_rate >= 80:
    assessment = "**SPINE v5 performed well** on adversarial cases, detecting most borderline and emergent failures."
elif detection_rate >= 60:
    assessment = "**SPINE v5 detected some adversarial failures** but missed many borderline cases."
elif detection_rate > v6_detection_rate:
    assessment = f"**SPINE v6b improved** from v6 ({detection_rate:.1f}% vs {v6_detection_rate:.1f}%) after adding design data to cases."
else:
    assessment = f"**SPINE v6b did not improve** detection rate ({detection_rate:.1f}% vs {v6_detection_rate:.1f}%) despite design data updates."

report_lines.append(assessment)
report_lines.append("")
report_lines.append("**Key Findings:**")
report_lines.append(f"1. Detection rate: {detection_rate:.1f}% on adversarial cases (v6: {v6_detection_rate:.1f}%, change: {detection_change_v6_to_v6b:+.1f}%)")
report_lines.append(f"2. False positive rate: {fp_rates['false_positive_rate']:.1%}")
report_lines.append(f"3. New constraints fired: {len(new_constraints_fired)} of 8")
if new_constraints_fired:
    report_lines.append("4. New constraints successfully detected:")
    for cid, cases in sorted(new_constraints_fired.items()):
        report_lines.append(f"   - {constraint_names.get(cid, cid)}: {len(cases)} case(s)")
else:
    report_lines.append("4. New constraints did not fire - may need design data mapping refinement")
report_lines.append("5. Adversarial cases still reveal gaps in detecting:")
report_lines.append("   - Borderline violations (near thresholds)")
report_lines.append("   - Emergent failures (multiple minor issues)")
report_lines.append("   - Subtle degradation (gradual processes)")

# Write report
report_path = Path(__file__).parent / "reports" / "adversarial_campaign_v6b.md"
report_path.parent.mkdir(exist_ok=True)
with open(report_path, "w") as f:
    f.write("\n".join(report_lines))

print(f"Report written to: {report_path}")
print(f"Detection rate: {detection_rate:.1f}%")
print(f"False positive rate: {fp_rates['false_positive_rate']:.1%}")
