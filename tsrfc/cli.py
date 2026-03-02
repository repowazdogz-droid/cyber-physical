import argparse
import json
from pathlib import Path
from typing import Any, Dict

from .version import __version__
from .engine import compile_from_dict
from .presets import PROCEDURE_PRESETS


def _load_json(path: str) -> Dict[str, Any]:
    p = Path(path)
    if not p.exists():
        raise SystemExit(f"Spec file not found: {path}")
    try:
        return json.loads(p.read_text())
    except json.JSONDecodeError as e:
        raise SystemExit(f"Failed to parse JSON from {path}: {e}") from e


def _cmd_demo() -> None:
    print("TSRFC – Translational SRFC")
    print("--------------------------")
    print("Deterministic tools for:")
    print("  - Unit Operation Mapping")
    print("  - Failure Surface Exploration")
    print("  - Evidence vs Adoption Simulation (v0 implemented)")
    print()
    print("Domain presets v0: spine + ENT + endoscopy.")
    print("Use `tsrfc list-domains` and `tsrfc list-procedures` to explore.")


def _cmd_check(spec_path: str) -> None:
    data = _load_json(spec_path)
    result = compile_from_dict(data)

    proc = result.procedure
    concept = result.concept

    print("TSRFC – Unit Ops + Failure Surfaces + Evidence/Adoption (v0)")
    print("============================================================")
    print(f"Procedure: {proc.procedure_id} [{proc.domain.value}]")
    if proc.notes:
        print(f"  Notes: {proc.notes}")
    print()
    print(f"Concept:  {concept.name}")
    print(f"  Role:   {concept.role.value}")
    print(f"  Type:   {concept.type}")
    print(f"  Capital cost band:     {concept.capital_cost_band.value}")
    print(f"  Disposables cost band: {concept.disposables_cost_band.value}")
    if concept.learning_curve_cases is not None:
        print(f"  Learning curve (cases): {concept.learning_curve_cases}")
    print()

    # Unit ops
    ops = result.unit_operations
    print(f"Unit operations mapped: {len(ops)}")
    print("------------------------------")
    for op in ops:
        print(f"- [{op.op_id}] {op.name}")
        print(f"    Goal: {op.primary_goal}")
        if op.typical_issues:
            print(f"    Typical issues: {', '.join(op.typical_issues)}")
        if op.innovation_hooks:
            print(f"    Innovation hooks: {', '.join(op.innovation_hooks)}")
        print()

    # Failure surfaces
    failures = result.failure_surfaces
    print("Failure surfaces (heuristic v0):")
    print("--------------------------------")
    if not failures:
        print("  (none identified)")
    else:
        for fs in failures:
            ops_str = ", ".join(fs.affected_ops) if fs.affected_ops else "-"
            print(f"- [{fs.category}/{fs.risk.value}] {fs.code}")
            print(f"    {fs.description}")
            print(f"    Affected ops: {ops_str}")
            if fs.notes:
                print(f"    Notes: {fs.notes}")
            print()

    # Evidence profile
    ev = result.evidence_profile
    print("Evidence profile:")
    print("-----------------")
    print(f"  Current level: {ev.current_level.value}")
    print(f"  Target level:  {ev.target_level.value}")
    if ev.key_endpoints:
        print(f"  Key endpoints: {', '.join(ev.key_endpoints)}")
    if ev.estimated_sample_size is not None:
        print(f"  Estimated sample size: {ev.estimated_sample_size}")
    if ev.estimated_centres is not None:
        print(f"  Estimated centres:     {ev.estimated_centres}")
    if ev.time_horizon_years is not None:
        print(f"  Time horizon (years):  {ev.time_horizon_years:.1f}")
    if ev.comments:
        print(f"  Comments: {ev.comments}")
    print()

    # Adoption profile
    ad = result.adoption_profile
    print("Adoption profile:")
    print("-----------------")
    print(f"  Trajectory: {ad.trajectory.value}")
    if ad.primary_barriers:
        print(f"  Primary barriers: {', '.join(ad.primary_barriers)}")
    if ad.leverage_points:
        print(f"  Leverage points: {', '.join(ad.leverage_points)}")
    if ad.kill_criteria:
        print(f"  Kill criteria:   {', '.join(ad.kill_criteria)}")
    if ad.notes:
        print(f"  Notes: {ad.notes}")
    print()

    print("Scores:")
    for k, v in sorted(result.scores.items()):
        print(f"  {k}: {v:.1f}")


def _cmd_compare(spec_a: str, spec_b: str) -> None:
    data_a = _load_json(spec_a)
    data_b = _load_json(spec_b)

    res_a = compile_from_dict(data_a)
    res_b = compile_from_dict(data_b)

    proc_a = res_a.procedure
    proc_b = res_b.procedure
    concept_a = res_a.concept
    concept_b = res_b.concept

    same_proc = proc_a.procedure_id == proc_b.procedure_id

    print("TSRFC – Comparison (A vs B)")
    print("===========================")
    print(f"A: {concept_a.name}  [{proc_a.procedure_id}/{proc_a.domain.value}]")
    print(f"B: {concept_b.name}  [{proc_b.procedure_id}/{proc_b.domain.value}]")
    if same_proc:
        print("Note: Same procedural context; differences are concept-driven.")
    print()

    def s(scores: Dict[str, float], key: str) -> float:
        return float(scores.get(key, 0.0))

    print("Core metrics:")
    print("-------------")
    print(f"  coverage_unit_ops   A: {s(res_a.scores, 'coverage_unit_ops'):4.1f}   B: {s(res_b.scores, 'coverage_unit_ops'):4.1f}")
    print(f"  risk_technical      A: {s(res_a.scores, 'risk_technical'):4.1f}   B: {s(res_b.scores, 'risk_technical'):4.1f}")
    print(f"  risk_workflow       A: {s(res_a.scores, 'risk_workflow'):4.1f}   B: {s(res_b.scores, 'risk_workflow'):4.1f}")
    print(f"  risk_economic       A: {s(res_a.scores, 'risk_economic'):4.1f}   B: {s(res_b.scores, 'risk_economic'):4.1f}")
    print(f"  evidence_strength   A: {s(res_a.scores, 'evidence_strength'):4.1f}   B: {s(res_b.scores, 'evidence_strength'):4.1f}")
    print(f"  adoption_risk_load  A: {s(res_a.scores, 'adoption_risk_load'):4.1f}   B: {s(res_b.scores, 'adoption_risk_load'):4.1f}")
    print()

    ad_a = res_a.adoption_profile
    ad_b = res_b.adoption_profile

    print("Adoption details:")
    print("-----------------")
    print(f"  Trajectory A: {ad_a.trajectory.value}")
    print(f"  Trajectory B: {ad_b.trajectory.value}")
    print(f"  Barriers A:   {', '.join(ad_a.primary_barriers) if ad_a.primary_barriers else '-'}")
    print(f"  Barriers B:   {', '.join(ad_b.primary_barriers) if ad_b.primary_barriers else '-'}")
    print(f"  Leverage A:   {', '.join(ad_a.leverage_points) if ad_a.leverage_points else '-'}")
    print(f"  Leverage B:   {', '.join(ad_b.leverage_points) if ad_b.leverage_points else '-'}")
    print()
    print("Interpretation hint:")
    print("  - Higher evidence_strength is better.")
    print("  - Higher risk_* and adoption_risk_load indicate more failure/adoption load.")
    print("  - Barriers/Leverage lists show where to intervene.")


def _cmd_list_domains() -> None:
    domains = sorted({meta["domain"] for meta in PROCEDURE_PRESETS.values()})
    print("Known domains:")
    print("--------------")
    for d in domains:
        print(f"- {d}")


def _cmd_list_procedures(domain: str | None) -> None:
    print("Known procedures:")
    print("-----------------")
    for pid, meta in PROCEDURE_PRESETS.items():
        d = meta.get("domain", "unknown")
        if domain and d != domain:
            continue
        label = meta.get("label", pid)
        indication_examples = meta.get("indication_examples") or []
        indication = indication_examples[0] if indication_examples else ""
        print(f"- {pid} [{d}]")
        print(f"    Label:      {label}")
        if indication:
            print(f"    Indication: {indication}")
        approach_examples = meta.get("approach_examples") or []
        if approach_examples:
            print(f"    Approaches: {', '.join(approach_examples)}")
        print()


def main(argv=None) -> None:
    parser = argparse.ArgumentParser(
        prog="tsrfc",
        description="TSRFC – Translational SRFC (procedures, failure surfaces, evidence vs adoption).",
    )
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")

    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("demo", help="Print a short description of TSRFC.")

    check_p = subparsers.add_parser(
        "check",
        help="Compile a JSON spec and show unit operations, failure surfaces, and evidence/adoption profiles (v0).",
    )
    check_p.add_argument("spec_path", type=str, help="Path to a JSON spec file.")

    compare_p = subparsers.add_parser(
        "compare",
        help="Compare two specs head-to-head on risk, evidence, and adoption.",
    )
    compare_p.add_argument("spec_a", type=str, help="Path to first JSON spec file.")
    compare_p.add_argument("spec_b", type=str, help="Path to second JSON spec file.")

    list_domains_p = subparsers.add_parser(
        "list-domains",
        help="List known procedural domains from presets.",
    )

    list_procs_p = subparsers.add_parser(
        "list-procedures",
        help="List known procedures (optionally filtered by domain).",
    )
    list_procs_p.add_argument(
        "--domain",
        type=str,
        help="Filter procedures by domain (e.g. 'spine', 'ent', 'endoscopy').",
    )

    args = parser.parse_args(argv)

    if args.command == "demo":
        _cmd_demo()
        return

    if args.command == "check":
        _cmd_check(args.spec_path)
        return

    if args.command == "compare":
        _cmd_compare(args.spec_a, args.spec_b)
        return

    if args.command == "list-domains":
        _cmd_list_domains()
        return

    if args.command == "list-procedures":
        _cmd_list_procedures(args.domain)
        return


if __name__ == "__main__":
    main()






