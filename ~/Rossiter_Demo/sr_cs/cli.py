"""
CLI interface for SR-CS v0.
"""

import argparse
import json
import sys
from pathlib import Path

from .engine import compile_from_dict
from .models import CompileResult


def load_spec_from_file(filepath: Path) -> dict:
    """Load spec from JSON file."""
    try:
        with open(filepath, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: File not found: {filepath}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {filepath}: {e}", file=sys.stderr)
        sys.exit(1)


def get_example_path(case_name: str) -> Path:
    """Get path to example case file."""
    # Get the directory containing this module
    module_dir = Path(__file__).parent
    examples_dir = module_dir / "examples"
    case_file = examples_dir / f"case_{case_name}.json"
    return case_file


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="SR-CS v0: Soft Robotics Constraint Solver (Deterministic)"
    )
    parser.add_argument(
        "--spec",
        type=Path,
        help="Path to JSON specification file",
    )
    parser.add_argument(
        "--case",
        type=str,
        choices=["octopus_gripper", "endoluminal_sleeve", "continuum_manipulator"],
        help="Load one of the example cases",
    )
    parser.add_argument(
        "--raw",
        action="store_true",
        help="Output raw JSON instead of pretty-printed text",
    )

    args = parser.parse_args()

    # Determine which spec to load
    if args.case:
        spec_path = get_example_path(args.case)
        if not spec_path.exists():
            print(f"Error: Example case '{args.case}' not found at {spec_path}", file=sys.stderr)
            sys.exit(1)
        spec = load_spec_from_file(spec_path)
    elif args.spec:
        spec = load_spec_from_file(args.spec)
    else:
        parser.print_help()
        sys.exit(1)

    # Compile
    try:
        result = compile_from_dict(spec)
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)

    # Output
    if args.raw:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print(result.pretty_print())


if __name__ == "__main__":
    main()


