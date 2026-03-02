# Python Environment Contract (Mac)

## Purpose

Define a single, controlled Python environment for all spine-related work.

## Version

- Python 3.11.x only

## Environment Rules

- Use `venv` (no conda, no pyenv)
- Environment lives at: `omega/.venv`
- One environment per repository
- No global Python packages

## Dependency Rules

- All dependencies must be explicitly declared
- No transitive installs without review
- No auto-upgrade of dependencies

## Execution Rules

- Spine logic must run locally
- No dependency on remote execution
- Deterministic behavior required

## Failure Handling

- If environment breaks, delete and recreate
- No patching broken environments

## Authority

- This contract overrides convenience
- Speed never justifies drift

## Status

- Active
- Changes require explicit revision

Reproducibility > Convenience

