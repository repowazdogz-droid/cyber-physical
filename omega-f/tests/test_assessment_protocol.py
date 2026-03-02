"""Test assessment protocol"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.types import SystemSpecification, SystemType, GovernabilityStatus
from assessment.protocol import AssessmentProtocol

def test_oplas_assessment():
    """Test assessment of OPLAS-compliant system"""
    
    # Create OPLAS-like system specification
    oplas_system = SystemSpecification(
        name="Test OPLAS System",
        description="Deterministic post-LLM abstraction system",
        system_type=SystemType.AI_SYSTEM,
        autonomous_components=[],  # No autonomous components
        human_oversight_points=[
            "task_specification", "result_verification", "concept_validation"
        ],
        decision_authority_structure={
            "task_definition": "human",
            "execution_approach": "deterministic_with_verification",
            "result_acceptance": "human"
        },
        deployment_scope="bounded_intellectual_tasks",
        stakeholder_impact=["decision_support"],
        reversibility_characteristics={
            "artifact_generation": True,
            "execution_replay": True,
            "human_override": True
        },
        information_visibility={
            "parsing_process": "full",
            "execution_trace": "full",
            "verification_results": "full"
        },
        control_mechanisms=[
            "deterministic_parsing",
            "verification_gates", 
            "human_approval_points",
            "replay_capability"
        ]
    )
    
    # Run assessment
    protocol = AssessmentProtocol()
    determination = protocol.assess_system_governance(oplas_system)
    
    # OPLAS should be governable
    assert determination.status in [
        GovernabilityStatus.GOVERNABLE,
        GovernabilityStatus.CONDITIONALLY_GOVERNABLE
    ], f"Expected governable status, got {determination.status}"
    
    # Should have no critical violations
    critical_violations = [v for v in determination.violations if v.severity == "critical"]
    assert len(critical_violations) == 0, f"Expected no critical violations, got {len(critical_violations)}"
    
    print(f"✓ OPLAS assessment: {determination.status.value}")
    print(f"✓ Violations: {len(determination.violations)}")
    print("✓ Assessment protocol working correctly!")

def test_non_governable_system():
    """Test assessment of clearly non-governable system"""
    
    # Create problematic system specification
    bad_system = SystemSpecification(
        name="Problematic AI Agent",
        description="Autonomous AI with real-world impact",
        system_type=SystemType.AUTONOMOUS_AGENT,
        autonomous_components=["decision_maker", "action_executor"],
        human_oversight_points=[],  # No human oversight
        decision_authority_structure={
            "goal_setting": "autonomous",
            "action_planning": "autonomous",
            "execution": "autonomous"
        },
        deployment_scope="unrestricted",
        stakeholder_impact=["real_world_actions", "irreversible_decisions"],
        reversibility_characteristics={
            "actions": False,  # Irreversible actions
            "decisions": False
        },
        information_visibility={
            "decision_process": "none",  # No visibility
            "action_planning": "none"
        },
        control_mechanisms=[]  # No control mechanisms
    )
    
    # Run assessment
    protocol = AssessmentProtocol()
    determination = protocol.assess_system_governance(bad_system)
    
    # Should be not governable
    assert determination.status == GovernabilityStatus.NOT_GOVERNABLE, \
        f"Expected NOT_GOVERNABLE status, got {determination.status}"
    
    # Should have critical violations
    critical_violations = [v for v in determination.violations if v.severity == "critical"]
    assert len(critical_violations) > 0, \
        f"Expected critical violations, got {len(critical_violations)}"
    
    print(f"✓ Bad system assessment: {determination.status.value}")
    print(f"✓ Critical violations: {len(critical_violations)}")
    print("✓ Violation detection working correctly!")

def test_conditionally_governable_system():
    """Test assessment of conditionally governable system"""
    
    # Create system with high-severity violations that are mitigatable
    conditional_system = SystemSpecification(
        name="Conditional System",
        description="System with mitigatable violations",
        system_type=SystemType.AI_SYSTEM,
        autonomous_components=["processor"],
        human_oversight_points=["input_validation"],
        decision_authority_structure={
            "input": "human",
            "processing": "autonomous"
        },
        deployment_scope="",  # Unbounded scope
        stakeholder_impact=["decision_support"],
        reversibility_characteristics={
            "processing": True
        },
        information_visibility={
            "processor": "partial"
        },
        control_mechanisms=[
            "input_validation"
        ]
    )
    
    protocol = AssessmentProtocol()
    determination = protocol.assess_system_governance(conditional_system)
    
    # Should be conditionally governable or not governable
    assert determination.status in [
        GovernabilityStatus.CONDITIONALLY_GOVERNABLE,
        GovernabilityStatus.NOT_GOVERNABLE
    ], f"Expected conditionally governable or not governable, got {determination.status}"
    
    print(f"✓ Conditional system assessment: {determination.status.value}")
    print("✓ Conditional governability detection working correctly!")

if __name__ == "__main__":
    test_oplas_assessment()
    test_non_governable_system()
    test_conditionally_governable_system()
    print("\n✓ All tests passed!")
