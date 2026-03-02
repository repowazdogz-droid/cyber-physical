# Mac Environment Setup Contract

## Purpose

Define the minimal, stable Mac setup required to author, inspect, and evolve the Omega spine.

## Hardware Assumption

- macOS (Apple Silicon)
- No GPU dependency
- Reliability > performance

## System Requirements

- macOS up to date
- Xcode Command Line Tools installed
- No system-wide Python modifications

## Python Policy

- Use Homebrew Python only
- No system Python usage
- Virtual environments required for any execution

## Required Tools

- Cursor (primary editor)
- Git (via Xcode CLT)
- Homebrew
- Python 3.x
- ripgrep
- fd

## Explicitly Not Required

- Docker
- Kubernetes
- CUDA
- Heavy IDEs
- Cloud credentials

## Execution Principle

- Mac is for authoring, review, reasoning
- Not for bulk generation
- Not for long-running compute

## Failure Rule

If a tool adds friction, remove it.

## Status

- Active
- Minimal by design

Authoring clarity beats compute power.

