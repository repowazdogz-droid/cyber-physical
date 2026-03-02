"""
Crosswalk from technical issues to regulatory/economic implications.

Deterministic rule-based mapping.
"""

from typing import Dict, List
from .models import CompileResult, DimensionResult


def derive_translation_implications(result: CompileResult) -> Dict[str, List[str]]:
    """
    Map technical issues to likely regulatory/economic implications.
    Purely deterministic, rule-based mapping.

    Returns a dict with keys like "regulatory" and "economic".
    """
    regulatory: List[str] = []
    economic: List[str] = []

    for dim in result.dimensions.values():
        for issue in dim.issues:
            text = issue.lower()
            # Very simple pattern matching for now
            if "pressure" in text or "contact" in text:
                regulatory.append(
                    "Elevated contact pressures may require additional safety/biocompatibility studies."
                )
            if "buckling" in text or "buckling risk" in text:
                regulatory.append(
                    "High buckling risk may trigger additional mechanical robustness testing."
                )
            if "specialised tooling" in text or "specialized tooling" in text:
                economic.append(
                    "Specialised tooling requirement increases capex and may slow scale-up."
                )
            if "unit cost" in text:
                economic.append(
                    "High unit cost may require stronger health economic justification."
                )
            if "sterilisation" in text or "sterilization" in text:
                regulatory.append(
                    "Sterilisation method compatibility may require validation studies."
                )
            if "tolerance" in text and "tight" in text:
                economic.append(
                    "Very tight tolerances increase manufacturing complexity and cost."
                )

    # Deduplicate
    regulatory = sorted(set(regulatory))
    economic = sorted(set(economic))

    return {
        "regulatory": regulatory,
        "economic": economic,
    }



