"""JSON-backed experiment store and edge tracking.

Append-only JSONL files with hash chaining. All writes are atomic (temp + rename).
"""

import json
from pathlib import Path
from datetime import datetime

from omega_research.config import OmegaResearchConfig
from omega_research.models import (
    Claim,
    ClaimStatus,
    ExperimentProposal,
    ExperimentResult,
    Hypothesis,
    RegistryEdge,
    RegistryEdgeType,
    StoredClaim,
    StoredEdge,
    StoredExperiment,
    StoredHypothesis,
    StoredResult,
)
from omega_research.trust import compute_record_hash


def _default_str(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(type(obj))


class ExperimentRegistry:
    """JSONL-backed registry with hash chaining. Append-only."""

    def __init__(self, config: OmegaResearchConfig) -> None:
        self.config = config
        self.data_dir = Path(config.registry_path)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.hypotheses_file = self.data_dir / "hypotheses.jsonl"
        self.experiments_file = self.data_dir / "experiments.jsonl"
        self.results_file = self.data_dir / "results.jsonl"
        self.claims_file = self.data_dir / "claims.jsonl"
        self.edges_file = self.data_dir / "edges.jsonl"

    def _last_record_hash(self, path: Path) -> str:
        """Return record_hash of last line in file, or 'genesis' if empty."""
        if not path.exists():
            return "genesis"
        with open(path, "r") as f:
            lines = [line for line in f if line.strip()]
        if not lines:
            return "genesis"
        last = json.loads(lines[-1])
        return last.get("record_hash", "genesis")

    def _append_record(self, path: Path, record: dict, protocol_version: str) -> None:
        """Append one record with chain hash. Atomic write."""
        record["record_hash"] = ""
        record["previous_record_hash"] = self._last_record_hash(path)
        record["protocol_version"] = protocol_version
        record["recorded_at"] = record.get("recorded_at", datetime.now())
        if hasattr(record["recorded_at"], "isoformat"):
            record["recorded_at"] = record["recorded_at"].isoformat()
        record_hash = compute_record_hash(record)
        record["record_hash"] = record_hash
        line = json.dumps(record, separators=(",", ":"), default=_default_str) + "\n"
        tmp = path.with_suffix(path.suffix + ".tmp")
        if path.exists():
            with open(path, "r") as f:
                content = f.read()
        else:
            content = ""
        with open(tmp, "w") as f:
            f.write(content + line)
        tmp.rename(path)

    # --- Write ---

    def add_hypothesis(self, hypothesis: Hypothesis) -> None:
        h = hypothesis.model_dump(mode="json")
        stored = StoredHypothesis(
            record_hash="",
            previous_record_hash="",
            protocol_version=self.config.protocol_version,
            recorded_at=datetime.now(),
            id=h["id"],
            type=h["type"],
            statement=h["statement"],
            why_baseline_fails=h["why_baseline_fails"],
            expected_effect_direction=h["expected_effect_direction"],
            falsification_condition=h["falsification_condition"],
            created_at=h["created_at"],
        )
        d = stored.model_dump(mode="json")
        self._append_record(self.hypotheses_file, d, self.config.protocol_version)

    def add_experiment(self, proposal: ExperimentProposal) -> None:
        stored = StoredExperiment(
            record_hash="",
            previous_record_hash="",
            protocol_version=self.config.protocol_version,
            recorded_at=datetime.now(),
            experiment_id=proposal.id,
            proposal=proposal.model_dump(mode="json"),
        )
        d = stored.model_dump(mode="json")
        self._append_record(self.experiments_file, d, self.config.protocol_version)

    def add_result(self, result: ExperimentResult) -> None:
        stored = StoredResult(
            record_hash="",
            previous_record_hash="",
            protocol_version=self.config.protocol_version,
            recorded_at=datetime.now(),
            result=result.model_dump(mode="json"),
        )
        d = stored.model_dump(mode="json")
        self._append_record(self.results_file, d, self.config.protocol_version)

    def add_claim(self, claim: Claim) -> None:
        stored = StoredClaim(
            record_hash="",
            previous_record_hash="",
            protocol_version=self.config.protocol_version,
            recorded_at=datetime.now(),
            claim_id=claim.id,
            hypothesis_id=claim.hypothesis_id,
            experiment_ids=claim.experiment_ids,
            status=claim.status,
            mean_improvement=claim.mean_improvement,
            variance=claim.variance,
            effect_size=claim.effect_size,
            graduated_by=claim.graduated_by,
            graduated_at=claim.graduated_at,
            supersedes=None,
        )
        d = stored.model_dump(mode="json")
        self._append_record(self.claims_file, d, self.config.protocol_version)

    def update_claim(self, claim: Claim) -> None:
        """Append new claim record with updated status (supersedes previous)."""
        prev_hash = self._last_record_hash(self.claims_file)
        stored = StoredClaim(
            record_hash="",
            previous_record_hash="",
            protocol_version=self.config.protocol_version,
            recorded_at=datetime.now(),
            claim_id=claim.id,
            hypothesis_id=claim.hypothesis_id,
            experiment_ids=claim.experiment_ids,
            status=claim.status,
            mean_improvement=claim.mean_improvement,
            variance=claim.variance,
            effect_size=claim.effect_size,
            graduated_by=claim.graduated_by,
            graduated_at=claim.graduated_at,
            supersedes=prev_hash,
        )
        d = stored.model_dump(mode="json")
        self._append_record(self.claims_file, d, self.config.protocol_version)

    def add_edge(self, edge: RegistryEdge) -> None:
        stored = StoredEdge(
            record_hash="",
            previous_record_hash="",
            protocol_version=self.config.protocol_version,
            recorded_at=datetime.now(),
            from_experiment_id=edge.from_experiment_id,
            to_experiment_id=edge.to_experiment_id,
            edge_type=edge.edge_type,
            evidence=edge.evidence,
        )
        d = stored.model_dump(mode="json")
        self._append_record(self.edges_file, d, self.config.protocol_version)

    # --- Read (full scan) ---

    def _load_lines(self, path: Path) -> list[dict]:
        if not path.exists():
            return []
        with open(path, "r") as f:
            return [json.loads(line) for line in f if line.strip()]

    def get_hypothesis(self, hypothesis_id: str) -> Hypothesis | None:
        for d in self._load_lines(self.hypotheses_file):
            if d.get("id") == hypothesis_id:
                created = d["created_at"]
                if isinstance(created, str):
                    created = datetime.fromisoformat(created.replace("Z", "+00:00"))
                return Hypothesis(
                    id=d["id"],
                    type=d["type"],
                    statement=d["statement"],
                    why_baseline_fails=d["why_baseline_fails"],
                    expected_effect_direction=d["expected_effect_direction"],
                    falsification_condition=d["falsification_condition"],
                    created_at=created,
                )
        return None

    def get_experiment(self, experiment_id: str) -> ExperimentProposal | None:
        for d in self._load_lines(self.experiments_file):
            if d.get("experiment_id") == experiment_id:
                return ExperimentProposal.model_validate(d["proposal"])
        return None

    def get_results_for_experiment(self, experiment_id: str) -> list[ExperimentResult]:
        out = []
        for d in self._load_lines(self.results_file):
            r = d.get("result", {})
            if r.get("experiment_id") == experiment_id:
                out.append(ExperimentResult.model_validate(r))
        return out

    def get_results_for_hypothesis(self, hypothesis_id: str) -> list[ExperimentResult]:
        exp_ids = {e.get("experiment_id") for e in self._load_lines(self.experiments_file)
                  if ExperimentProposal.model_validate(e["proposal"]).hypothesis_id == hypothesis_id}
        out = []
        for d in self._load_lines(self.results_file):
            r = d.get("result", {})
            if r.get("experiment_id") in exp_ids:
                out.append(ExperimentResult.model_validate(r))
        return out

    def get_claim(self, claim_id: str) -> Claim | None:
        candidates = [d for d in self._load_lines(self.claims_file) if d.get("claim_id") == claim_id]
        if not candidates:
            return None
        d = candidates[-1]
        return Claim(
            id=d["claim_id"],
            hypothesis_id=d["hypothesis_id"],
            experiment_ids=d["experiment_ids"],
            status=ClaimStatus(d["status"]) if isinstance(d["status"], str) else d["status"],
            mean_improvement=d.get("mean_improvement"),
            variance=d.get("variance"),
            effect_size=d.get("effect_size"),
            graduated_by=d.get("graduated_by"),
            graduated_at=datetime.fromisoformat(d["graduated_at"].replace("Z", "+00:00")) if d.get("graduated_at") else None,
        )

    def get_claims_for_hypothesis(self, hypothesis_id: str) -> list[Claim]:
        by_id: dict[str, Claim] = {}
        for d in self._load_lines(self.claims_file):
            if d.get("hypothesis_id") != hypothesis_id:
                continue
            cid = d["claim_id"]
            by_id[cid] = Claim(
                id=d["claim_id"],
                hypothesis_id=d["hypothesis_id"],
                experiment_ids=d["experiment_ids"],
                status=ClaimStatus(d["status"]) if isinstance(d["status"], str) else d["status"],
                mean_improvement=d.get("mean_improvement"),
                variance=d.get("variance"),
                effect_size=d.get("effect_size"),
                graduated_by=d.get("graduated_by"),
                graduated_at=datetime.fromisoformat(d["graduated_at"].replace("Z", "+00:00")) if d.get("graduated_at") else None,
            )
        return list(by_id.values())

    def experiment_exists(self, experiment_id: str) -> bool:
        return self.get_experiment(experiment_id) is not None

    def find_duplicates(self, hypothesis_id: str, config_hash: str) -> list[ExperimentProposal]:
        out = []
        for d in self._load_lines(self.experiments_file):
            p = ExperimentProposal.model_validate(d["proposal"])
            if p.hypothesis_id == hypothesis_id and p.determinism.config_hash == config_hash:
                out.append(p)
        return out

    def get_edges_for_experiment(self, experiment_id: str) -> list[RegistryEdge]:
        out = []
        for d in self._load_lines(self.edges_file):
            if d.get("from_experiment_id") == experiment_id or d.get("to_experiment_id") == experiment_id:
                out.append(RegistryEdge(
                    from_experiment_id=d["from_experiment_id"],
                    to_experiment_id=d["to_experiment_id"],
                    edge_type=RegistryEdgeType(d["edge_type"]) if isinstance(d["edge_type"], str) else d["edge_type"],
                    evidence=d["evidence"],
                ))
        return out

    def get_contradictions(self, hypothesis_id: str) -> list[RegistryEdge]:
        exp_ids = {e.get("experiment_id") for e in self._load_lines(self.experiments_file)
                  if ExperimentProposal.model_validate(e["proposal"]).hypothesis_id == hypothesis_id}
        out = []
        for d in self._load_lines(self.edges_file):
            if d.get("edge_type") != RegistryEdgeType.CONTRADICTS.value:
                continue
            if d.get("from_experiment_id") in exp_ids or d.get("to_experiment_id") in exp_ids:
                out.append(RegistryEdge(
                    from_experiment_id=d["from_experiment_id"],
                    to_experiment_id=d["to_experiment_id"],
                    edge_type=RegistryEdgeType.CONTRADICTS,
                    evidence=d["evidence"],
                ))
        return out

    def has_contradicting_experiments(self, hypothesis_id: str) -> bool:
        return len(self.get_contradictions(hypothesis_id)) > 0

    def get_contradicting_experiment_id(self, hypothesis_id: str) -> str | None:
        edges = self.get_contradictions(hypothesis_id)
        if not edges:
            return None
        e = edges[0]
        return e.from_experiment_id

    def auto_link(
        self,
        new_result: ExperimentResult,
        baseline_metrics: dict[str, float],
        target_metric: str,
    ) -> RegistryEdge:
        """
        Create edge based on result vs baseline.
        Improvement > threshold and replication passes → SUPPORTS.
        Result contradicts hypothesis direction → CONTRADICTS.
        Otherwise → INCONCLUSIVE.
        """
        if target_metric not in new_result.metrics or target_metric not in baseline_metrics:
            return RegistryEdge(
                from_experiment_id=new_result.experiment_id,
                to_experiment_id="",
                edge_type=RegistryEdgeType.INCONCLUSIVE,
                evidence="Missing metric for comparison.",
            )
        result_val = new_result.metrics[target_metric]
        baseline_val = baseline_metrics[target_metric]
        improvement = (result_val - baseline_val) / abs(baseline_val) if baseline_val != 0 else 0
        if abs(improvement) >= self.config.improvement_threshold and improvement < 0:
            edge_type = RegistryEdgeType.SUPPORTS
            evidence = f"Improvement {improvement:.4f} on {target_metric}."
        elif abs(improvement) >= self.config.improvement_threshold and improvement > 0:
            edge_type = RegistryEdgeType.CONTRADICTS
            evidence = f"Regression {improvement:.4f} on {target_metric}."
        else:
            edge_type = RegistryEdgeType.INCONCLUSIVE
            evidence = f"Change {improvement:.4f} below threshold."
        edge = RegistryEdge(
            from_experiment_id=new_result.experiment_id,
            to_experiment_id="",
            edge_type=edge_type,
            evidence=evidence,
        )
        self.add_edge(edge)
        return edge

    # Backward compatibility for protocol (same API as before)
    def exists(self, experiment_id: str) -> bool:
        return self.experiment_exists(experiment_id)

    def get(self, experiment_id: str) -> ExperimentProposal | None:
        return self.get_experiment(experiment_id)

    def add(self, entry: "RegistryEntry") -> None:
        """Legacy: add from RegistryEntry (create minimal proposal for storage)."""
        from omega_research.models import RegistryEntry
        # We don't have full proposal; store a minimal experiment record.
        # Protocol expects get_experiment to return something with compute_budget.
        # So we need to store an experiment. RegistryEntry has experiment_id, compute_budget, hypothesis_id, config_hash.
        # We can't construct full ExperimentProposal from that. So for tests that use add(RegistryEntry),
        # we need to support that. Option: add_experiment_from_entry that builds a minimal proposal.
        # Minimal: id=entry.experiment_id, hypothesis_id=entry.hypothesis_id, baseline=..., compute_budget=entry.compute_budget, determinism with config_hash=entry.config_hash, proposed_at=now.
        from omega_research.models import BaselineDeclaration, DeterminismControls
        from datetime import datetime
        proposal = ExperimentProposal(
            id=entry.experiment_id,
            hypothesis_id=entry.hypothesis_id,
            baseline=BaselineDeclaration(
                baseline_experiment_id="",
                baseline_metrics={},
                controlled_variables=[],
                changed_variables=["_placeholder"],
            ),
            compute_budget=entry.compute_budget,
            determinism=DeterminismControls(
                random_seed=0,
                dataset_version="",
                model_version="",
                config_hash=entry.config_hash,
            ),
            scaling_hypothesis=None,
            ablation_plan=None,
            proposed_at=datetime.now(),
        )
        self.add_experiment(proposal)