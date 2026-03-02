# SR-CS v0 — Soft Robotics Constraint Solver (Deterministic)

A pure Python, standard-library-only constraint evaluation system for soft robotics design concepts. This tool provides deterministic, explainable assessments of soft robotics designs across six key dimensions: materials, actuation, morphology, control latency, environment interface, and integration.

**No LLM calls. No network. No randomness.** Fully reproducible outputs.

## What This Is

SR-CS v0 encodes domain knowledge about soft robotics constraints in deterministic rules. It evaluates design specifications against material properties, actuation characteristics, morphological constraints, control requirements, environmental interfaces, and integration complexity. Each evaluation produces a risk level (GREEN/AMBER/RED), a numerical score (0.0–1.0), concrete issues, and actionable suggestions.

## Inputs

A JSON specification file with the following required fields:

- `case_name`: string — Name of the design case
- `material`: string — Material type (e.g., "silicone", "elastomer_gel", "fabric_composite", "hydrogel")
- `actuator`: string — Actuation type (e.g., "pneumatic", "hydraulic", "tendon", "shape_memory", "EAP")
- `diameter_mm`: float — Diameter in millimeters
- `length_mm`: float — Length in millimeters
- `target_env`: string — Target environment (e.g., "dry_lab", "in_body_endoluminal", "underwater_ocean", "field_env")
- `latency_budget_ms`: int — Maximum acceptable control latency in milliseconds
- `force_requirement`: string — Force requirement level ("low", "medium", "high")
- `sensing`: list[string] — List of sensing modalities (e.g., ["pressure", "position", "force"])
- `control_strategy`: string — Control approach ("open_loop", "closed_loop", "model_based")

## Outputs

Each evaluation produces:

- **Overall Status**: GREEN, AMBER, or RED (worst of all dimension statuses)
- **Overall Score**: 0.0–1.0 (weighted average of dimension scores)
- **Per-Dimension Results**: For each of the six dimensions:
  - Status (GREEN/AMBER/RED)
  - Score (0.0–1.0)
  - Issues (list of concrete problems identified)
  - Suggestions (list of actionable recommendations)
- **Frontier Notes**: Research directions and hybrid approaches relevant to the design combination

## How to Run

### Using Example Cases

```bash
python -m sr_cs.cli --case octopus_gripper
python -m sr_cs.cli --case endoluminal_sleeve
python -m sr_cs.cli --case continuum_manipulator
```

### Using Custom Spec File

```bash
python -m sr_cs.cli --spec examples/case_endoluminal_sleeve.json
```

### Raw JSON Output

```bash
python -m sr_cs.cli --case octopus_gripper --raw
```

## Why It Matters for Soft Robotics

Soft robotics design involves complex trade-offs across materials, actuation, morphology, control, and environment. SR-CS v0:

- **Encodes constraints**: Captures domain knowledge about material × actuation × morphology × environment interactions
- **No hallucinations**: Deterministic rules ensure reproducible, explainable outputs
- **Actionable feedback**: Provides concrete issues and suggestions, not just scores
- **Extensible foundation**: Can be extended into simulation hooks, optimization loops, or design space exploration tools later

## Example Output

```
======================================================================
SR-CS v0 Evaluation: Octopus Gripper
======================================================================

Overall Status: AMBER
Overall Score: 0.72/1.00

----------------------------------------------------------------------
Dimension Results:
----------------------------------------------------------------------

[GREEN] MATERIALS
  Score: 0.90/1.00

[AMBER] ACTUATION
  Score: 0.65/1.00
  Issues:
    - Long pneumatic lines increase latency
  Suggestions:
    + Consider distributed actuation or hybrid approaches

[GREEN] MORPHOLOGY
  Score: 0.90/1.00

[AMBER] CONTROL_LATENCY
  Score: 0.75/1.00
  Issues:
    - Moderate latency margin (15ms)
  Suggestions:
    + Monitor latency in implementation

[AMBER] ENVIRONMENT_INTERFACE
  Score: 0.70/1.00
  Issues:
    - pneumatic actuation requires sealing for underwater_ocean
  Suggestions:
    + Ensure robust sealing design and testing

[GREEN] INTEGRATION
  Score: 0.90/1.00

----------------------------------------------------------------------
Frontier Notes:
----------------------------------------------------------------------
  • Frontier: fluidic logic and microfluidic control for endoluminal pneumatic systems

Generated: 2025-01-XX...
======================================================================
```

## Running Tests

```bash
python -m unittest sr_cs.tests.test_engine
python -m unittest sr_cs.tests.test_cli
```

Or with pytest (if available):

```bash
python -m pytest sr_cs/tests
```

## Architecture

- `models.py`: Core data structures (RiskLevel, DimensionResult, CompileResult)
- `presets.py`: Hard-coded profiles for materials, actuators, environments, and scale classification
- `rules.py`: Deterministic evaluators for each constraint dimension
- `engine.py`: Main compilation logic and aggregation
- `cli.py`: Command-line interface
- `examples/`: Three ready-made example specifications

## License

Part of the Rossiter Demo project.


