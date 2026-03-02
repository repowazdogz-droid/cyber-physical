#!/usr/bin/env python3
"""Run all Forge test suites and generate summary statistics."""

import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))

from spine.runtime.analyzer import DecisionAnalyzer
from spine.runtime.schemas import CaseInput, ProblemDefinition
from forge.hypothesis_engine import generate_hypotheses
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
    return formal_data


def analyze_case(case_file: Path):
    """Analyze a single case file."""
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
    
    analyzer = DecisionAnalyzer()
    spine_output = analyzer.analyze(case, design_data=formal_design_data)
    
    hypotheses = generate_hypotheses(spine_output, domain=case.problem.domain)
    experiments = build_experiments(hypotheses)
    
    return {
        'case_name': case.problem.name,
        'hypotheses': hypotheses,
        'experiments': experiments,
        'metadata': case_data.get('metadata', {})
    }


def main():
    print("=" * 70)
    print("FORGE v1 - All Suites Analysis")
    print("=" * 70)
    print()
    
    forge_dir = Path(__file__).parent
    
    # Original cases
    original_cases = sorted((forge_dir / "cases").glob("*.yaml"))
    original_results = []
    
    print("Original Cases:")
    for case_file in original_cases:
        result = analyze_case(case_file)
        original_results.append(result)
        print(f"  {result['case_name']}: {len(result['hypotheses'])} hypotheses, {len(result['experiments'])} experiments")
    
    print()
    
    # Adversarial cases
    adversarial_cases = sorted((forge_dir / "cases" / "adversarial").glob("fadv_*.yaml"))
    adversarial_results = []
    
    print("Adversarial Cases:")
    for case_file in adversarial_cases:
        result = analyze_case(case_file)
        adversarial_results.append(result)
        trap_type = result['metadata'].get('trap_type', 'unknown')
        hypotheses_count = len(result['hypotheses'])
        experiments_count = len(result['experiments'])
        spam_count = sum(1 for exp in result['experiments'] if exp.is_spam)
        dangerous_count = sum(1 for exp in result['experiments'] if not exp.safety_check)
        print(f"  {case_file.stem}: {hypotheses_count} hypotheses, {experiments_count} experiments, spam={spam_count}, dangerous={dangerous_count} ({trap_type})")
    
    print()
    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    
    total_original_hypotheses = sum(len(r['hypotheses']) for r in original_results)
    total_original_experiments = sum(len(r['experiments']) for r in original_results)
    total_adversarial_hypotheses = sum(len(r['hypotheses']) for r in adversarial_results)
    total_adversarial_experiments = sum(len(r['experiments']) for r in adversarial_results)
    
    total_spam = sum(sum(1 for exp in r['experiments'] if exp.is_spam) for r in adversarial_results)
    total_dangerous = sum(sum(1 for exp in r['experiments'] if not exp.safety_check) for r in adversarial_results)
    
    print(f"Original Cases: {len(original_cases)}")
    print(f"  Total Hypotheses: {total_original_hypotheses}")
    print(f"  Total Experiments: {total_original_experiments}")
    print()
    print(f"Adversarial Cases: {len(adversarial_cases)}")
    print(f"  Total Hypotheses: {total_adversarial_hypotheses}")
    print(f"  Total Experiments: {total_adversarial_experiments}")
    print(f"  Spam Rate: {total_spam}/{total_adversarial_experiments} ({total_spam/total_adversarial_experiments*100 if total_adversarial_experiments > 0 else 0:.1f}%)")
    print(f"  Dangerous Suggestions: {total_dangerous} (target: 0)")
    print()


if __name__ == "__main__":
    main()
