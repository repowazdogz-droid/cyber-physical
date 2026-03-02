"""Canonical JSON serialisation and SHA-256 hashing."""

import hashlib
import json
from datetime import datetime

from pydantic import BaseModel

from omega_research.models import (
    EnforcementResult,
    ExperimentProposal,
    ExperimentResult,
)


def canonical_json(obj: BaseModel) -> str:
    """
    Produce deterministic JSON from a Pydantic model.
    Sort keys, no whitespace, consistent datetime/float handling.
    """
    data = obj.model_dump(mode="json")
    return json.dumps(data, sort_keys=True, separators=(",", ":"), default=str)


def compute_hash(canonical: str) -> str:
    """SHA-256 of canonical JSON string."""
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def hash_experiment_config(proposal: ExperimentProposal) -> str:
    """Hash the experiment configuration (excluding timestamps and IDs)."""
    config_data = {
        "hypothesis_id": proposal.hypothesis_id,
        "baseline_id": proposal.baseline.baseline_experiment_id,
        "changed_variables": sorted(proposal.baseline.changed_variables),
        "controlled_variables": sorted(proposal.baseline.controlled_variables),
        "compute_budget": proposal.compute_budget.model_dump(mode="json"),
        "determinism": {
            "random_seed": proposal.determinism.random_seed,
            "dataset_version": proposal.determinism.dataset_version,
            "model_version": proposal.determinism.model_version,
        },
    }
    canonical = json.dumps(config_data, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def compute_record_hash(record_dict: dict) -> str:
    """Compute hash of a record dict excluding record_hash (for chain integrity)."""
    d = {k: v for k, v in record_dict.items() if k != "record_hash"}
    canonical = json.dumps(d, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


class ExperimentRecord(BaseModel):
    """Immutable, tamper-evident record of a complete experiment."""

    proposal_hash: str
    result_hash: str
    enforcement_hash: str
    record_hash: str
    proposal: ExperimentProposal
    result: ExperimentResult
    enforcement: EnforcementResult
    created_at: datetime


def create_experiment_record(
    proposal: ExperimentProposal,
    result: ExperimentResult,
    enforcement: EnforcementResult,
) -> ExperimentRecord:
    """Create a complete, hash-chained experiment record."""
    proposal_hash = compute_hash(canonical_json(proposal))
    result_hash = compute_hash(canonical_json(result))
    enforcement_hash = compute_hash(canonical_json(enforcement))
    combined = proposal_hash + result_hash + enforcement_hash
    record_hash = compute_hash(combined)
    return ExperimentRecord(
        proposal_hash=proposal_hash,
        result_hash=result_hash,
        enforcement_hash=enforcement_hash,
        record_hash=record_hash,
        proposal=proposal,
        result=result,
        enforcement=enforcement,
        created_at=datetime.now(),
    )
