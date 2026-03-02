"""Public determination records"""
from typing import Dict, List, Any, Optional
from datetime import datetime
from core.types import GovernanceDetermination, GovernabilityStatus
from determination.publisher import DeterminationPublisher

class PublicRecordManager:
    """Manages public determination records"""
    
    def __init__(self):
        self.publisher = DeterminationPublisher()
    
    def publish_determination(self, 
                            determination: GovernanceDetermination,
                            release_date: Optional[datetime] = None) -> bool:
        """Publish determination to public records"""
        return self.publisher.publish(determination, release_date)
    
    def get_public_record(self, determination_id: str) -> Optional[Dict[str, Any]]:
        """Get public record for determination"""
        determination = self.publisher.get_published(determination_id)
        if determination:
            return determination.to_public_record()
        return None
    
    def list_public_records(self,
                           status: Optional[GovernabilityStatus] = None,
                           limit: int = 100) -> List[Dict[str, Any]]:
        """List public determination records"""
        determinations = self.publisher.list_published(status, limit)
        return [d.to_public_record() for d in determinations]
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get public statistics"""
        return self.publisher.get_statistics()
