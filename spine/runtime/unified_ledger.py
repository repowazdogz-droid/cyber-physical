"""Unified ledger: Spine + Forge decision tracking. Safety-critical; atomic writes, checksums, verification."""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
import json
import hashlib
import os
import sys
import shutil


@dataclass
class SpineRisk:
    mode: str
    severity: str
    confidence: float
    rpn: int


@dataclass
class ForgeHypothesis:
    id: str
    text: str
    confidence: float
    category: str


@dataclass
class ExperimentRecord:
    name: str
    method: str
    prediction: str
    predicted_confidence: float


@dataclass
class OutcomeRecord:
    occurred: bool
    measured_value: Optional[float] = None
    notes: Optional[str] = None


@dataclass
class DecisionRecord:
    case_id: str
    run_id: str
    timestamp: datetime
    spine_risks: List[SpineRisk] = field(default_factory=list)
    forge_hypotheses: List[ForgeHypothesis] = field(default_factory=list)
    experiment: Optional[ExperimentRecord] = None
    outcome: Optional[OutcomeRecord] = None
    calibration_error: Optional[float] = None
    constraints_updated: List[str] = field(default_factory=list)
    experiment_label: Optional[str] = None
    info_gain_score: Optional[int] = None


def _record_from_dict(record_data: dict) -> DecisionRecord:
    return DecisionRecord(
        case_id=record_data["case_id"],
        run_id=record_data["run_id"],
        timestamp=datetime.fromisoformat(record_data["timestamp"]),
        spine_risks=[SpineRisk(**r) for r in record_data.get("spine_risks", [])],
        forge_hypotheses=[ForgeHypothesis(**h) for h in record_data.get("forge_hypotheses", [])],
        experiment=ExperimentRecord(**record_data["experiment"]) if record_data.get("experiment") else None,
        outcome=OutcomeRecord(**record_data["outcome"]) if record_data.get("outcome") else None,
        calibration_error=record_data.get("calibration_error"),
        constraints_updated=record_data.get("constraints_updated", []),
        experiment_label=record_data.get("experiment_label"),
        info_gain_score=record_data.get("info_gain_score"),
    )


class UnifiedLedger:
    """Unified ledger: atomic writes, write verification, MD5 sidecar, backup before write."""

    def __init__(self, ledger_path: str = None):
        self.ledger_path = Path(ledger_path) if ledger_path else Path(__file__).parent / "test_registry" / "unified_ledger.json"
        self.ledger_path.parent.mkdir(parents=True, exist_ok=True)
        self._hash_path = self.ledger_path.with_name(self.ledger_path.stem + ".hash")
        self._backup_path = self.ledger_path.with_name(self.ledger_path.stem + ".backup.json")
        self._temp_path = self.ledger_path.with_suffix(".json.tmp")
        self.records: Dict[str, DecisionRecord] = {}
        self._load()

    def _load(self):
        if not self.ledger_path.exists():
            return
        try:
            with open(self.ledger_path, "rb") as f:
                raw = f.read()
            if self._hash_path.exists():
                stored = self._hash_path.read_text().strip()
                computed = hashlib.md5(raw).hexdigest()
                if stored != computed:
                    raise ValueError(f"Ledger hash mismatch: corruption detected (stored={stored[:8]}..., computed={computed[:8]}...)")
            data = json.loads(raw.decode("utf-8"))
            for rid, rdata in data.get("records", {}).items():
                self.records[rid] = _record_from_dict(rdata)
        except Exception as e:
            sys.stderr.write(f"ERROR: unified_ledger load failed: {e}\n")
            raise

    def _save(self):
        expected = len(self.records)
        data = {"records": {}, "metadata": {"version": "1.0", "last_updated": datetime.now().isoformat()}}
        for rid, rec in self.records.items():
            d = asdict(rec)
            d["timestamp"] = rec.timestamp.isoformat()
            data["records"][rid] = d
        if self.ledger_path.exists():
            try:
                shutil.copy2(self.ledger_path, self._backup_path)
            except Exception as e:
                sys.stderr.write(f"ERROR: unified_ledger backup failed: {e}\n")
                raise
        try:
            with open(self._temp_path, "w") as f:
                json.dump(data, f, indent=2)
                f.flush()
                os.fsync(f.fileno())
            os.rename(self._temp_path, self.ledger_path)
        except Exception as e:
            if self._temp_path.exists():
                self._temp_path.unlink(missing_ok=True)
            sys.stderr.write(f"ERROR: unified_ledger write failed: {e}\n")
            raise
        with open(self.ledger_path) as f:
            verify_data = json.load(f)
        actual = len(verify_data.get("records", {}))
        if actual != expected:
            raise RuntimeError(f"Ledger write verification failed: expected {expected} records, got {actual}")
        raw = self.ledger_path.read_bytes()
        self._hash_path.write_text(hashlib.md5(raw).hexdigest())

    def verify_integrity(self) -> Dict[str, Any]:
        """Return record_count, hash_valid, last_write_timestamp. Call after batch operations."""
        out = {"record_count": 0, "hash_valid": False, "last_write_timestamp": None}
        if not self.ledger_path.exists():
            return out
        raw = self.ledger_path.read_bytes()
        data = json.loads(raw.decode("utf-8"))
        out["record_count"] = len(data.get("records", {}))
        out["last_write_timestamp"] = data.get("metadata", {}).get("last_updated")
        if self._hash_path.exists():
            out["hash_valid"] = hashlib.md5(raw).hexdigest() == self._hash_path.read_text().strip()
        else:
            out["hash_valid"] = True
        return out

    def log_decision(self, case_id: str, spine_output, forge_output, experiment: Dict[str, Any], prediction: Dict[str, Any], experiment_label: Optional[str] = None, info_gain_score: Optional[int] = None) -> str:
        run_id = hashlib.md5(f"{case_id}{datetime.now().isoformat()}".encode()).hexdigest()[:8]
        spine_risks = [SpineRisk(mode=fm.mode, severity=fm.severity,
            confidence=fm.epistemic.confidence if fm.epistemic else 0.5, rpn=fm.risk_priority_number)
            for fm in spine_output.failure_modes]
        forge_hypotheses = [ForgeHypothesis(id=h["id"], text=h["hypothesis_text"], confidence=h["confidence"], category=h["category"]) for h in forge_output.get("hypotheses", [])]
        exp_record = ExperimentRecord(name=experiment.get("name", "unknown"), method=experiment.get("method", "unknown"), prediction=experiment.get("prediction", ""), predicted_confidence=prediction.get("predicted_confidence", 0.5))
        record = DecisionRecord(case_id=case_id, run_id=run_id, timestamp=datetime.now(), spine_risks=spine_risks,
            forge_hypotheses=forge_hypotheses, experiment=exp_record, experiment_label=experiment_label, info_gain_score=info_gain_score if info_gain_score is not None else 0)
        record_id = f"{case_id}_{run_id}"
        self.records[record_id] = record
        self._save()
        return record_id

    def record_outcome(self, record_id: str, occurred: bool, measured_value: Optional[float] = None, notes: Optional[str] = None):
        if record_id not in self.records:
            raise ValueError(f"Record {record_id} not found")
        r = self.records[record_id]
        r.outcome = OutcomeRecord(occurred=occurred, measured_value=measured_value, notes=notes)
        if r.experiment:
            r.calibration_error = abs(r.experiment.predicted_confidence - (1.0 if occurred else 0.0))
        self._save()

    def set_info_gain(self, record_id: str, score: int):
        if record_id not in self.records:
            raise ValueError(f"Record {record_id} not found")
        self.records[record_id].info_gain_score = max(0, min(3, score))
        self._save()

    def get_calibration_stats(self) -> Dict[str, Any]:
        with_outcomes = [r for r in self.records.values() if r.outcome is not None and r.calibration_error is not None]
        if not with_outcomes:
            return {"mean_error": 0.0, "by_category": {}, "by_confidence_band": {}, "total_records": 0}
        mean_error = sum(r.calibration_error for r in with_outcomes) / len(with_outcomes)
        by_cat = {}
        for r in with_outcomes:
            if r.forge_hypotheses:
                c = r.forge_hypotheses[0].category
                by_cat.setdefault(c, []).append(r.calibration_error)
        by_cat = {c: sum(v) / len(v) for c, v in by_cat.items()}
        bands = {"low": [], "medium": [], "high": []}
        for r in with_outcomes:
            if r.experiment:
                conf = r.experiment.predicted_confidence
                (bands["low"] if conf < 0.5 else bands["medium"] if conf < 0.8 else bands["high"]).append(r.calibration_error)
        by_band = {b: sum(v) / len(v) if v else 0.0 for b, v in bands.items()}
        return {"mean_error": mean_error, "by_category": by_cat, "by_confidence_band": by_band, "total_records": len(with_outcomes)}

    def get_confidence_calibration(self) -> List[Dict[str, Any]]:
        bands = [(0.0, 0.4), (0.4, 0.6), (0.6, 0.8), (0.8, 1.0)]
        out = []
        with_outcomes = [r for r in self.records.values() if r.outcome is not None and r.experiment]
        for lo, hi in bands:
            subset = [r for r in with_outcomes if lo <= r.experiment.predicted_confidence < hi]
            n = len(subset)
            n_correct = sum(1 for r in subset if (r.outcome.occurred and r.experiment.predicted_confidence >= 0.5) or (not r.outcome.occurred and r.experiment.predicted_confidence < 0.5))
            expected = (lo + hi) / 2
            actual = n_correct / n if n else 0.0
            out.append({"band": f"{lo}-{hi}", "n_predictions": n, "n_correct": n_correct, "expected_accuracy": expected, "actual_accuracy": actual, "gap": actual - expected})
        return out

    def get_learning_efficiency(self) -> Dict[str, Any]:
        with_outcomes = [r for r in self.records.values() if r.outcome is not None]
        scores = [r.info_gain_score if r.info_gain_score is not None else 0 for r in with_outcomes]
        total = sum(scores)
        by_cat = {}
        for r in with_outcomes:
            c = r.forge_hypotheses[0].category if r.forge_hypotheses else "unknown"
            by_cat.setdefault(c, []).append(r.info_gain_score if r.info_gain_score is not None else 0)
        by_cat = {c: sum(v) / len(v) for c, v in by_cat.items()}
        return {"total_info_gain": total, "avg_per_experiment": total / len(with_outcomes) if with_outcomes else 0.0, "by_category": by_cat}

    def get_experiment_lineage(self) -> List[Dict[str, Any]]:
        ordered = sorted(self.records.values(), key=lambda r: r.timestamp)
        return [{"label": r.experiment_label or r.case_id, "timestamp": r.timestamp.isoformat(), "outcome": r.outcome.occurred if r.outcome else None} for r in ordered]

    def get_calibration_slope(self, window: int = 10) -> Dict[str, Any]:
        ordered = sorted([r for r in self.records.values() if r.calibration_error is not None], key=lambda r: r.timestamp)
        errors = [r.calibration_error for r in ordered]
        trend = []
        for i in range(len(errors)):
            start = max(0, i - window + 1)
            trend.append(sum(errors[start:i + 1]) / (i - start + 1))
        slope = (trend[-1] - trend[0]) / len(trend) if len(trend) > 1 else 0.0
        return {"slope": slope, "improving": slope < 0, "error_trend": trend}

    def export_corpus(self, filepath: str):
        data = {"records": {}, "metadata": {"version": "1.0", "export_timestamp": datetime.now().isoformat(), "total_records": len(self.records)}}
        for rid, rec in self.records.items():
            d = asdict(rec)
            d["timestamp"] = rec.timestamp.isoformat()
            data["records"][rid] = d
        with open(filepath, "w") as f:
            json.dump(data, f, indent=2)
