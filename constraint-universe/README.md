# Constraint Universe (MVU) — Formal Verification Engine

A rigorous formal verification engine where **you only change constraints** and the universe reconfigures itself, with mathematical proofs.

## Core idea
- A **world** is any subset of states.
- **Constraints** restrict which worlds are allowed.
- Each state is classified as:
  - **POSSIBLE**: appears in at least one allowed world (with formal proof)
  - **IMPOSSIBLE**: appears in no allowed worlds (with counterexample)
  - **INEVITABLE**: appears in every allowed world (with uniqueness proof)

## Features

### Formal Verification
- **Z3 theorem prover backend** for mathematical rigor
- **Formal proofs** for all classifications
- **Counterexample generation** for impossible states
- **Witness generation** for possible states

### Governance Assessment
- **Governance constraint library** for system viability
- **Policy modeling** tools
- **Boundary exploration** for governance limits
- **Viability assessment** with formal verification

### OPLAS Integration
- **Artifact export** to OPLAS format
- **Canonical graph** representation
- **DSL program generation** for constraint checking
- **Verification data packaging**

## Run

```bash
cd constraint-universe
npm install  # For UI components
pip install z3-solver pytest  # For Python backend
npm run dev  # Start UI
```

## Python Backend

```python
from core.types import ConstraintUniverse, Variable, State
from constraints.governance import create_governance_constraint_set
from solver.z3_backend import Z3ConstraintSolver

# Create universe
variables = [Variable("autonomous_agent", "boolean", "boolean")]
constraints = create_governance_constraint_set()
universe = ConstraintUniverse("test", variables, constraints)

# Classify state
solver = Z3ConstraintSolver()
state = State({"autonomous_agent": True, "real_time_halt": False})
result = solver.classify_state(universe, state)

print(f"Classification: {result.classification.value}")
print(f"Proof: {result.proof.to_human_readable()}")
```

## Constraint types

### Basic Constraints
- **NOT_TOGETHER(A,B)** — A and B cannot both exist
- **REQUIRES(A,B)** — if A exists, B must exist
- **AT_MOST_K_OF_SET({S}, k)** — at most k members of set S may exist
- **EXACTLY_K_OF_SET({S}, k)** — exactly k members of set S must exist

### Governance Constraints
- **InformationAsymmetry** — Cannot have both information asymmetry and downstream autonomy
- **PowerConsequenceMismatch** — Real-world impact requires halt authority
- **RollbackFiction** — Irreversible actions cannot rely solely on post-hoc mitigation
- **DelegatedAgency** — Autonomous agents require real-time halt capability

## Formal Verification

All classifications are backed by Z3 proofs:

```python
result = solver.classify_state(universe, state)
proof = result.proof

# Human-readable proof
print(proof.to_human_readable())

# Access proof components
for step in proof.reasoning_steps:
    print(f"{step.rule}: {step.justification}")
```

## OPLAS Export

Export constraint models as OPLAS artifacts:

```python
from export.oplas_exporter import ConstraintUniverseExporter

exporter = ConstraintUniverseExporter()
artifact = exporter.export_to_oplas(universe, classification_results)

# Artifact includes:
# - Canonical graph representation
# - Executable DSL program
# - Formal verification proofs
# - Metadata
```

## Governance Assessment

Assess system governability:

```python
from governance.viability_assessor import assess_governance

assessment = assess_governance(universe, system_state)
print(f"Governable: {assessment.governable}")
print(f"Violations: {assessment.violations}")
print(f"Recommendation: {assessment.recommendation}")
```

## Sharing

### Share URL (hash)
The URL hash encodes the full "world" state (A/B, frames, time indices, scale, solver, view flags).
- Copy the URL and open elsewhere to reproduce exactly.
- Now includes formal proofs in hash

### Export
- **Export PNG** downloads a screenshot of the current view.
- **Export OPLAS** exports as OPLAS artifact with proofs
- **Print / Save** uses the browser print dialog (save as PDF).

## Architecture

```
constraint-universe/
├── core/              # Type definitions, config, registry
├── solver/            # Z3 backend, constraint encoding
├── constraints/       # Constraint type library
├── governance/        # Governance assessment tools
├── verification/      # Proof system, verifier
├── export/            # OPLAS export, artifact builder
└── ui/                # Interactive visualization
```

## Success Criteria

1. ✅ **Formal Verification**: All classifications backed by Z3 proofs
2. ✅ **Governance Modeling**: Policy constraints expressible and verifiable  
3. ✅ **OPLAS Integration**: Seamless export to OPLAS artifact format
4. ⏳ **Performance**: Sub-second classification for <100 constraints (requires Z3)
5. ✅ **Proof Quality**: Human-readable logical explanations

## Installation

```bash
# Install Python dependencies
pip install z3-solver pytest

# Install UI dependencies (if using web interface)
npm install

# Run tests
python -m pytest tests/ -v

# Run example
python example_governance.py
```

## Notes
- Z3 solver required for formal verification (falls back to basic checking if unavailable)
- Performance metrics and tension ranking help reveal "what's shaping the space"
- All proofs are deterministic and replayable
- Integration with OPLAS enables artifact-based intelligence compounding
