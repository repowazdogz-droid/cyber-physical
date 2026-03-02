"""Outcome ledger for tracking predictions and calibration."""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
import json
import hashlib


@dataclass
class Prediction:
    """A prediction recorded in the ledger."""
    id: str
    run_id: str
    timestamp: datetime
    prediction_type: str  # "failure_mode", "experiment_outcome", "constraint_violation"
    content: Dict[str, Any]
    confidence: float
    outcome: Optional[Dict[str, Any]] = None  # Filled when outcome known
    outcome_timestamp: Optional[datetime] = None
    calibration_error: Optional[float] = None  # Computed when outcome recorded


class OutcomeLedger:
    """Ledger for tracking predictions and their outcomes for calibration."""
    
    def __init__(self, ledger_path: str = None):
        """
        Initialize outcome ledger.
        
        Args:
            ledger_path: Optional path to ledger JSON file. Defaults to ~/.spine/outcome_ledger.json
        """
        self.ledger_path = Path(ledger_path) if ledger_path else Path.home() / ".spine" / "outcome_ledger.json"
        self.predictions: Dict[str, Prediction] = {}
        self._load()
    
    def _load(self):
        """Load predictions from ledger file."""
        if self.ledger_path.exists():
            try:
                with open(self.ledger_path) as f:
                    data = json.load(f)
                    for pred_id, pred_data in data.get("predictions", {}).items():
                        self.predictions[pred_id] = Prediction(
                            id=pred_data["id"],
                            run_id=pred_data["run_id"],
                            timestamp=datetime.fromisoformat(pred_data["timestamp"]),
                            prediction_type=pred_data["prediction_type"],
                            content=pred_data["content"],
                            confidence=pred_data["confidence"],
                            outcome=pred_data.get("outcome"),
                            outcome_timestamp=datetime.fromisoformat(pred_data["outcome_timestamp"]) if pred_data.get("outcome_timestamp") else None,
                            calibration_error=pred_data.get("calibration_error")
                        )
            except (json.JSONDecodeError, KeyError, ValueError) as e:
                # If file is corrupted, start fresh
                self.predictions = {}
    
    def _save(self):
        """Save predictions to ledger file."""
        self.ledger_path.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "predictions": {
                pred_id: {
                    "id": pred.id,
                    "run_id": pred.run_id,
                    "timestamp": pred.timestamp.isoformat(),
                    "prediction_type": pred.prediction_type,
                    "content": pred.content,
                    "confidence": pred.confidence,
                    "outcome": pred.outcome,
                    "outcome_timestamp": pred.outcome_timestamp.isoformat() if pred.outcome_timestamp else None,
                    "calibration_error": pred.calibration_error
                }
                for pred_id, pred in self.predictions.items()
            }
        }
        with open(self.ledger_path, "w") as f:
            json.dump(data, f, indent=2)
    
    def record_prediction(self, run_id: str, prediction_type: str, content: Dict, confidence: float) -> str:
        """
        Record a new prediction.
        
        Args:
            run_id: ID of the analysis run
            prediction_type: Type of prediction ("failure_mode", "experiment_outcome", etc.)
            content: Dictionary containing prediction details
            confidence: Confidence level (0.0-1.0)
            
        Returns:
            Prediction ID
        """
        pred_id = hashlib.sha256(
            f"{run_id}_{prediction_type}_{json.dumps(content, sort_keys=True)}".encode()
        ).hexdigest()[:12]
        
        self.predictions[pred_id] = Prediction(
            id=pred_id,
            run_id=run_id,
            timestamp=datetime.utcnow(),
            prediction_type=prediction_type,
            content=content,
            confidence=confidence
        )
        self._save()
        return pred_id
    
    def record_outcome(self, pred_id: str, outcome: Dict, actual_occurred: bool) -> float:
        """
        Record outcome and compute calibration error.
        
        Args:
            pred_id: Prediction ID
            outcome: Dictionary containing outcome details
            actual_occurred: Whether the predicted event actually occurred
            
        Returns:
            Calibration error (absolute difference between confidence and actual outcome)
        """
        if pred_id not in self.predictions:
            raise ValueError(f"Prediction {pred_id} not found")
        
        pred = self.predictions[pred_id]
        pred.outcome = outcome
        pred.outcome_timestamp = datetime.utcnow()
        
        # Calibration: |predicted_confidence - actual_outcome|
        # actual_outcome = 1.0 if occurred, 0.0 if not
        pred.calibration_error = abs(pred.confidence - (1.0 if actual_occurred else 0.0))
        self._save()
        return pred.calibration_error
    
    def get_calibration_stats(self) -> Dict:
        """
        Compute calibration statistics.
        
        Returns:
            Dictionary with calibration statistics
        """
        completed = [p for p in self.predictions.values() if p.calibration_error is not None]
        if not completed:
            return {
                "total_predictions": len(self.predictions),
                "completed": 0,
                "calibration": None
            }
        
        errors = [p.calibration_error for p in completed]
        return {
            "total_predictions": len(self.predictions),
            "completed": len(completed),
            "mean_calibration_error": sum(errors) / len(errors),
            "by_type": self._calibration_by_type(completed)
        }
    
    def _calibration_by_type(self, completed: List[Prediction]) -> Dict:
        """Compute mean calibration error by prediction type."""
        by_type = {}
        for pred in completed:
            if pred.prediction_type not in by_type:
                by_type[pred.prediction_type] = []
            by_type[pred.prediction_type].append(pred.calibration_error)
        return {k: sum(v) / len(v) for k, v in by_type.items()}
    
    def list_pending(self) -> List[Prediction]:
        """
        List predictions awaiting outcome.
        
        Returns:
            List of predictions without outcomes
        """
        return [p for p in self.predictions.values() if p.outcome is None]
    
    def get_prediction(self, pred_id: str) -> Optional[Prediction]:
        """
        Get a prediction by ID.
        
        Args:
            pred_id: Prediction ID
            
        Returns:
            Prediction object or None if not found
        """
        return self.predictions.get(pred_id)
