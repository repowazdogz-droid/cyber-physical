# Git Hygiene Contract (Mac)

## Purpose

Ensure the spine remains auditable, stable, and free from accidental noise.

## Branch Rules

- `main` is protected
- All changes go through explicit commits
- No force pushes
- No rebasing public history

## Commit Rules

- One logical change per commit
- No mixed concerns
- Commit message format:
  <area>: <intent>
  Example: spine: add research ingestion contract

## Ignored Files

- .venv/
- __pycache__/
- *.pyc
- .DS_Store
- .env

## Tracking Rules

- Spine contracts are immutable once locked
- Revisions require new numbered contracts
- No silent edits to existing contracts

## Recovery Rules

- Git history is the source of truth
- Never "fix forward" without traceability

## Authority

- Git discipline overrides speed
- Clean history > fast progress

## Status

- Active
- Non-negotiable

Auditability is a feature

