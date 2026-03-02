"""Closed-loop experiment runner: Spine → Forge → Simulate → Record."""

import sys
from pathlib import Path
from typing import Dict, Any

sys.path.insert(0, str(Path(__file__).parent.parent))

from spine.runtime.analyzer import DecisionAnalyzer
from spine.runtime.schemas import CaseInput, ProblemDefinition
from spine.runtime.unified_ledger import UnifiedLedger
from forge.hypothesis_engine import generate_hypotheses
from forge.experiment_builder import build_experiments
from experiments.sim_runner import (
    run_slip_experiment,
    run_force_experiment,
    run_fatigue_experiment,
    run_thermal_experiment
)


def parse_simple_yaml(content: str):
    """Simple YAML parser."""
    data = {}
    lines = content.split('\n')
    current_section = None
    
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith('#'):
            continue
        if '#' in stripped:
            stripped = stripped[:stripped.find('#')].strip()
        
        if stripped.endswith(':') and ':' not in stripped[:-1]:
            current_section = stripped[:-1]
            if current_section not in data:
                data[current_section] = {}
            continue
        
        if stripped.startswith('- '):
            if current_section:
                if not isinstance(data[current_section], list):
                    data[current_section] = []
                value = stripped[2:].strip().strip('"\'')
                data[current_section].append(value)
        elif ':' in stripped:
            key, value = stripped.split(':', 1)
            key = key.strip()
            value = value.strip().strip('"\'')
            
            if current_section:
                if isinstance(data[current_section], dict):
                    try:
                        data[current_section][key] = float(value)
                    except ValueError:
                        try:
                            data[current_section][key] = int(value)
                        except ValueError:
                            if value.lower() == 'true':
                                data[current_section][key] = True
                            elif value.lower() == 'false':
                                data[current_section][key] = False
                            else:
                                data[current_section][key] = value
            else:
                data[key] = value
    
    return data


def map_design_data(design_data):
    """Map design data to formal constraint format."""
    formal_data = {}
    formal_data.update(design_data)
    return formal_data


def run_closed_loop(case_yaml_path: Path, ledger: UnifiedLedger = None, experiment_label: str = None) -> Dict[str, Any]:
    """
    Run closed-loop experiment: Spine → Forge → Simulate → Record.
    Uses shared ledger if provided. experiment_label (e.g. E021) stored for lineage.
    """
    # Parse case
    with open(case_yaml_path) as f:
        content = f.read()
    
    case_data = parse_simple_yaml(content)
    problem_data = case_data.get('problem', {})
    case = CaseInput(
        problem=ProblemDefinition(
            name=problem_data.get('name', 'Unknown'),
            domain=problem_data.get('domain', 'surgical_robotics')
        ),
        constraints=case_data.get('constraints', []),
        uncertainties=case_data.get('uncertainties', []),
        objectives=case_data.get('objectives', [])
    )
    
    design_data = case_data.get('design', {})
    formal_design_data = map_design_data(design_data)
    
    # Run Spine analysis
    analyzer = DecisionAnalyzer()
    spine_output = analyzer.analyze(case, design_data=formal_design_data)
    
    # Run Forge hypothesis generation
    hypotheses = generate_hypotheses(spine_output, domain=case.problem.domain)
    experiments = build_experiments(hypotheses)
    
    # Convert to dict format
    forge_output = {
        "hypotheses": [
            {
                "id": hyp.id,
                "hypothesis_text": hyp.hypothesis_text,
                "confidence": hyp.confidence,
                "category": hyp.category.value
            }
            for hyp in hypotheses
        ]
    }
    
    # Determine experiment type from metadata
    experiment_type = case_data.get('metadata', {}).get('experiment_type', 'unknown')
    
    # Run appropriate simulation
    sim_result = None
    experiment_name = "unknown"
    experiment_method = "sim"
    prediction_text = ""
    predicted_confidence = 0.5
    
    if experiment_type.startswith('slip'):
        # Slip experiment
        friction_coeff = design_data.get('friction_coefficient', 0.4)
        normal_force_n = design_data.get('normal_force_n', 2.0)
        surface_type = design_data.get('surface_type', 'tissue')
        
        sim_result = run_slip_experiment(friction_coeff, normal_force_n, surface_type)
        experiment_name = f"Slip test: {surface_type}, {normal_force_n}N"
        prediction_text = f"Slip occurs if tangential force > {sim_result['slip_force_n']:.2f}N"
        predicted_confidence = 0.7 if sim_result['slipped'] else 0.3
        
    elif experiment_type.startswith('force'):
        # Force/deformation experiment
        applied_force_n = design_data.get('applied_force_n', 1.0)
        tissue_stiffness = design_data.get('tissue_stiffness', 2.0)
        gripper_config = design_data.get('gripper_config', 'medium')
        
        sim_result = run_force_experiment(applied_force_n, tissue_stiffness, gripper_config)
        experiment_name = f"Force test: {applied_force_n}N on {gripper_config} gripper"
        prediction_text = f"Deformation: {sim_result['max_deformation_mm']:.2f}mm, damage: {sim_result['tissue_damage']}"
        predicted_confidence = 0.8 if sim_result['tissue_damage'] else 0.2
        
    elif experiment_type.startswith('thermal'):
        # Thermal experiment
        power_w = design_data.get('power_w', 10.0)
        duty_cycle = design_data.get('duty_cycle', 0.8)
        duration_s = design_data.get('duration_s', 1800)
        cooling = design_data.get('cooling', 'none')
        
        sim_result = run_thermal_experiment(power_w, duty_cycle, duration_s, cooling)
        experiment_name = f"Thermal test: {power_w}W, {duty_cycle*100:.0f}% duty, {duration_s}s"
        prediction_text = f"Peak temp: {sim_result['peak_temp_c']:.1f}°C, overheated: {sim_result['overheated']}"
        predicted_confidence = 0.9 if sim_result['overheated'] else 0.1
        
    elif experiment_type.startswith('fatigue'):
        # Fatigue experiment
        cycles = design_data.get('cycles', 1000)
        load_n = design_data.get('load_n', 5.0)
        material = design_data.get('material', 'silicone')
        
        sim_result = run_fatigue_experiment(cycles, load_n, material)
        experiment_name = f"Fatigue test: {cycles} cycles, {load_n}N load"
        prediction_text = f"Degradation: {sim_result['degradation_pct']:.1f}%, failed: {sim_result['failed']}"
        predicted_confidence = 0.8 if sim_result['failed'] else 0.2
    
    # Log to unified ledger (shared ledger must be passed from run_all_experiments to avoid data loss)
    if ledger is None:
        ledger = UnifiedLedger()
    case_id = case_yaml_path.stem
    
    record_id = ledger.log_decision(
        case_id=case_id,
        spine_output=spine_output,
        forge_output=forge_output,
        experiment={"name": experiment_name, "method": experiment_method, "prediction": prediction_text},
        prediction={"predicted_confidence": predicted_confidence},
        experiment_label=experiment_label,
    )
    
    # Record outcome
    if sim_result:
        # Determine outcome based on experiment type
        if experiment_type.startswith('slip'):
            occurred = sim_result['slipped']
            measured_value = sim_result['slip_force_n']
        elif experiment_type.startswith('force'):
            occurred = sim_result['tissue_damage']
            measured_value = sim_result['max_deformation_mm']
        elif experiment_type.startswith('thermal'):
            occurred = sim_result['overheated']
            measured_value = sim_result['peak_temp_c']
        elif experiment_type.startswith('fatigue'):
            occurred = sim_result['failed']
            measured_value = sim_result['degradation_pct']
        else:
            occurred = False
            measured_value = None
        
        ledger.record_outcome(
            record_id=record_id,
            occurred=occurred,
            measured_value=measured_value,
            notes=f"Simulation result: {sim_result}"
        )
    
    # Get record
    record = ledger.records[record_id]
    
    return {
        "record_id": record_id,
        "case_id": case_id,
        "spine_risks": len(record.spine_risks),
        "forge_hypotheses": len(record.forge_hypotheses),
        "experiment": experiment_name,
        "prediction": prediction_text,
        "predicted_confidence": predicted_confidence,
        "outcome": occurred if sim_result else None,
        "measured_value": measured_value if sim_result else None,
        "calibration_error": record.calibration_error
    }
