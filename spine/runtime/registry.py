"""Case registry - persistent storage for decision corpus."""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from datetime import datetime
from pathlib import Path
import json
import hashlib
import shutil


@dataclass
class CaseRecord:
    """A registered case."""
    case_id: str
    name: str
    domain: str
    created_at: datetime
    case_yaml: Dict[str, Any]
    design_data: Optional[Dict[str, Any]] = None
    tags: List[str] = field(default_factory=list)
    notes: str = ""


@dataclass
class RunRecord:
    """A single analysis run."""
    run_id: str
    case_id: str
    timestamp: datetime
    output: Dict[str, Any]
    trace: Optional[Dict[str, Any]] = None
    predictions: List[str] = field(default_factory=list)  # Prediction IDs
    reviewer: Optional[str] = None
    review_notes: str = ""


class CaseRegistry:
    """Persistent registry for cases and runs."""
    
    def __init__(self, registry_path: str = None):
        """
        Initialize case registry.
        
        Args:
            registry_path: Optional path to registry directory. Defaults to ~/.spine/registry
        """
        self.registry_path = Path(registry_path) if registry_path else Path.home() / ".spine" / "registry"
        self.registry_path.mkdir(parents=True, exist_ok=True)
        
        # Directory structure:
        # ~/.spine/registry/
        #   cases/
        #     <case_id>/
        #       case.json
        #       design.json (optional)
        #   runs/
        #     <run_id>/
        #       output.json
        #       trace.json
        #       run.json
        #   index.json
        
        self.cases_dir = self.registry_path / "cases"
        self.runs_dir = self.registry_path / "runs"
        self.cases_dir.mkdir(exist_ok=True)
        self.runs_dir.mkdir(exist_ok=True)
        
        self.index_path = self.registry_path / "index.json"
        self._load_index()
    
    def _load_index(self):
        """Load registry index."""
        if self.index_path.exists():
            try:
                with open(self.index_path) as f:
                    self.index = json.load(f)
            except (json.JSONDecodeError, KeyError):
                self.index = {"cases": {}, "runs": {}}
        else:
            self.index = {"cases": {}, "runs": {}}
    
    def _save_index(self):
        """Save registry index."""
        with open(self.index_path, "w") as f:
            json.dump(self.index, f, indent=2, default=str)
    
    def register_case(
        self,
        name: str,
        domain: str,
        case_yaml: Dict[str, Any],
        design_data: Optional[Dict[str, Any]] = None,
        tags: List[str] = None,
        notes: str = ""
    ) -> str:
        """
        Register a new case.
        
        Args:
            name: Case name
            domain: Case domain
            case_yaml: Case YAML data as dictionary
            design_data: Optional design data dictionary
            tags: Optional list of tags
            notes: Optional notes
            
        Returns:
            Case ID
        """
        case_id = hashlib.sha256(
            f"{name}_{domain}_{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:12]
        
        case_dir = self.cases_dir / case_id
        case_dir.mkdir(exist_ok=True)
        
        record = CaseRecord(
            case_id=case_id,
            name=name,
            domain=domain,
            created_at=datetime.utcnow(),
            case_yaml=case_yaml,
            design_data=design_data,
            tags=tags or [],
            notes=notes
        )
        
        # Save case.json
        with open(case_dir / "case.json", "w") as f:
            json.dump(asdict(record), f, indent=2, default=str)
        
        # Save design.json if provided
        if design_data:
            with open(case_dir / "design.json", "w") as f:
                json.dump(design_data, f, indent=2)
        
        # Update index
        self.index["cases"][case_id] = {
            "name": name,
            "domain": domain,
            "created_at": datetime.utcnow().isoformat(),
            "tags": tags or [],
            "run_count": 0
        }
        self._save_index()
        
        return case_id
    
    def record_run(
        self,
        case_id: str,
        output: Dict[str, Any],
        trace: Optional[Dict[str, Any]] = None,
        predictions: List[str] = None,
        reviewer: Optional[str] = None,
        review_notes: str = ""
    ) -> str:
        """
        Record an analysis run.
        
        Args:
            case_id: Case ID
            output: Analysis output dictionary
            trace: Optional trace graph dictionary
            predictions: Optional list of prediction IDs
            reviewer: Optional reviewer name
            review_notes: Optional review notes
            
        Returns:
            Run ID
        """
        if case_id not in self.index["cases"]:
            raise ValueError(f"Case {case_id} not found")
        
        run_id = hashlib.sha256(
            f"{case_id}_{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:12]
        
        run_dir = self.runs_dir / run_id
        run_dir.mkdir(exist_ok=True)
        
        record = RunRecord(
            run_id=run_id,
            case_id=case_id,
            timestamp=datetime.utcnow(),
            output=output,
            trace=trace,
            predictions=predictions or [],
            reviewer=reviewer,
            review_notes=review_notes
        )
        
        # Save output.json
        with open(run_dir / "output.json", "w") as f:
            json.dump(output, f, indent=2, default=str)
        
        # Save trace.json if provided
        if trace:
            with open(run_dir / "trace.json", "w") as f:
                json.dump(trace, f, indent=2, default=str)
        
        # Save run record
        with open(run_dir / "run.json", "w") as f:
            json.dump(asdict(record), f, indent=2, default=str)
        
        # Update index
        self.index["runs"][run_id] = {
            "case_id": case_id,
            "timestamp": datetime.utcnow().isoformat(),
            "reviewer": reviewer,
            "outcome_status": "pending"
        }
        self.index["cases"][case_id]["run_count"] += 1
        self._save_index()
        
        return run_id
    
    def get_case(self, case_id: str) -> Optional[CaseRecord]:
        """
        Retrieve a case by ID.
        
        Args:
            case_id: Case ID
            
        Returns:
            CaseRecord or None if not found
        """
        case_dir = self.cases_dir / case_id
        case_file = case_dir / "case.json"
        if not case_file.exists():
            return None
        
        with open(case_file) as f:
            data = json.load(f)
        
        data["created_at"] = datetime.fromisoformat(data["created_at"])
        return CaseRecord(**data)
    
    def get_run(self, run_id: str) -> Optional[RunRecord]:
        """
        Retrieve a run by ID.
        
        Args:
            run_id: Run ID
            
        Returns:
            RunRecord or None if not found
        """
        run_dir = self.runs_dir / run_id
        run_file = run_dir / "run.json"
        if not run_file.exists():
            return None
        
        with open(run_file) as f:
            data = json.load(f)
        
        data["timestamp"] = datetime.fromisoformat(data["timestamp"])
        return RunRecord(**data)
    
    def list_cases(self, domain: Optional[str] = None, tag: Optional[str] = None) -> List[Dict]:
        """
        List all cases, optionally filtered.
        
        Args:
            domain: Optional domain filter
            tag: Optional tag filter
            
        Returns:
            List of case dictionaries
        """
        cases = []
        for case_id, info in self.index["cases"].items():
            if domain and info["domain"] != domain:
                continue
            if tag and tag not in info.get("tags", []):
                continue
            cases.append({"case_id": case_id, **info})
        return cases
    
    def list_runs(self, case_id: Optional[str] = None) -> List[Dict]:
        """
        List all runs, optionally filtered by case.
        
        Args:
            case_id: Optional case ID filter
            
        Returns:
            List of run dictionaries
        """
        runs = []
        for run_id, info in self.index["runs"].items():
            if case_id and info["case_id"] != case_id:
                continue
            runs.append({"run_id": run_id, **info})
        return runs
    
    def update_outcome_status(self, run_id: str, status: str):
        """
        Update the outcome status of a run.
        
        Args:
            run_id: Run ID
            status: New status
        """
        if run_id not in self.index["runs"]:
            raise ValueError(f"Run {run_id} not found")
        self.index["runs"][run_id]["outcome_status"] = status
        self._save_index()
    
    def get_stats(self) -> Dict:
        """
        Get registry statistics.
        
        Returns:
            Dictionary with statistics
        """
        return {
            "total_cases": len(self.index["cases"]),
            "total_runs": len(self.index["runs"]),
            "by_domain": self._count_by_field("cases", "domain"),
            "by_outcome_status": self._count_by_field("runs", "outcome_status")
        }
    
    def _count_by_field(self, collection: str, field: str) -> Dict[str, int]:
        """Count items by field value."""
        counts = {}
        for item in self.index[collection].values():
            value = item.get(field, "unknown")
            counts[value] = counts.get(value, 0) + 1
        return counts
    
    def export_corpus(self, output_path: str):
        """
        Export entire corpus as a single JSON file.
        
        Args:
            output_path: Path to output JSON file
        """
        corpus = {
            "exported_at": datetime.utcnow().isoformat(),
            "cases": {},
            "runs": {}
        }
        
        for case_id in self.index["cases"]:
            case = self.get_case(case_id)
            if case:
                corpus["cases"][case_id] = asdict(case)
        
        for run_id in self.index["runs"]:
            run = self.get_run(run_id)
            if run:
                corpus["runs"][run_id] = asdict(run)
        
        with open(output_path, "w") as f:
            json.dump(corpus, f, indent=2, default=str)
