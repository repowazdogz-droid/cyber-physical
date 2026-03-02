from .models import ProcedureSpec, VRFCResult
from .presets import load_presets
from .rules import evidence, regulatory, reimbursement, adoption
from .scoring.aggregate import aggregate_results
from .scoring.sensitivity import compute_sensitivity


def compile_spec(spec_dict: dict) -> VRFCResult:
    """Compile a raw procedure spec dict into a VRFCResult."""
    spec = ProcedureSpec.from_dict(spec_dict)
    presets = load_presets()

    dimension_results = {
        "evidence": evidence.evaluate(spec, presets),
        "regulatory": regulatory.evaluate(spec, presets),
        "reimbursement": reimbursement.evaluate(spec, presets),
        "adoption": adoption.evaluate(spec, presets),
    }

    sensitivity = compute_sensitivity(spec, dimension_results, presets)
    result = aggregate_results(spec, dimension_results, sensitivity)
    return result



