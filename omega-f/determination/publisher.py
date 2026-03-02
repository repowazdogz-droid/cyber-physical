"""Publication system for determinations"""
from typing import Dict, List, Any, Optional
from datetime import datetime
from core.types import GovernanceDetermination, GovernabilityStatus

class DeterminationPublisher:
    """Publishes determinations to public records"""
    
    def __init__(self):
        self.published_determinations: Dict[str, GovernanceDetermination] = {}
    
    def publish(self, determination: GovernanceDetermination, 
                release_date: Optional[datetime] = None) -> bool:
        """Publish determination to public records"""
        if release_date is None:
            release_date = datetime.utcnow()
        
        determination.public_release_date = release_date
        self.published_determinations[determination.id] = determination
        
        return True
    
    def get_published(self, determination_id: str) -> Optional[GovernanceDetermination]:
        """Get published determination by ID"""
        return self.published_determinations.get(determination_id)
    
    def list_published(self, 
                      status: Optional[GovernabilityStatus] = None,
                      limit: int = 100) -> List[GovernanceDetermination]:
        """List published determinations"""
        determinations = list(self.published_determinations.values())
        
        if status:
            determinations = [d for d in determinations if d.status == status]
        
        return determinations[:limit]
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get statistics on published determinations"""
        determinations = list(self.published_determinations.values())
        
        status_counts = {}
        for status in GovernabilityStatus:
            count = len([d for d in determinations if d.status == status])
            status_counts[status.value] = count
        
        violation_counts = {}
        for determination in determinations:
            for violation in determination.violations:
                violation_type = violation.violation_type.value
                violation_counts[violation_type] = violation_counts.get(violation_type, 0) + 1
        
        return {
            "total_determinations": len(determinations),
            "status_distribution": status_counts,
            "common_violations": violation_counts,
            "last_updated": max([d.assessment_date for d in determinations]).isoformat() if determinations else None
        }
