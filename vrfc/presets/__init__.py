from __future__ import annotations

import json
from dataclasses import dataclass
from importlib import resources
from typing import Any, Dict


@dataclass
class Presets:
    anatomies: Dict[str, Any]
    regulatory: Dict[str, Any]
    reimbursement: Dict[str, Any]


def _load_json_like(name: str) -> Dict[str, Any]:
    """Load JSON-from-file; files are named .yaml but contain JSON (valid YAML subset)."""
    with resources.files(__package__).joinpath(name).open("r", encoding="utf-8") as f:
        return json.load(f)


def load_presets() -> Presets:
    anatomies = _load_json_like("anatomies.yaml")
    regulatory = _load_json_like("regulatory.yaml")
    reimbursement = _load_json_like("reimbursement.yaml")
    return Presets(
        anatomies=anatomies,
        regulatory=regulatory,
        reimbursement=reimbursement,
    )



