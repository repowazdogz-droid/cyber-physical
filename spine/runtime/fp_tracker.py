"""False positive tracking for constraint validation."""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
import json


@dataclass
class FPRecord:
    """Record of a constraint check result."""
    timestamp: datetime
    case_id: str
    constraint_id: str
    triggered: bool  # Did constraint fire?
    actually_failed: bool  # Did failure actually occur?
    result_type: str  # "tp", "fp", "tn", "fn"


class FalsePositiveTracker:
    """Tracks true/false positives and negatives for constraint validation."""
    
    def __init__(self, log_path: Optional[str] = None):
        self.log_path = Path(log_path) if log_path else Path(__file__).parent / "test_registry" / "fp_log.json"
        self.records: List[FPRecord] = []
        self._load()
    
    def _load(self):
        """Load FP log from disk."""
        if self.log_path.exists():
            try:
                with open(self.log_path) as f:
                    data = json.load(f)
                    for record_data in data.get("records", []):
                        record_data["timestamp"] = datetime.fromisoformat(record_data["timestamp"])
                        self.records.append(FPRecord(**record_data))
            except (json.JSONDecodeError, KeyError, ValueError) as e:
                print(f"Warning: Could not load FP log: {e}")
                self.records = []
    
    def _save(self):
        """Save FP log to disk."""
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "records": [
                {
                    "timestamp": r.timestamp.isoformat(),
                    "case_id": r.case_id,
                    "constraint_id": r.constraint_id,
                    "triggered": r.triggered,
                    "actually_failed": r.actually_failed,
                    "result_type": r.result_type
                }
                for r in self.records
            ]
        }
        with open(self.log_path, "w") as f:
            json.dump(data, f, indent=2)
    
    def record_result(
        self,
        case_id: str,
        constraint_id: str,
        triggered: bool,
        actually_failed: bool
    ) -> FPRecord:
        """
        Record a constraint check result.
        
        Args:
            case_id: Case identifier
            constraint_id: Constraint identifier (e.g., "FORMAL_001")
            triggered: Did the constraint fire/violate?
            actually_failed: Did the failure actually occur?
            
        Returns:
            FPRecord with result_type determined
        """
        # Determine result type
        if triggered and actually_failed:
            result_type = "tp"  # True positive
        elif triggered and not actually_failed:
            result_type = "fp"  # False positive
        elif not triggered and not actually_failed:
            result_type = "tn"  # True negative
        else:  # not triggered and actually_failed
            result_type = "fn"  # False negative
        
        record = FPRecord(
            timestamp=datetime.utcnow(),
            case_id=case_id,
            constraint_id=constraint_id,
            triggered=triggered,
            actually_failed=actually_failed,
            result_type=result_type
        )
        
        self.records.append(record)
        self._save()
        return record
    
    def get_rates(self) -> Dict[str, float]:
        """
        Compute precision, recall, and false positive rate.
        
        Returns:
            Dictionary with precision, recall, false_positive_rate
        """
        tp = len([r for r in self.records if r.result_type == "tp"])
        fp = len([r for r in self.records if r.result_type == "fp"])
        tn = len([r for r in self.records if r.result_type == "tn"])
        fn = len([r for r in self.records if r.result_type == "fn"])
        
        # Precision = TP / (TP + FP)
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        
        # Recall = TP / (TP + FN)
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        
        # False positive rate = FP / (FP + TN)
        false_positive_rate = fp / (fp + tn) if (fp + tn) > 0 else 0.0
        
        return {
            "precision": precision,
            "recall": recall,
            "false_positive_rate": false_positive_rate,
            "true_positives": tp,
            "false_positives": fp,
            "true_negatives": tn,
            "false_negatives": fn,
            "total": len(self.records)
        }
    
    def get_stats_by_constraint(self) -> Dict[str, Dict[str, int]]:
        """Get statistics grouped by constraint."""
        stats = {}
        for record in self.records:
            if record.constraint_id not in stats:
                stats[record.constraint_id] = {"tp": 0, "fp": 0, "tn": 0, "fn": 0}
            stats[record.constraint_id][record.result_type] += 1
        return stats


# Convenience functions
_tracker = None

def get_tracker() -> FalsePositiveTracker:
    """Get singleton FP tracker instance."""
    global _tracker
    if _tracker is None:
        _tracker = FalsePositiveTracker()
    return _tracker

def record_result(
    case_id: str,
    constraint_id: str,
    triggered: bool,
    actually_failed: bool
) -> FPRecord:
    """Convenience function to record a result."""
    return get_tracker().record_result(case_id, constraint_id, triggered, actually_failed)

def get_rates() -> Dict[str, float]:
    """Convenience function to get rates."""
    return get_tracker().get_rates()
