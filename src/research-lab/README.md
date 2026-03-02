# OMEGA Research Lab Runtime v0.1

A self-modifying autonomous research governance runtime built on Clearpath (CAP-1.0).

## What this proves

Three primitives — **governance**, **reasoning**, **traceability** — are independently necessary for governing autonomous systems. Removing any one produces a specific, observable failure:

| Primitive removed | Failure mode |
|-------------------|--------------|
| Governance        | Bad proposals execute unchecked |
| Reasoning         | Decisions are opaque and uninspectable |
| Traceability      | History can be tampered with undetectably |

## Run tests

```bash
npm test -- --testPathPattern=research-lab
```

Or from repo root with Vitest:

```bash
npx vitest run src/research-lab
```

## Architecture

- **Governance engine**: Policy-based constraint evaluation (scaling, baseline, determinism)
- **Reasoning graph**: Clearpath trace (OBSERVE → DERIVE → ASSUME → DECIDE → ACT)
- **JSONL registry**: Append-only, hash-chained record store
- **Irreducibility toggles**: Runtime config to disable any primitive

## Built on Clearpath

All hashing, canonical encoding, trace building, and verification reuse Clearpath (CAP-1.0). Zero new cryptographic implementations.
