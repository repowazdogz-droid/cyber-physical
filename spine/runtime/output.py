"""Output formatter for Spine Decision Runtime results."""

import yaml
import json
from datetime import datetime
from typing import Dict, Any, Optional
from .schemas import DecisionAnalysis
from .trace import DecisionTraceGraph, TraceNode


def format_analysis(analysis: DecisionAnalysis) -> str:
    """
    Format decision analysis as YAML string.
    
    Args:
        analysis: DecisionAnalysis to format
        
    Returns:
        Formatted YAML string
    """
    output_dict = {
        'decision_map': {
            'constraints_checked': [
                {
                    'constraint': check.constraint,
                    'checked': check.checked,
                    'contract_matched': check.contract_matched,
                    'violation': check.violation
                }
                for check in analysis.decision_map.constraints_checked
            ],
            'violations': analysis.decision_map.violations
        },
        'failure_modes': [
            {
                'mode': fm.mode,
                'severity': fm.severity,
                'mitigation': fm.mitigation,
                **({'epistemic': {
                    'confidence': fm.epistemic.confidence,
                    'evidence_type': fm.epistemic.evidence_type,
                    'provenance': fm.epistemic.provenance,
                    'requires_validation': fm.epistemic.requires_validation,
                    **({'conditional_confidence': f"{fm.conditional_confidence.min_confidence:.2f}-{fm.conditional_confidence.max_confidence:.2f} (sensitivity: {fm.conditional_confidence.sensitivity:.2f})"} if fm.conditional_confidence else {})
                }} if fm.epistemic else {}),
                **({'conditional_confidence': {
                    'base': fm.conditional_confidence.base_confidence,
                    'min': fm.conditional_confidence.min_confidence,
                    'max': fm.conditional_confidence.max_confidence,
                    'sensitivity': fm.conditional_confidence.sensitivity,
                    'dependent_on': fm.conditional_confidence.dependent_on
                }} if fm.conditional_confidence else {})
            }
            for fm in analysis.failure_modes
        ],
        'contradictions': [
            {
                'description': c.description,
                **({'epistemic': {
                    'confidence': c.epistemic.confidence,
                    'evidence_type': c.epistemic.evidence_type,
                    'provenance': c.epistemic.provenance,
                    'requires_validation': c.epistemic.requires_validation,
                    **({'conditional_confidence': f"{c.conditional_confidence.min_confidence:.2f}-{c.conditional_confidence.max_confidence:.2f} (sensitivity: {c.conditional_confidence.sensitivity:.2f})"} if c.conditional_confidence else {})
                }} if c.epistemic else {}),
                **({'conditional_confidence': {
                    'base': c.conditional_confidence.base_confidence,
                    'min': c.conditional_confidence.min_confidence,
                    'max': c.conditional_confidence.max_confidence,
                    'sensitivity': c.conditional_confidence.sensitivity,
                    'dependent_on': c.conditional_confidence.dependent_on
                }} if c.conditional_confidence else {})
            }
            for c in analysis.contradictions
        ],
        'unknowns': [
            {
                'item': u.item,
                'impact': u.impact,
                'resolution': u.resolution,
                **({'epistemic': {
                    'confidence': u.epistemic.confidence,
                    'evidence_type': u.epistemic.evidence_type,
                    'provenance': u.epistemic.provenance,
                    'requires_validation': u.epistemic.requires_validation,
                    **({'conditional_confidence': f"{u.conditional_confidence.min_confidence:.2f}-{u.conditional_confidence.max_confidence:.2f} (sensitivity: {u.conditional_confidence.sensitivity:.2f})"} if u.conditional_confidence else {})
                }} if u.epistemic else {}),
                **({'conditional_confidence': {
                    'base': u.conditional_confidence.base_confidence,
                    'min': u.conditional_confidence.min_confidence,
                    'max': u.conditional_confidence.max_confidence,
                    'sensitivity': u.conditional_confidence.sensitivity,
                    'dependent_on': u.conditional_confidence.dependent_on
                }} if u.conditional_confidence else {})
            }
            for u in analysis.unknowns
        ],
        'recommended_experiments': [
            {
                'name': exp.name,
                **({'epistemic': {
                    'confidence': exp.epistemic.confidence,
                    'evidence_type': exp.epistemic.evidence_type,
                    'provenance': exp.epistemic.provenance,
                    'requires_validation': exp.epistemic.requires_validation
                }} if exp.epistemic else {})
            }
            for exp in analysis.recommended_experiments
        ],
        'falsification_tests': [
            {
                'id': t.id,
                'target_claim': t.target_claim,
                'target_output_id': t.target_output_id,
                'test_description': t.test_description,
                'test_type': t.test_type,
                'falsification_criterion': t.falsification_criterion,
                'confirmation_criterion': t.confirmation_criterion,
                'estimated_cost': t.estimated_cost,
                'estimated_time': t.estimated_time,
                'decision_impact': t.decision_impact,
                'priority': t.priority,
                'required_equipment': t.required_equipment,
                'required_expertise': t.required_expertise
            }
            for t in analysis.falsification_tests
        ],
        'formal_constraints': [
            {
                'id': fc.constraint_id,
                'name': fc.constraint_name,
                'result': fc.result,
                'status': '[PROVEN SATISFIED]' if fc.result == 'proven_satisfied' else '[PROVEN VIOLATED]' if fc.result == 'proven_violated' else '[UNKNOWN]',
                'value': fc.value,
                'threshold': fc.threshold,
                'margin': fc.margin,
                'evidence': fc.evidence,
                'confidence': fc.confidence
            }
            for fc in analysis.formal_constraints
        ]
    }
    
    # Add trace graph summary if available
    if analysis.trace_graph:
        output_dict['trace_summary'] = {
            'run_id': analysis.trace_graph.get('run_id'),
            'node_count': len(analysis.trace_graph.get('nodes', {})),
            'timestamp': analysis.trace_graph.get('timestamp')
        }
    
    return yaml.dump(output_dict, default_flow_style=False, sort_keys=False)


def print_analysis(analysis: DecisionAnalysis) -> None:
    """
    Print formatted analysis to stdout.
    
    Args:
        analysis: DecisionAnalysis to print
    """
    print(format_analysis(analysis))


def export_trace_json(analysis: DecisionAnalysis) -> str:
    """
    Export full trace graph as JSON string.
    
    Args:
        analysis: DecisionAnalysis containing trace graph
        
    Returns:
        JSON string of trace graph
    """
    if not analysis.trace_graph:
        return json.dumps({"error": "No trace graph available"}, indent=2)
    
    return json.dumps(analysis.trace_graph, indent=2, default=str)


def explain_output(analysis: DecisionAnalysis, output_id: str) -> str:
    """
    Generate human-readable explanation for a specific output.
    
    Args:
        analysis: DecisionAnalysis containing trace graph
        output_id: ID of the output node to explain
        
    Returns:
        Human-readable explanation string
    """
    if not analysis.trace_graph:
        return f"No trace graph available for output {output_id}"
    
    # Reconstruct trace graph from dict
    trace = DecisionTraceGraph()
    trace.run_id = analysis.trace_graph.get('run_id', '')
    trace.nodes = {}
    
    # Reconstruct nodes from dict
    for node_id, node_data in analysis.trace_graph.get('nodes', {}).items():
        timestamp = datetime.fromisoformat(node_data['timestamp']) if isinstance(node_data.get('timestamp'), str) else datetime.utcnow()
        
        trace.nodes[node_id] = TraceNode(
            id=node_data['id'],
            node_type=node_data['type'],
            content=node_data['content'],
            timestamp=timestamp,
            parents=node_data.get('parents', []),
            metadata=node_data.get('metadata', {})
        )
    
    return trace.explain(output_id)


def print_falsification_tests(analysis: DecisionAnalysis) -> None:
    """
    Print falsification tests in a readable format.
    
    Args:
        analysis: DecisionAnalysis containing falsification tests
    """
    if not analysis.falsification_tests:
        print("No falsification tests generated.")
        return
    
    print(f"Falsification Tests ({len(analysis.falsification_tests)} total)\n")
    print("=" * 80)
    
    for i, test in enumerate(analysis.falsification_tests, 1):
        print(f"\nTest {i}: {test.id}")
        print(f"  Target: {test.target_claim}")
        print(f"  Type: {test.test_type} | Cost: {test.estimated_cost} | Time: {test.estimated_time} | Priority: {test.priority}")
        print(f"\n  Description:")
        print(f"    {test.test_description}")
        print(f"\n  Falsification Criterion:")
        print(f"    {test.falsification_criterion}")
        print(f"\n  Confirmation Criterion:")
        print(f"    {test.confirmation_criterion}")
        print(f"\n  Decision Impact:")
        print(f"    {test.decision_impact}")
        
        if test.required_equipment:
            print(f"\n  Required Equipment:")
            for eq in test.required_equipment:
                print(f"    - {eq}")
        
        if test.required_expertise:
            print(f"\n  Required Expertise:")
            for exp in test.required_expertise:
                print(f"    - {exp}")
        
        print("\n" + "-" * 80)
    
    # Summary
    cost_counts = {}
    priority_counts = {}
    for test in analysis.falsification_tests:
        cost_counts[test.estimated_cost] = cost_counts.get(test.estimated_cost, 0) + 1
        priority_counts[test.priority] = priority_counts.get(test.priority, 0) + 1
    
    print("\nSummary:")
    print(f"  Total tests: {len(analysis.falsification_tests)}")
    print(f"  By cost: {dict(cost_counts)}")
    print(f"  By priority: {dict(sorted(priority_counts.items()))}")


def print_formal_constraints(analysis: DecisionAnalysis) -> None:
    """
    Print formal constraint results in a readable format.
    
    Args:
        analysis: DecisionAnalysis containing formal constraint results
    """
    if not analysis.formal_constraints:
        print("No formal constraints checked (design_data not provided).")
        return
    
    print("Formal Constraint Checks")
    print("=" * 80)
    
    proven_satisfied = [fc for fc in analysis.formal_constraints if fc.result == "proven_satisfied"]
    proven_violated = [fc for fc in analysis.formal_constraints if fc.result == "proven_violated"]
    unknown = [fc for fc in analysis.formal_constraints if fc.result == "unknown"]
    
    if proven_violated:
        print("\n[PROVEN VIOLATED]")
        print("-" * 80)
        for fc in proven_violated:
            print(f"\n{fc.constraint_id}: {fc.constraint_name}")
            print(f"  Status: [PROVEN VIOLATED]")
            if fc.value is not None and fc.threshold is not None:
                print(f"  Value: {fc.value:.2f} | Threshold: {fc.threshold:.2f} | Margin: {fc.margin:.2f}")
            print(f"  Evidence: {fc.evidence}")
    
    if proven_satisfied:
        print("\n[PROVEN SATISFIED]")
        print("-" * 80)
        for fc in proven_satisfied:
            print(f"\n{fc.constraint_id}: {fc.constraint_name}")
            print(f"  Status: [PROVEN SATISFIED]")
            if fc.value is not None and fc.threshold is not None:
                print(f"  Value: {fc.value:.2f} | Threshold: {fc.threshold:.2f} | Margin: {fc.margin:.2f}")
            print(f"  Evidence: {fc.evidence}")
    
    if unknown:
        print("\n[UNKNOWN]")
        print("-" * 80)
        for fc in unknown:
            print(f"\n{fc.constraint_id}: {fc.constraint_name}")
            print(f"  Status: [UNKNOWN]")
            print(f"  Evidence: {fc.evidence}")
    
    print("\n" + "=" * 80)
    print("\nSummary:")
    print(f"  Proven Satisfied: {len(proven_satisfied)}")
    print(f"  Proven Violated: {len(proven_violated)}")
    print(f"  Unknown: {len(unknown)}")
