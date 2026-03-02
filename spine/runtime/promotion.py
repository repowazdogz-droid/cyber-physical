"""Failure promotion pipeline - tracks missed failures and their fixes."""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
import json


@dataclass
class PromotionRecord:
    """Record of a promoted miss."""
    timestamp: datetime
    failure_description: str
    root_cause: str
    constraint_added: str  # constraint_id
    regression_case_path: str
    status: str = "promoted"  # "promoted", "verified", "regressed"


class FailurePromotionPipeline:
    """Pipeline for promoting missed failures into constraints."""
    
    def __init__(self, log_path: Optional[str] = None):
        self.log_path = Path(log_path) if log_path else Path.home() / ".spine" / "promotion_log.json"
        self.promotions: List[PromotionRecord] = []
        self._load()
    
    def _load(self):
        """Load promotion log from disk."""
        if self.log_path.exists():
            try:
                with open(self.log_path) as f:
                    data = json.load(f)
                    for record_data in data.get("promotions", []):
                        record_data["timestamp"] = datetime.fromisoformat(record_data["timestamp"])
                        self.promotions.append(PromotionRecord(**record_data))
            except (json.JSONDecodeError, KeyError, ValueError) as e:
                # Log corrupted, start fresh
                print(f"Warning: Could not load promotion log: {e}")
                self.promotions = []
    
    def _save(self):
        """Save promotion log to disk."""
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "promotions": [
                {
                    "timestamp": r.timestamp.isoformat(),
                    "failure_description": r.failure_description,
                    "root_cause": r.root_cause,
                    "constraint_added": r.constraint_added,
                    "regression_case_path": r.regression_case_path,
                    "status": r.status
                }
                for r in self.promotions
            ]
        }
        with open(self.log_path, "w") as f:
            json.dump(data, f, indent=2)
    
    def promote_miss(
        self,
        failure_description: str,
        root_cause: str,
        constraint_id: str,
        test_case_yaml: str
    ) -> PromotionRecord:
        """
        Promote a missed failure into a formal constraint.
        
        Args:
            failure_description: Description of the failure that was missed
            root_cause: Root cause analysis of why it was missed
            constraint_id: ID of the constraint that was added (e.g., "FORMAL_011")
            test_case_yaml: Path to regression test case YAML file
            
        Returns:
            PromotionRecord
        """
        # Verify regression case exists
        case_path = Path(test_case_yaml)
        if not case_path.exists():
            raise ValueError(f"Regression case not found: {test_case_yaml}")
        
        record = PromotionRecord(
            timestamp=datetime.utcnow(),
            failure_description=failure_description,
            root_cause=root_cause,
            constraint_added=constraint_id,
            regression_case_path=str(case_path.absolute()),
            status="promoted"
        )
        
        self.promotions.append(record)
        self._save()
        return record
    
    def list_promotions(self, status: Optional[str] = None) -> List[PromotionRecord]:
        """
        List all promotions, optionally filtered by status.
        
        Args:
            status: Optional status filter ("promoted", "verified", "regressed")
            
        Returns:
            List of PromotionRecord objects
        """
        if status:
            return [r for r in self.promotions if r.status == status]
        return self.promotions.copy()
    
    def update_status(self, constraint_id: str, status: str):
        """
        Update status of a promotion.
        
        Args:
            constraint_id: Constraint ID to update
            status: New status
        """
        for record in self.promotions:
            if record.constraint_added == constraint_id:
                record.status = status
                self._save()
                return
        raise ValueError(f"Promotion not found for constraint {constraint_id}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get promotion statistics."""
        return {
            "total_promotions": len(self.promotions),
            "by_status": {
                status: len([r for r in self.promotions if r.status == status])
                for status in ["promoted", "verified", "regressed"]
            },
            "by_constraint": {
                constraint_id: len([r for r in self.promotions if r.constraint_added == constraint_id])
                for constraint_id in set(r.constraint_added for r in self.promotions)
            }
        }


# Convenience functions
_pipeline = None

def get_pipeline() -> FailurePromotionPipeline:
    """Get singleton promotion pipeline instance."""
    global _pipeline
    if _pipeline is None:
        _pipeline = FailurePromotionPipeline()
    return _pipeline

def promote_miss(
    failure_description: str,
    root_cause: str,
    constraint_id: str,
    test_case_yaml: str
) -> PromotionRecord:
    """Convenience function to promote a miss."""
    return get_pipeline().promote_miss(failure_description, root_cause, constraint_id, test_case_yaml)

def list_promotions(status: Optional[str] = None) -> List[PromotionRecord]:
    """Convenience function to list promotions."""
    return get_pipeline().list_promotions(status)
