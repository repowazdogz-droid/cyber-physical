#!/usr/bin/env python3
"""Forge runner - generates invention hypotheses from Spine analysis."""

import sys
import json
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))

from spine.runtime.analyzer import DecisionAnalyzer
from spine.runtime.schemas import CaseInput, ProblemDefinition
from forge.hypothesis_engine import generate_hypotheses
from forge.adjacency_mapper import map_adjacencies
from forge.experiment_builder import build_experiments


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
    
    # Handle parts
    if 'parts' not in design_data and 'part_count' in design_data:
        part_count = int(float(design_data.get('part_count', 1)))
        tolerance = design_data.get('tolerance_per_part_mm', 0.0)
        nominal = design_data.get('nominal_dim_mm', design_data.get('nominal_dimension_mm', 10.0))
        formal_data['parts'] = [{'nominal_dim_mm': nominal, 'tolerance_mm': tolerance, 'count': part_count}]
    elif 'parts' in design_data and isinstance(design_data['parts'], list):
        formal_data['parts'] = design_data['parts']
    
    # Handle assembly_stages
    if 'assembly_stages' not in design_data or not isinstance(design_data.get('assembly_stages'), list):
        if 'error_per_stage_mm' in design_data:
            count = int(float(design_data.get('assembly_stages', 5)))
            error = design_data.get('error_per_stage_mm', 0.0)
            formal_data['assembly_stages'] = [
                {'positioning_error_mm': error, 'stage_name': f'stage_{i+1}'}
                for i in range(count)
            ]
    elif isinstance(design_data.get('assembly_stages'), list):
        formal_data['assembly_stages'] = design_data['assembly_stages']
    
    return formal_data


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 forge_runner.py <spine_case.yaml>")
        sys.exit(1)
    
    case_file = Path(sys.argv[1])
    if not case_file.exists():
        print(f"Error: Case file not found: {case_file}")
        sys.exit(1)
    
    # Parse case file
    with open(case_file) as f:
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
    
    # Generate hypotheses
    hypotheses = generate_hypotheses(spine_output, domain=case.problem.domain)
    
    # Map adjacencies
    problem_desc = f"{case.problem.name} {case.problem.domain}"
    adjacencies = map_adjacencies(problem_desc, case.constraints)
    
    # Build experiments
    experiments = build_experiments(hypotheses)
    
    # Print report
    print("=" * 70)
    print(f"FORGE ANALYSIS: {case.problem.name}")
    print("=" * 70)
    print()
    print(f"Hypotheses Generated: {len(hypotheses)}")
    print()
    
    for hyp in hypotheses:
        print(f"[{hyp.id}] {hyp.category.value.upper()}")
        print(f"  Hypothesis: {hyp.hypothesis_text}")
        print(f"  Testable Prediction: {hyp.testable_prediction}")
        print(f"  Falsification Test: {hyp.falsification_test}")
        print(f"  Cost: {hyp.falsification_cost}, Time: {hyp.falsification_time}")
        print(f"  Confidence: {hyp.confidence:.2f}")
        if hyp.adjacent_domains:
            print(f"  Adjacent Domains: {', '.join(hyp.adjacent_domains)}")
        print()
    
    print(f"Experiment Cards: {len(experiments)}")
    print()
    
    # Top 3 experiments by leverage (lowest cost × highest confidence)
    cost_weights = {"low": 1, "medium": 2, "high": 3}
    experiments_with_leverage = [
        (exp, hyp.confidence / cost_weights.get(exp.estimated_cost, 2))
        for exp, hyp in zip(experiments, hypotheses)
    ]
    experiments_with_leverage.sort(key=lambda x: x[1], reverse=True)
    
    print("Top 3 Experiments by Leverage:")
    print()
    for i, (exp, leverage) in enumerate(experiments_with_leverage[:3], 1):
        print(f"{i}. {exp.experiment_name}")
        print(f"   Objective: {exp.objective}")
        print(f"   Method: {exp.method}, Cost: {exp.estimated_cost}, Time: {exp.estimated_time}")
        print(f"   Measurements: {', '.join(exp.measurements[:3])}")
        print()
    
    # Save JSON output
    output_dir = Path(__file__).parent / "outputs"
    output_dir.mkdir(exist_ok=True)
    
    case_name = case_file.stem
    output_file = output_dir / f"{case_name}_forge.json"
    
    output_data = {
        "case_name": case.problem.name,
        "timestamp": datetime.now().isoformat(),
        "hypotheses": [
            {
                "id": hyp.id,
                "hypothesis_text": hyp.hypothesis_text,
                "category": hyp.category.value,
                "testable_prediction": hyp.testable_prediction,
                "falsification_test": hyp.falsification_test,
                "falsification_cost": hyp.falsification_cost,
                "falsification_time": hyp.falsification_time,
                "confidence": hyp.confidence,
                "adjacent_domains": hyp.adjacent_domains,
                "assumptions_challenged": hyp.assumptions_challenged,
                "evidence_type": hyp.evidence_type,
                "provenance": hyp.provenance,
                "requires_validation": hyp.requires_validation
            }
            for hyp in hypotheses
        ],
        "adjacencies": [
            {
                "source_domain": adj.source_domain,
                "target_application": adj.target_application,
                "technique": adj.technique,
                "relevance_score": adj.relevance_score,
                "reference_hint": adj.reference_hint
            }
            for adj in adjacencies
        ],
        "experiments": [
            {
                "hypothesis_id": exp.hypothesis_id,
                "experiment_name": exp.experiment_name,
                "objective": exp.objective,
                "method": exp.method,
                "measurements": exp.measurements,
                "success_criterion": exp.success_criterion,
                "falsification_criterion": exp.falsification_criterion,
                "estimated_cost": exp.estimated_cost,
                "estimated_time": exp.estimated_time,
                "equipment_needed": exp.equipment_needed,
                "data_to_feed_back": exp.data_to_feed_back,
                "confidence": exp.confidence,
                "evidence_type": exp.evidence_type,
                "provenance": exp.provenance,
                "requires_validation": exp.requires_validation,
                "quality_score": exp.quality_score,
                "needs_more_context": exp.needs_more_context,
                "missing_fields": exp.missing_fields,
                "is_spam": exp.is_spam,
                "safety_check": exp.safety_check
            }
            for exp in experiments
        ]
    }
    
    with open(output_file, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    print(f"Output saved to: {output_file}")
    print()


if __name__ == "__main__":
    main()
