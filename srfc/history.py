"""
History logging for SRFC compilation results.

Appends compact JSON lines for regulatory/audit purposes.
"""

import json
from pathlib import Path
from typing import Any
from .models import CompileResult


def append_history(result: CompileResult, out_dir: str = ".srfc_history") -> None:
    """
    Append a compact JSON line for this result to a history file.
    Creates directory if needed. Standard library only.
    """
    try:
        base = Path(out_dir)
        base.mkdir(parents=True, exist_ok=True)
        path = base / "history.jsonl"

        record: dict[str, Any] = {
            "timestamp": result.timestamp,
            "version": result.version,
            "procedure_id": result.procedure.procedure_id,
            "domain": result.procedure.domain,
            "anatomy": result.procedure.anatomy,
            "overall_status": result.overall_status.value,
            "overall_score": result.overall_score,
        }

        with path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")
    except Exception:
        # Silently ignore failures
        pass



