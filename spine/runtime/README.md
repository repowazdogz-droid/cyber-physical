# Spine Decision Runtime

Week 1 core architecture for Spine Decision Runtime CLI.

## Setup

Install dependencies:

```bash
pip install -r ../requirements.txt
```

## Usage

Analyze a case file:

```bash
python -m runtime.cli analyze case.yaml
```

Or from the spine directory:

```bash
python -m runtime.cli analyze runtime/case.yaml
```

## Example

See `case.yaml` for an example case file format.

## Architecture

- `schemas.py`: Pydantic models for input/output validation
- `parser.py`: YAML case file parser
- `contracts.py`: Contract loader and query interface
- `analyzer.py`: Core decision analysis logic
- `output.py`: YAML output formatter
- `cli.py`: Click-based CLI entry point
