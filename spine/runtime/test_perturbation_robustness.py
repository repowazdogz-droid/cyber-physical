#!/usr/bin/env python3
"""Perturbation robustness test - test stability to small parameter variations."""

import sys
import json
from pathlib import Path
from typing import Dict, List, Any
import copy

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from spine.runtime.analyzer import DecisionAnalyzer
from spine.runtime.schemas import CaseInput, ProblemDefinition

analyzer = DecisionAnalyzer()

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

def is_detected(result) -> bool:
    """Check if any failure mode or constraint violation detected."""
    if result.failure_modes:
        return True
    for fc in result.formal_constraints:
        if fc.result == "proven_violated":
            return True
    return False

# Select 10 cases: 5 detected, 5 missed from v6b
test_cases = [
    # 5 detected cases
    ("adv_c01_marginal_phase_margin.yaml", True),
    ("adv_i02_surface_friction_drop.yaml", True),
    ("adv_mat01_creep.yaml", True),
    ("adv_m02_fatigue_cycling.yaml", True),
    ("adv_t01_transient_thermal_spike.yaml", True),
    # 5 missed cases
    ("adv_c05_feedforward_mismatch.yaml", False),
    ("adv_g01_tolerance_stackup.yaml", False),
    ("adv_m01_borderline_mass.yaml", False),
    ("adv_t02_cooling_degradation.yaml", False),
    ("adv_e02_thermal_control_interaction.yaml", False),
]

adversarial_dir = Path(__file__).parent / "cases" / "adversarial"
perturbation_results = []

for filename, baseline_detected in test_cases:
    case_file = adversarial_dir / filename
    if not case_file.exists():
        print(f"Warning: {filename} not found, skipping")
        continue
    
    with open(case_file) as f:
        content = f.read()
    
    case_data = parse_simple_yaml(content)
    design_data = case_data.get('design', {}).copy()
    
    # Create baseline case
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
    
    # Run baseline
    baseline_result = analyzer.analyze(case, design_data=design_data)
    baseline_detected_actual = is_detected(baseline_result)
    
    # Create 5 perturbations
    perturbations = []
    pert_design_data = copy.deepcopy(design_data)
    
    # Perturbation 1: mass ±10%
    if 'total_mass_kg' in pert_design_data:
        pert_design_data['total_mass_kg'] *= 1.1
    elif 'mass_kg' in pert_design_data:
        pert_design_data['mass_kg'] *= 1.1
    pert_result = analyzer.analyze(case, design_data=pert_design_data)
    pert_detected = is_detected(pert_result)
    perturbations.append({
        "type": "mass_+10%",
        "detected": pert_detected,
        "changed": pert_detected != baseline_detected_actual,
        "expected_direction": pert_detected >= baseline_detected_actual if baseline_detected_actual else True
    })
    
    # Perturbation 2: friction ±15%
    pert_design_data = copy.deepcopy(design_data)
    if 'friction_coefficient' in pert_design_data:
        pert_design_data['friction_coefficient'] *= 0.85
    elif 'wet_friction_coeff' in pert_design_data:
        pert_design_data['wet_friction_coeff'] *= 0.85
    pert_result = analyzer.analyze(case, design_data=pert_design_data)
    pert_detected = is_detected(pert_result)
    perturbations.append({
        "type": "friction_-15%",
        "detected": pert_detected,
        "changed": pert_detected != baseline_detected_actual,
        "expected_direction": pert_detected >= baseline_detected_actual if not baseline_detected_actual else True
    })
    
    # Perturbation 3: duty_cycle ±20%
    pert_design_data = copy.deepcopy(design_data)
    if 'duty_cycle' in pert_design_data:
        pert_design_data['duty_cycle'] = min(1.0, pert_design_data['duty_cycle'] * 1.2)
    elif 'fan_duty_cycle' in pert_design_data:
        pert_design_data['fan_duty_cycle'] = min(1.0, pert_design_data['fan_duty_cycle'] * 1.2)
    pert_result = analyzer.analyze(case, design_data=pert_design_data)
    pert_detected = is_detected(pert_result)
    perturbations.append({
        "type": "duty_cycle_+20%",
        "detected": pert_detected,
        "changed": pert_detected != baseline_detected_actual,
        "expected_direction": pert_detected >= baseline_detected_actual if baseline_detected_actual else True
    })
    
    # Perturbation 4: latency ±25%
    pert_design_data = copy.deepcopy(design_data)
    if 'control_latency_ms' in pert_design_data:
        pert_design_data['control_latency_ms'] *= 1.25
    elif 'sensor_lag_s' in pert_design_data:
        pert_design_data['sensor_lag_s'] *= 1.25
    pert_result = analyzer.analyze(case, design_data=pert_design_data)
    pert_detected = is_detected(pert_result)
    perturbations.append({
        "type": "latency_+25%",
        "detected": pert_detected,
        "changed": pert_detected != baseline_detected_actual,
        "expected_direction": pert_detected >= baseline_detected_actual if baseline_detected_actual else True
    })
    
    # Perturbation 5: temperature ±15%
    pert_design_data = copy.deepcopy(design_data)
    if 'operating_temp_c' in pert_design_data:
        pert_design_data['operating_temp_c'] *= 1.15
    elif 'motor_temp_c' in pert_design_data:
        pert_design_data['motor_temp_c'] *= 1.15
    pert_result = analyzer.analyze(case, design_data=pert_design_data)
    pert_detected = is_detected(pert_result)
    perturbations.append({
        "type": "temperature_+15%",
        "detected": pert_detected,
        "changed": pert_detected != baseline_detected_actual,
        "expected_direction": pert_detected >= baseline_detected_actual if baseline_detected_actual else True
    })
    
    # Compute stability score
    stable_count = sum(1 for p in perturbations if not p["changed"] or p["expected_direction"])
    stability_score = stable_count / len(perturbations) * 100
    
    perturbation_results.append({
        "case": filename,
        "baseline_detected": baseline_detected_actual,
        "perturbations": perturbations,
        "stability_score": stability_score
    })
    
    print(f"{filename}: baseline={baseline_detected_actual}, stability={stability_score:.1f}%")

# Generate report
report_lines = [
    "# Perturbation Robustness Test Report",
    "",
    "**Analysis Date:** 2026-02-05",
    "**Purpose:** Test SPINE stability to small parameter variations",
    "",
    "## Summary",
    "",
    f"- **Test Cases:** {len(perturbation_results)}",
    f"- **Perturbations per Case:** 5",
    f"- **Total Perturbations:** {len(perturbation_results) * 5}",
    "",
    "## Results by Case",
    "",
    "| Case | Baseline Detected? | Stability Score | Perturbation Results |",
    "|------|-------------------|-----------------|---------------------|"
]

for r in perturbation_results:
    pert_str = ", ".join([f"{p['type']}: {'✓' if p['detected'] else '✗'}" for p in r['perturbations']])
    report_lines.append(f"| {r['case']} | {'Yes' if r['baseline_detected'] else 'No'} | {r['stability_score']:.1f}% | {pert_str} |")

# Overall statistics
all_stability_scores = [r['stability_score'] for r in perturbation_results]
avg_stability = sum(all_stability_scores) / len(all_stability_scores) if all_stability_scores else 0

report_lines.extend([
    "",
    "## Overall Statistics",
    "",
    f"- **Average Stability Score:** {avg_stability:.1f}%",
    f"- **Min Stability:** {min(all_stability_scores):.1f}%",
    f"- **Max Stability:** {max(all_stability_scores):.1f}%",
    "",
    "## Interpretation",
    "",
    "Stability score = % of perturbations where:",
    "- Detection result unchanged, OR",
    "- Changed in expected direction (worse parameter → more likely detected)",
    "",
    "**Assessment:**",
])

if avg_stability >= 80:
    report_lines.append("SPINE shows **good robustness** to parameter perturbations.")
elif avg_stability >= 60:
    report_lines.append("SPINE shows **moderate robustness** to parameter perturbations.")
else:
    report_lines.append("SPINE shows **poor robustness** to parameter perturbations - results sensitive to small variations.")

report_path = Path(__file__).parent / "reports" / "perturbation_robustness.md"
report_path.parent.mkdir(exist_ok=True)
with open(report_path, 'w') as f:
    f.write('\n'.join(report_lines))

print(f"\nReport written to: {report_path}")
print(f"Average stability score: {avg_stability:.1f}%")
