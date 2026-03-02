#!/usr/bin/env python3
"""Evaluate holdout cases - honest assessment without constraint modification."""

import sys
import json
from pathlib import Path
from typing import Dict, List, Any

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from spine.runtime.registry import CaseRegistry
from spine.runtime.analyzer import DecisionAnalyzer
from spine.runtime.schemas import CaseInput, ProblemDefinition
from spine.runtime.fp_tracker import record_result, get_rates

registry = CaseRegistry(registry_path=str(Path(__file__).parent / "test_registry"))
analyzer = DecisionAnalyzer()

holdout_dir = Path(__file__).parent / "cases" / "holdout"
case_files = sorted(holdout_dir.glob("hold_*.yaml"))

print(f"Found {len(case_files)} holdout cases")
print("Analyzing holdout cases...\n")

def parse_simple_yaml(content: str) -> Dict[str, Any]:
    """Simple YAML parser."""
    data = {}
    lines = content.split('\n')
    current_section = None
    current_list = None
    
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith('#'):
            continue
        
        if stripped.endswith(':') and ':' not in stripped[:-1]:
            if current_section and current_list is not None:
                data[current_section] = current_list
            elif current_section:
                pass
            current_section = stripped[:-1]
            current_list = None
            if current_section not in data:
                data[current_section] = {}
            continue
        
        if stripped.startswith('- '):
            if current_list is None:
                current_list = []
                if isinstance(data.get(current_section, {}), dict):
                    data[current_section] = current_list
                else:
                    data[current_section] = current_list
            value = stripped[2:].strip().strip('"\'')
            data[current_section].append(value)
        elif ':' in stripped:
            key, value = stripped.split(':', 1)
            key = key.strip()
            value = value.strip().strip('"\'')
            
            if current_section:
                if isinstance(data[current_section], dict):
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

case_results = []

for case_file in case_files:
    with open(case_file) as f:
        content = f.read()
    
    case_data = parse_simple_yaml(content)
    metadata = case_data.get('metadata', {})
    injected_failure = metadata.get('injected_failure', 'unknown')
    failure_category = metadata.get('failure_category', 'unknown')
    
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
    
    design_data = case_data.get('design', {})
    
    # Map design data (same as adversarial cases)
    formal_design_data = {}
    
    # Mass
    if 'total_mass_kg' in design_data:
        formal_design_data['total_mass_kg'] = design_data['total_mass_kg']
    elif 'mass_kg' in design_data:
        formal_design_data['total_mass_kg'] = design_data['mass_kg']
    
    # Force/Torque
    if 'max_force_n' in design_data:
        formal_design_data['max_force_n'] = design_data['max_force_n']
    if 'max_torque_nm' in design_data:
        formal_design_data['max_torque_nm'] = design_data['max_torque_nm']
    if 'impact_load_n' in design_data:
        formal_design_data['max_force_n'] = design_data['impact_load_n']
    
    # Acceleration/Jerk
    if 'max_acceleration_mps2' in design_data:
        formal_design_data['max_acceleration_mps2'] = design_data['max_acceleration_mps2']
    if 'max_accel_limit_mps2' in design_data:
        formal_design_data['max_acceleration_mps2'] = design_data['max_accel_limit_mps2']
    if 'max_jerk_mps3' in design_data:
        formal_design_data['max_jerk_mps3'] = design_data['max_jerk_mps3']
    
    # Clearance
    if 'min_clearance_mm' in design_data:
        formal_design_data['min_clearance_mm'] = design_data['min_clearance_mm']
    if 'clearance_limit_mm' in design_data:
        formal_design_data['min_clearance_mm'] = design_data['clearance_limit_mm']
    
    # Thermal
    if 'operating_temp_c' in design_data:
        formal_design_data['operating_temp_c'] = design_data['operating_temp_c']
    if 'temperature_rise_celsius' in design_data:
        formal_design_data['temperature_rise_celsius'] = design_data['temperature_rise_celsius']
    if 'max_temperature_celsius' in design_data:
        formal_design_data['max_temperature_celsius'] = design_data['max_temperature_celsius']
    if 'max_service_temp_c' in design_data:
        formal_design_data['max_service_temp_c'] = design_data['max_service_temp_c']
    if 'power_density_w_per_mm2' in design_data:
        formal_design_data['power_density_w_per_mm2'] = design_data['power_density_w_per_mm2']
    if 'duty_cycle' in design_data:
        formal_design_data['duty_cycle'] = design_data['duty_cycle']
    if 'cooling_factor' in design_data:
        formal_design_data['cooling_factor'] = design_data['cooling_factor']
    
    # Control
    if 'control_latency_ms' in design_data:
        formal_design_data['control_latency_ms'] = design_data['control_latency_ms']
    if 'control_period_ms' in design_data:
        formal_design_data['control_period_ms'] = design_data['control_period_ms']
    if 'control_bandwidth_hz' in design_data:
        formal_design_data['control_bandwidth_hz'] = design_data['control_bandwidth_hz']
    if 'task_frequency_hz' in design_data:
        formal_design_data['task_frequency_hz'] = design_data['task_frequency_hz']
    if 'phase_margin_deg' in design_data:
        formal_design_data['phase_margin_deg'] = design_data['phase_margin_deg']
    if 'gain_margin_db' in design_data:
        formal_design_data['gain_margin_db'] = design_data['gain_margin_db']
    if 'sampling_rate_hz' in design_data:
        formal_design_data['sampling_rate_hz'] = design_data['sampling_rate_hz']
    if 'max_signal_frequency_hz' in design_data:
        formal_design_data['max_signal_frequency_hz'] = design_data['max_signal_frequency_hz']
    if 'encoder_resolution_m' in design_data:
        formal_design_data['encoder_resolution_m'] = design_data['encoder_resolution_m']
    if 'required_accuracy_m' in design_data:
        formal_design_data['required_accuracy_m'] = design_data['required_accuracy_m']
    
    # Material
    if 'applied_stress_mpa' in design_data:
        formal_design_data['applied_stress_mpa'] = design_data['applied_stress_mpa']
    if 'yield_strength_mpa' in design_data:
        formal_design_data['yield_strength_mpa'] = design_data['yield_strength_mpa']
    if 'cyclic_stress_mpa' in design_data:
        formal_design_data['cyclic_stress_mpa'] = design_data['cyclic_stress_mpa']
    if 'endurance_limit_mpa' in design_data:
        formal_design_data['endurance_limit_mpa'] = design_data['endurance_limit_mpa']
    if 'sustained_stress_mpa' in design_data:
        formal_design_data['sustained_stress_mpa'] = design_data['sustained_stress_mpa']
    if 'creep_threshold_mpa' in design_data:
        formal_design_data['creep_threshold_mpa'] = design_data['creep_threshold_mpa']
    if 'tensile_stress_mpa' in design_data:
        formal_design_data['tensile_stress_mpa'] = design_data['tensile_stress_mpa']
    if 'scc_threshold_mpa' in design_data:
        formal_design_data['scc_threshold_mpa'] = design_data['scc_threshold_mpa']
    if 'corrosive_environment' in design_data:
        formal_design_data['corrosive_environment'] = design_data['corrosive_environment']
    if 'corrosion_rate_mm_yr' in design_data:
        formal_design_data['corrosion_rate_mm_yr'] = design_data['corrosion_rate_mm_yr']
    if 'service_life_years' in design_data:
        formal_design_data['service_life_years'] = design_data['service_life_years']
    if 'wall_thickness_mm' in design_data:
        formal_design_data['wall_thickness_mm'] = design_data['wall_thickness_mm']
    if 'exposure_hours' in design_data:
        formal_design_data['exposure_hours'] = design_data['exposure_hours']
    
    # Interaction
    if 'contact_force_n' in design_data:
        formal_design_data['contact_force_n'] = design_data['contact_force_n']
    if 'contact_area_mm2' in design_data:
        formal_design_data['contact_area_mm2'] = design_data['contact_area_mm2']
    if 'tissue_tolerance_mpa' in design_data:
        formal_design_data['tissue_tolerance_mpa'] = design_data['tissue_tolerance_mpa']
    if 'contact_duration_s' in design_data:
        formal_design_data['contact_duration_s'] = design_data['contact_duration_s']
    if 'pressure_limit_mpa' in design_data:
        formal_design_data['pressure_limit_mpa'] = design_data['pressure_limit_mpa']
    if 'normal_force_n' in design_data:
        formal_design_data['normal_force_n'] = design_data['normal_force_n']
    if 'friction_coefficient' in design_data:
        formal_design_data['friction_coefficient'] = design_data['friction_coefficient']
    if 'tangential_force_n' in design_data:
        formal_design_data['tangential_force_n'] = design_data['tangential_force_n']
    
    # Resonance
    if 'operating_frequency_hz' in design_data:
        formal_design_data['operating_frequency_hz'] = design_data['operating_frequency_hz']
    if 'natural_frequency_hz' in design_data:
        formal_design_data['natural_frequency_hz'] = design_data['natural_frequency_hz']
    
    # Stiffness
    if 'stiffness_part_a_npm' in design_data:
        formal_design_data['stiffness_part_a_npm'] = design_data['stiffness_part_a_npm']
    if 'stiffness_part_b_npm' in design_data:
        formal_design_data['stiffness_part_b_npm'] = design_data['stiffness_part_b_npm']
    
    # Run analysis
    result = analyzer.analyze(case, design_data=formal_design_data)
    
    # Check detection
    detected = False
    constraints_triggered = []
    if result.failure_modes:
        detected = True
    for fc in result.formal_constraints:
        if fc.result == "proven_violated":
            detected = True
            constraints_triggered.append(fc.constraint_name)
    
    case_results.append({
        "case_name": case.problem.name,
        "filename": case_file.name,
        "category": failure_category,
        "injected_failure": injected_failure,
        "detected": detected,
        "constraints_triggered": constraints_triggered,
        "max_rpn": max([fm.risk_priority_number for fm in result.failure_modes], default=0)
    })
    
    print(f"{case_file.name}: {'✓' if detected else '✗'}")

# Compute statistics
total_cases = len(case_results)
detected_count = sum(1 for r in case_results if r["detected"])
detection_rate = (detected_count / total_cases * 100) if total_cases > 0 else 0

by_category = {}
for r in case_results:
    cat = r["category"]
    if cat not in by_category:
        by_category[cat] = {"total": 0, "detected": 0}
    by_category[cat]["total"] += 1
    if r["detected"]:
        by_category[cat]["detected"] += 1

# Generate report
report_lines = [
    "# Holdout Evaluation Report (v6)",
    "",
    "**Analysis Date:** 2026-02-05",
    "**Purpose:** Honest assessment on holdout cases (never used for constraint development)",
    "",
    "## Summary",
    "",
    f"- **Total Holdout Cases:** {total_cases}",
    f"- **Detected:** {detected_count}",
    f"- **Detection Rate:** {detection_rate:.1f}%",
    "",
    "## Comparison: Main Suite vs Holdout",
    "",
    "| Metric | Main Suite (v6b) | Holdout | Difference |",
    "|--------|------------------|---------|------------|",
    f"| Detection Rate | 70.0% (21/30) | {detection_rate:.1f}% ({detected_count}/{total_cases}) | {detection_rate - 70.0:+.1f}% |",
    "",
    "## Detection by Category",
    "",
    "| Category | Detected | Total | Rate |",
    "|----------|----------|-------|------|"
]

for cat in sorted(by_category.keys()):
    stats = by_category[cat]
    rate = (stats["detected"] / stats["total"] * 100) if stats["total"] > 0 else 0
    report_lines.append(f"| {cat} | {stats['detected']}/{stats['total']} | {stats['total']} | {rate:.1f}% |")

report_lines.extend([
    "",
    "## Detailed Results",
    "",
    "| Case | Category | Injected Failure | Detected? | Constraints Triggered |",
    "|------|----------|------------------|-----------|----------------------|"
])

for r in case_results:
    detected_str = "✓ Yes" if r["detected"] else "✗ No"
    constraints_str = ", ".join(r["constraints_triggered"][:3]) if r["constraints_triggered"] else "None"
    if len(r["constraints_triggered"]) > 3:
        constraints_str += f" (+{len(r['constraints_triggered'])-3} more)"
    report_lines.append(f"| {r['case_name'][:50]}... | {r['category']} | {r['injected_failure']} | {detected_str} | {constraints_str} |")

report_lines.extend([
    "",
    "## Honest Assessment",
    "",
    f"**Holdout detection rate: {detection_rate:.1f}%**",
    "",
    "This is the honest number - holdout cases were never used for constraint development.",
    "",
    "**Key Findings:**",
    f"1. Holdout detection: {detection_rate:.1f}% vs main suite 70.0%",
    f"2. Difference: {detection_rate - 70.0:+.1f}%",
    "",
    "**Interpretation:**",
])

if detection_rate >= 60:
    report_lines.append("Holdout performance is **acceptable** - within reasonable range of main suite.")
elif detection_rate >= 40:
    report_lines.append("Holdout performance is **moderate** - some overfitting to main suite may exist.")
else:
    report_lines.append("Holdout performance is **poor** - significant overfitting to main suite detected.")

report_path = Path(__file__).parent / "reports" / "holdout_evaluation_v6.md"
report_path.parent.mkdir(exist_ok=True)
with open(report_path, 'w') as f:
    f.write('\n'.join(report_lines))

print(f"\nReport written to: {report_path}")
print(f"Holdout detection rate: {detection_rate:.1f}%")
