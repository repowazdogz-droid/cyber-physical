from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from . import compile_spec
from .reporters import failure_modes, pathway, summary


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="vrfc",
        description="VRFC — Value & Regulation Feasibility Compiler",
    )
    parser.add_argument(
        "spec_path",
        type=str,
        help="Path to a JSON file containing a procedure/device specification.",
    )
    parser.add_argument(
        "--view",
        choices=["summary", "failure", "pathway", "all"],
        default="summary",
        help="Which view to print.",
    )

    args = parser.parse_args(argv)

    spec_path = Path(args.spec_path)
    if not spec_path.is_file():
        print(f"Error: spec file not found: {spec_path}", file=sys.stderr)
        return 1

    with spec_path.open("r", encoding="utf-8") as f:
        spec_dict = json.load(f)

    result = compile_spec(spec_dict)

    if args.view in ("summary", "all"):
        print(summary.render_summary(result))
        if args.view == "all":
            print("\n" + "=" * 80 + "\n")

    if args.view in ("failure", "all"):
        print(failure_modes.render_failure_modes(result))
        if args.view == "all":
            print("\n" + "=" * 80 + "\n")

    if args.view in ("pathway", "all"):
        print(pathway.render_pathway(result))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())



