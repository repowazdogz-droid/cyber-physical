# Local Tooling Baseline (Mac)

## Purpose

Define the minimal, stable tooling required to work on the Omega spine without drift.

## Requirements

- macOS (Apple Silicon)
- Cursor (latest)
- Git
- Python 3.11+
- No global state dependence

## Rules

- All execution must be reproducible locally.
- No cloud-only dependencies for spine logic.
- No auto-updating tools without explicit intent.
- Tooling exists to serve the spine, not evolve it.

## Python

- Use `venv` only
- One environment per repo
- No implicit installs

## Git

- Spine contracts are authoritative
- History must be preserved
- No force-push to main

## Status

- Tooling is stable unless this file is revised.

If tooling conflicts with spine constraints, tooling yields.

