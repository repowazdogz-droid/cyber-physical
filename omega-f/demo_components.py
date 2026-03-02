#!/usr/bin/env python3
"""Demonstrate individual OMEGA-F components"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.types import SystemSpecification, SystemType, GovernabilityStatus
from assessment.protocol import AssessmentProtocol
from assessment.criteria import GovernanceCriteria
from assessment.analyzer import SystemAnalyzer
from integration.oplas_assessor import OPLASGovernanceAssessor
from determination.formatter import DeterminationFormatter

def demo_criteria_evaluation():
    """Demonstrate criteria evaluation"""
    print("\n" + "="*60)
    print("DEMO 1: Governance Criteria Evaluation")
    print("="*60)
    
    criteria = GovernanceCriteria()
    
    # Create a test system
    system_spec = SystemSpecification(
        name="Test System",
        system_type=SystemType.AI_SYSTEM,
        autonomous_components=["processor"],
        human_oversight_points=["input_validation"],
        information_visibility={"processor": "full"},
        control_mechanisms=["halt_authority", "audit_trail"],
        deployment_scope="bounded_tasks"
    )
    
    results = criteria.evaluate_system(system_spec)
    
    print("\nCriteria Evaluation Results:")
    for principle, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {principle.value:40} {status}")

def demo_system_analysis():
    """Demonstrate system analysis"""
    print("\n" + "="*60)
    print("DEMO 2: System Analysis")
    print("="*60)
    
    analyzer = SystemAnalyzer()
    
    system_spec = SystemSpecification(
        name="Analysis Test System",
        system_type=SystemType.AI_SYSTEM,
        autonomous_components=["component1", "component2"],
        human_oversight_points=["gate1", "gate2"],
        control_mechanisms=["control1", "control2", "control3"],
        information_visibility={"component1": "full", "component2": "partial"},
        deployment_scope="bounded_domain"
    )
    
    structure = analyzer.analyze_structure(system_spec)
    risk_profile = analyzer.analyze_risk_profile(system_spec)
    
    print("\nStructure Analysis:")
    for key, value in structure.items():
        print(f"  {key:25} {value}")
    
    print("\nRisk Profile:")
    for key, value in risk_profile.items():
        if isinstance(value, dict):
            print(f"  {key}:")
            for k, v in value.items():
                print(f"    {k}: {v}")
        else:
            print(f"  {key:25} {value}")

def demo_full_assessment():
    """Demonstrate full assessment protocol"""
    print("\n" + "="*60)
    print("DEMO 3: Full Assessment Protocol")
    print("="*60)
    
    protocol = AssessmentProtocol()
    
    system_spec = SystemSpecification(
        name="Governable System Example",
        description="A well-designed system with proper governance",
        system_type=SystemType.AI_SYSTEM,
        autonomous_components=[],
        human_oversight_points=["task_definition", "result_approval"],
        decision_authority_structure={
            "task_definition": "human",
            "execution": "human_with_assistance",
            "result_approval": "human"
        },
        deployment_scope="bounded_intellectual_tasks",
        stakeholder_impact=["decision_support"],
        reversibility_characteristics={
            "artifact_generation": True,
            "human_override": True
        },
        information_visibility={
            "execution": "full",
            "results": "full"
        },
        control_mechanisms=[
            "human_approval_gates",
            "audit_trail",
            "replay_capability"
        ]
    )
    
    determination = protocol.assess_system_governance(system_spec)
    
    print(f"\nDetermination Number: {determination.determination_number}")
    print(f"Status: {determination.status.value.upper()}")
    print(f"Summary: {determination.summary}")
    print(f"\nViolations Found: {len(determination.violations)}")
    if determination.violations:
        for i, violation in enumerate(determination.violations, 1):
            print(f"  {i}. {violation.violation_type.value} ({violation.severity})")
            print(f"     {violation.description}")
    print(f"\nEvidence Collected: {len(determination.evidence)}")
    print(f"Risk Level: {determination.risk_assessment.get('overall_risk_level', 'unknown')}")

def demo_oplas_integration():
    """Demonstrate OPLAS integration"""
    print("\n" + "="*60)
    print("DEMO 4: OPLAS Integration")
    print("="*60)
    
    assessor = OPLASGovernanceAssessor()
    
    oplas_config = {
        "system_name": "OPLAS Demo System",
        "description": "Deterministic post-LLM abstraction system",
        "deployment_scope": "bounded_tasks",
        "learned_models_in_parse_path": False,
        "control_mechanisms": [
            "deterministic_parsing",
            "verification_gates",
            "human_approval_points"
        ]
    }
    
    result = assessor.assess_oplas_system(oplas_config)
    
    determination = result["determination"]
    compliance = result["compliance_status"]
    
    print(f"\nOPLAS System Assessment:")
    print(f"  Status: {determination.status.value.upper()}")
    print(f"\nOmega Compliance:")
    for key, value in compliance.items():
        status = "✓" if value else "✗"
        print(f"  {status} {key}: {value}")
    
    print(f"\nRecommendations:")
    for rec in result["recommendations"]:
        print(f"  • {rec}")

def demo_determination_formatting():
    """Demonstrate determination formatting"""
    print("\n" + "="*60)
    print("DEMO 5: Determination Formatting")
    print("="*60)
    
    protocol = AssessmentProtocol()
    
    system_spec = SystemSpecification(
        name="Formatting Demo System",
        system_type=SystemType.AI_SYSTEM,
        deployment_scope="bounded_tasks"
    )
    
    determination = protocol.assess_system_governance(system_spec)
    formatter = DeterminationFormatter()
    
    # JSON format
    json_output = formatter.to_json(determination)
    print(f"\nJSON Format (first 300 chars):")
    print(json_output[:300] + "...")
    
    # Markdown format
    markdown_output = formatter.to_markdown(determination)
    print(f"\nMarkdown Format (first 400 chars):")
    print(markdown_output[:400] + "...")
    
    # Public format
    public_output = formatter.to_public_format(determination)
    print(f"\nPublic Record Format:")
    for key, value in public_output.items():
        if isinstance(value, list):
            print(f"  {key}: [{len(value)} items]")
        else:
            print(f"  {key}: {value}")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("OMEGA-F Component Demonstrations")
    print("="*60)
    
    demo_criteria_evaluation()
    demo_system_analysis()
    demo_full_assessment()
    demo_oplas_integration()
    demo_determination_formatting()
    
    print("\n" + "="*60)
    print("All demonstrations completed!")
    print("="*60 + "\n")
