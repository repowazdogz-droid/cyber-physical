# Forge v1 - Generative Intelligence for Surgical Robotics

Forge generates testable invention hypotheses from Spine's defensive analysis outputs. Where Spine asks "how could this fail?", Forge asks "what should exist that doesn't yet?"

**Defensive + Generative = Complete Loop:** Spine identifies failure modes and constraint boundaries. Forge generates hypotheses for relaxing constraints, eliminating failures, resolving contradictions, and collapsing uncertainties. Together they form a complete pre-decision intelligence system.

## How to Run

```bash
python3 forge_runner.py <spine_case.yaml>
```

Forge runs Spine analysis on the case, then generates hypotheses, maps adjacencies from related fields, and builds experiment cards.

## What It Outputs

- **Hypotheses:** Constraint relaxation, failure elimination, contradiction resolution, uncertainty collapse
- **Adjacencies:** Technique transfers from soft robotics, origami engineering, gecko adhesion, etc.
- **Experiment Cards:** Structured experiments with objectives, methods, measurements, success/falsification criteria
- **JSON Output:** Saved to `forge/outputs/<case_name>_forge.json`

## Example

```bash
python3 forge_runner.py cases/soft_gripper.yaml
```

Generates hypotheses like "What if mass limit could be relaxed by using CFRP?" or "What mechanism would eliminate slip failures entirely?"
