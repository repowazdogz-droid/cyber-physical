"""Test public interface"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.types import SystemSpecification, SystemType, GovernabilityStatus
from assessment.protocol import AssessmentProtocol
from determination.publisher import DeterminationPublisher
from output.public_records import PublicRecordManager

def test_public_records():
    """Test public record management"""
    
    system_spec = SystemSpecification(
        name="Test System",
        system_type=SystemType.AI_SYSTEM
    )
    
    protocol = AssessmentProtocol()
    determination = protocol.assess_system_governance(system_spec)
    
    record_manager = PublicRecordManager()
    published = record_manager.publish_determination(determination)
    
    assert published, "Should successfully publish determination"
    
    # Get published record
    record = record_manager.get_public_record(determination.id)
    assert record is not None, "Should retrieve published record"
    assert record["determination_number"] == determination.determination_number
    
    # List published records
    records = record_manager.list_public_records()
    assert len(records) > 0, "Should list published records"
    
    # Get statistics
    stats = record_manager.get_statistics()
    assert "total_determinations" in stats
    assert stats["total_determinations"] > 0
    
    print("✓ Public records working correctly!")

if __name__ == "__main__":
    test_public_records()
    print("\n✓ All public interface tests passed!")
