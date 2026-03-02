"""Test integration modules"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from integration.oplas_assessor import OPLASGovernanceAssessor
from integration.constraint_assessor import ConstraintUniverseGovernanceAssessor
from integration.orientation_assessor import OrientationLabGovernanceAssessor
from integration.spine_integration import SpineGovernanceIntegration

def test_oplas_integration():
    """Test OPLAS integration"""
    
    assessor = OPLASGovernanceAssessor()
    
    oplas_config = {
        "system_name": "Test OPLAS",
        "description": "Test OPLAS system",
        "deployment_scope": "bounded_tasks",
        "learned_models_in_parse_path": False
    }
    
    result = assessor.assess_oplas_system(oplas_config)
    
    assert "determination" in result
    assert "recommendations" in result
    assert "compliance_status" in result
    
    print("✓ OPLAS integration working correctly!")

def test_constraint_integration():
    """Test Constraint Universe integration"""
    
    assessor = ConstraintUniverseGovernanceAssessor()
    
    constraint_config = {
        "system_name": "Test Constraint System",
        "deployment_scope": "bounded_constraints"
    }
    
    result = assessor.assess_constraint_system(constraint_config)
    
    assert "determination" in result
    assert "recommendations" in result
    
    print("✓ Constraint Universe integration working correctly!")

def test_orientation_integration():
    """Test Orientation Lab integration"""
    
    assessor = OrientationLabGovernanceAssessor()
    
    orientation_config = {
        "system_name": "Test Orientation System",
        "deployment_scope": "bounded_orientation_tasks"
    }
    
    result = assessor.assess_orientation_system(orientation_config)
    
    assert "determination" in result
    assert "recommendations" in result
    
    print("✓ Orientation Lab integration working correctly!")

def test_spine_integration():
    """Test Spine integration"""
    
    integration = SpineGovernanceIntegration()
    
    contract_spec = {
        "contract_name": "Test Contract",
        "scope": "contractual_boundaries"
    }
    
    result = integration.assess_spine_contract(contract_spec)
    
    assert "determination" in result
    assert "spine_compliance" in result
    
    print("✓ Spine integration working correctly!")

if __name__ == "__main__":
    test_oplas_integration()
    test_constraint_integration()
    test_orientation_integration()
    test_spine_integration()
    print("\n✓ All integration tests passed!")
