# Fault Episode Contract (v0)

A fault episode produces a deterministic simulation bundle at:

```
artifacts/fault-episodes/<episodeId>/
  sim.json
  sim.sha256
  report.md (deterministic markdown derived from sim.json)
  report.json (machine-readable summary)
```

## Requirements
- sim.json must include:
  - meta: { episodeId, scenario, seed, dt, steps, createdAtIso }
  - arrays t[], truth[], sensors[], estimator[], controller[]
  - events[] including FAULT_INJECTED and ENVELOPE_BREACH
  - breachIndex

## Determinism
- sim.sha256 must equal sha256(sim.json)
- replay must verify hash exactly
- report.md and report.json are deterministic functions of sim.json

