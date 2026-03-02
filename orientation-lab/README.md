# Orientation Lab

Orientation Lab is a non-authoritative thinking tool for navigating uncertainty,
disagreement, and complex situations.

It does not model the world.
It does not predict outcomes.
It does not tell you what to do.

Instead, it helps you see:
- where different models disagree
- which assumptions drive divergence
- what remains unknown
- what kind of judgment is actually required

## Enhanced Features

### Explicit Assumption Tracking
- **Assumption extraction** from model descriptions
- **Confidence levels** (high, medium, low, speculation)
- **Assumption types** (observable fact, inference, prediction, value judgment, etc.)
- **Dependency mapping** between assumptions
- **Uncertainty boundaries** (what we know vs. don't know)

### Anti-Optimization Safeguards
- **Authority detection** - flags language that claims authority
- **Optimization prevention** - prevents drift toward "AI recommends"
- **Conversation flow guard** - ensures orientation principles are followed
- **Reframing suggestions** - helps maintain non-authoritative language

### OPLAS Integration
- **Artifact export** - export assumption models as OPLAS artifacts
- **Canonical graph** representation of models and assumptions
- **DSL program generation** for assumption analysis
- **Uncertainty boundary packaging**

## Usage

```python
from core.types import OrientationSession, Model
from assumptions.extractor import AssumptionExtractor
from core.safeguards import AntiOptimizationGuard
from export.oplas_exporter import OrientationLabExporter

# Extract assumptions from model descriptions
extractor = AssumptionExtractor()
assumptions = extractor.extract_assumptions(
    "The market will grow because demand is increasing",
    owner="Participant A"
)

# Create model with assumptions
model = Model(
    name="Growth Model",
    assumptions=assumptions,
    explains=["Market growth"],
    doesnt_explain=["Supply constraints"]
)

# Check for optimization/authority violations
guard = AntiOptimizationGuard()
violations = guard.check_for_violations("You should choose option A")
# Returns: ["AUTHORITY_CLAIM: 'you should' found in text"]

# Export to OPLAS
exporter = OrientationLabExporter()
artifact = exporter.export_to_oplas(session)
```

## Core Philosophy (Preserved)

- **Non-authoritative:** Does NOT tell people what to do
- **For thinking, not deciding:** Helps understand disagreement, not resolve it
- **Human sovereignty:** All conclusions drawn by humans, not the tool
- **Room dynamics:** Designed for live facilitated discussions

## Assumption Types

- **Observable Fact** - Can be verified
- **Inference** - Logical deduction
- **Prediction** - Future-oriented claim
- **Value Judgment** - Normative statement
- **Constraint** - Boundary condition
- **Causal Claim** - X causes Y
- **Definitional** - What we mean by terms

## Confidence Levels

- **High** - Very confident
- **Medium** - Moderately confident
- **Low** - Low confidence
- **Speculation** - Pure speculation

## Testing

```bash
# Run all tests
python -m pytest tests/ -v

# Test anti-optimization safeguards
python tests/test_anti_optimization.py

# Test assumption extraction
python tests/test_assumption_extraction.py

# Run example
python example_orientation.py
```

## Success Criteria

1. ✅ **Explicit Uncertainty Boundaries**: All assumptions tagged with confidence/scope
2. ✅ **Anti-Optimization**: Zero authority claims or optimization language  
3. ✅ **Assumption Tracking**: Complete dependency mapping between assumptions
4. ✅ **OPLAS Integration**: Export assumption models as canonical graphs
5. ⏳ **Facilitation Support**: Tools that enhance but don't direct conversation (in progress)

## Integration Points

- **OPLAS**: Import assumption models as testable hypotheses
- **Constraint Universe**: Convert assumptions to formal constraints
- **OMEGA-F**: Use for governance assumption analysis
- **Spine**: Integrate via non-authoritative contracts

## Architecture

```
orientation-lab/
├── core/              # Types, config, safeguards
├── assumptions/       # Assumption extraction and tracking
├── models/            # Model building and comparison
├── disagreement/     # Disagreement mapping tools
├── facilitation/      # Facilitation support (in progress)
├── export/           # OPLAS and artifact export
└── ui/                # Visualization (in progress)
```

If you are looking for answers, optimisation, or forecasts,
this is not the right tool.
