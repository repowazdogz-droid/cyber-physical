"""Test determination generation"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.types import SystemSpecification, SystemType, GovernabilityStatus, GovernanceDetermination
from assessment.protocol import AssessmentProtocol
from determination.validator import DeterminationValidator
from determination.formatter import DeterminationFormatter

def test_determination_validation():
    """Test determination validation"""
    
    system_spec = SystemSpecification(
        name="Test System",
        system_type=SystemType.AI_SYSTEM
    )
    
    protocol = AssessmentProtocol()
    determination = protocol.assess_system_governance(system_spec)
    
    validator = DeterminationValidator()
    is_valid, errors = validator.validate(determination)
    
    assert is_valid, f"Determination should be valid, got errors: {errors}"
    print("✓ Determination validation working correctly!")

def test_determination_formatting():
    """Test determination formatting"""
    
    system_spec = SystemSpecification(
        name="Test System",
        system_type=SystemType.AI_SYSTEM
    )
    
    protocol = AssessmentProtocol()
    determination = protocol.assess_system_governance(system_spec)
    
    formatter = DeterminationFormatter()
    
    # Test JSON formatting
    json_output = formatter.to_json(determination)
    assert json_output, "JSON output should not be empty"
    assert determination.determination_number in json_output
    
    # Test Markdown formatting
    markdown_output = formatter.to_markdown(determination)
    assert markdown_output, "Markdown output should not be empty"
    assert determination.determination_number in markdown_output
    
    # Test public format
    public_output = formatter.to_public_format(determination)
    assert public_output["determination_number"] == determination.determination_number
    assert public_output["status"] == determination.status.value
    
    print("✓ Determination formatting working correctly!")

if __name__ == "__main__":
    test_determination_validation()
    test_determination_formatting()
    print("\n✓ All determination generation tests passed!")
