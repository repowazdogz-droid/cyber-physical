#!/usr/bin/env python3
"""Quick verification script for OMEGA-F setup"""
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def verify_imports():
    """Verify all critical imports work"""
    print("Verifying imports...")
    
    try:
        from core.types import (
            SystemSpecification, SystemType, GovernabilityStatus,
            GovernanceDetermination, GovernanceViolation, GovernanceEvidence
        )
        print("✓ Core types imported")
    except Exception as e:
        print(f"✗ Core types import failed: {e}")
        return False
    
    try:
        from assessment.protocol import AssessmentProtocol
        print("✓ Assessment protocol imported")
    except Exception as e:
        print(f"✗ Assessment protocol import failed: {e}")
        return False
    
    try:
        from integration.oplas_assessor import OPLASGovernanceAssessor
        print("✓ OPLAS assessor imported")
    except Exception as e:
        print(f"✗ OPLAS assessor import failed: {e}")
        return False
    
    try:
        from determination.validator import DeterminationValidator
        print("✓ Determination validator imported")
    except Exception as e:
        print(f"✗ Determination validator import failed: {e}")
        return False
    
    return True

def verify_basic_functionality():
    """Verify basic functionality works"""
    print("\nVerifying basic functionality...")
    
    try:
        from core.types import SystemSpecification, SystemType
        from assessment.protocol import AssessmentProtocol
        
        # Create a simple system spec
        system_spec = SystemSpecification(
            name="Test System",
            system_type=SystemType.AI_SYSTEM,
            deployment_scope="bounded_tasks"
        )
        
        # Run assessment
        protocol = AssessmentProtocol()
        determination = protocol.assess_system_governance(system_spec)
        
        assert determination.status is not None
        assert determination.determination_number != ""
        assert determination.system_specification.name == "Test System"
        
        print(f"✓ Assessment completed: {determination.status.value}")
        print(f"✓ Determination number: {determination.determination_number}")
        return True
        
    except Exception as e:
        print(f"✗ Basic functionality test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("OMEGA-F Setup Verification\n" + "=" * 40)
    
    if not verify_imports():
        print("\n✗ Import verification failed")
        sys.exit(1)
    
    if not verify_basic_functionality():
        print("\n✗ Functionality verification failed")
        sys.exit(1)
    
    print("\n" + "=" * 40)
    print("✓ All verifications passed!")
    print("\nOMEGA-F is ready to use.")
    print("\nNext steps:")
    print("  1. Install dependencies: pip install fastapi uvicorn pydantic")
    print("  2. Run tests: python tests/test_assessment_protocol.py")
    print("  3. Start API server: uvicorn output.api_interface:app --reload")
