#!/usr/bin/env python3
"""Demonstrate violation detection"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.types import SystemSpecification, SystemType, GovernanceViolationType
from assessment.protocol import AssessmentProtocol

def test_information_asymmetry():
    """Test information asymmetry violation"""
    print("\n" + "="*60)
    print("VIOLATION TEST 1: Information Asymmetry")
    print("="*60)
    
    protocol = AssessmentProtocol()
    
    system_spec = SystemSpecification(
        name="System with Information Asymmetry",
        system_type=SystemType.AI_SYSTEM,
        autonomous_components=["black_box_processor", "hidden_decision_maker"],
        information_visibility={
            "black_box_processor": "none",  # No visibility!
            "hidden_decision_maker": "limited"  # Limited visibility!
        },
        control_mechanisms=["some_control"]
    )
    
    determination = protocol.assess_system_governance(system_spec)
    
    print(f"Status: {determination.status.value.upper()}")
    print(f"\nViolations Found: {len(determination.violations)}")
    
    for violation in determination.violations:
        if violation.violation_type == GovernanceViolationType.INFORMATION_ASYMMETRY:
            print(f"\n  ✗ {violation.violation_type.value.upper()}")
            print(f"    Severity: {violation.severity}")
            print(f"    Description: {violation.description}")
            print(f"    Affected Components: {violation.affected_components}")
            print(f"    Risk Factors:")
            for risk in violation.risk_factors:
                print(f"      • {risk}")
            print(f"    Possible Mitigations:")
            for mitigation in violation.possible_mitigations:
                print(f"      • {mitigation}")

def test_power_consequence_mismatch():
    """Test power-consequence mismatch violation"""
    print("\n" + "="*60)
    print("VIOLATION TEST 2: Power-Consequence Mismatch")
    print("="*60)
    
    protocol = AssessmentProtocol()
    
    system_spec = SystemSpecification(
        name="System with Power-Consequence Mismatch",
        system_type=SystemType.AUTONOMOUS_AGENT,
        autonomous_components=["action_executor"],
        stakeholder_impact=[
            "real_world_actions",  # High impact!
            "irreversible_decisions",  # Critical!
            "safety_critical"
        ],
        control_mechanisms=["monitoring"]  # No halt authority!
    )
    
    determination = protocol.assess_system_governance(system_spec)
    
    print(f"Status: {determination.status.value.upper()}")
    print(f"\nViolations Found: {len(determination.violations)}")
    
    for violation in determination.violations:
        if violation.violation_type == GovernanceViolationType.POWER_CONSEQUENCE_MISMATCH:
            print(f"\n  ✗ {violation.violation_type.value.upper()}")
            print(f"    Severity: {violation.severity}")
            print(f"    Description: {violation.description}")
            print(f"    Risk Factors:")
            for risk in violation.risk_factors:
                print(f"      • {risk}")

def test_delegated_agency():
    """Test delegated agency without halt violation"""
    print("\n" + "="*60)
    print("VIOLATION TEST 3: Delegated Agency Without Halt")
    print("="*60)
    
    protocol = AssessmentProtocol()
    
    system_spec = SystemSpecification(
        name="System with Delegated Agency",
        system_type=SystemType.AUTONOMOUS_AGENT,
        autonomous_components=["autonomous_agent", "decision_maker"],
        control_mechanisms=["monitoring", "logging"]  # No halt!
    )
    
    determination = protocol.assess_system_governance(system_spec)
    
    print(f"Status: {determination.status.value.upper()}")
    print(f"\nViolations Found: {len(determination.violations)}")
    
    for violation in determination.violations:
        if violation.violation_type == GovernanceViolationType.DELEGATED_AGENCY_WITHOUT_HALT:
            print(f"\n  ✗ {violation.violation_type.value.upper()}")
            print(f"    Severity: {violation.severity}")
            print(f"    Description: {violation.description}")
            print(f"    Affected Components: {violation.affected_components}")

def test_rollback_fiction():
    """Test rollback fiction violation"""
    print("\n" + "="*60)
    print("VIOLATION TEST 4: Rollback Fiction")
    print("="*60)
    
    protocol = AssessmentProtocol()
    
    system_spec = SystemSpecification(
        name="System with Rollback Fiction",
        system_type=SystemType.AI_SYSTEM,
        reversibility_characteristics={
            "actions": False,  # Irreversible!
            "decisions": False  # Irreversible!
        },
        control_mechanisms=[
            "rollback_capability",  # Claims rollback but actions are irreversible!
            "undo_mechanism"
        ]
    )
    
    determination = protocol.assess_system_governance(system_spec)
    
    print(f"Status: {determination.status.value.upper()}")
    print(f"\nViolations Found: {len(determination.violations)}")
    
    for violation in determination.violations:
        if violation.violation_type == GovernanceViolationType.ROLLBACK_FICTION:
            print(f"\n  ✗ {violation.violation_type.value.upper()}")
            print(f"    Severity: {violation.severity}")
            print(f"    Description: {violation.description}")
            print(f"    Risk Factors:")
            for risk in violation.risk_factors:
                print(f"      • {risk}")

def test_scope_boundary():
    """Test scope boundary violation"""
    print("\n" + "="*60)
    print("VIOLATION TEST 5: Scope Boundary Violation")
    print("="*60)
    
    protocol = AssessmentProtocol()
    
    system_spec = SystemSpecification(
        name="System with Unbounded Scope",
        system_type=SystemType.AI_SYSTEM,
        autonomous_components=["general_purpose_agent"],
        deployment_scope="unrestricted",  # Unbounded!
        control_mechanisms=["some_control"]
    )
    
    determination = protocol.assess_system_governance(system_spec)
    
    print(f"Status: {determination.status.value.upper()}")
    print(f"\nViolations Found: {len(determination.violations)}")
    
    for violation in determination.violations:
        if violation.violation_type == GovernanceViolationType.SCOPE_BOUNDARY_VIOLATION:
            print(f"\n  ✗ {violation.violation_type.value.upper()}")
            print(f"    Severity: {violation.severity}")
            print(f"    Description: {violation.description}")

def test_accountability_gap():
    """Test accountability gap violation"""
    print("\n" + "="*60)
    print("VIOLATION TEST 6: Accountability Gap")
    print("="*60)
    
    protocol = AssessmentProtocol()
    
    system_spec = SystemSpecification(
        name="System with Accountability Gap",
        system_type=SystemType.AI_SYSTEM,
        autonomous_components=["action_taker"],
        stakeholder_impact=["real_world_actions"],
        control_mechanisms=["some_control"]  # No audit trail!
    )
    
    determination = protocol.assess_system_governance(system_spec)
    
    print(f"Status: {determination.status.value.upper()}")
    print(f"\nViolations Found: {len(determination.violations)}")
    
    for violation in determination.violations:
        if violation.violation_type == GovernanceViolationType.ACCOUNTABILITY_GAP:
            print(f"\n  ✗ {violation.violation_type.value.upper()}")
            print(f"    Severity: {violation.severity}")
            print(f"    Description: {violation.description}")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("OMEGA-F Violation Detection Tests")
    print("="*60)
    
    test_information_asymmetry()
    test_power_consequence_mismatch()
    test_delegated_agency()
    test_rollback_fiction()
    test_scope_boundary()
    test_accountability_gap()
    
    print("\n" + "="*60)
    print("All violation detection tests completed!")
    print("="*60 + "\n")
