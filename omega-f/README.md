# OMEGA-F: Governance Determination Infrastructure

**OMEGA-F** provides formal governance determination capabilities for the Omega ecosystem. It assesses whether systems are structurally governable based on constitutional governance principles.

## Core Philosophy

- **Constitutional Governance:** Structural determinations, not policy recommendations
- **Non-Authoritative:** Determines governability, not what should be governed
- **Evidence-Based:** All determinations backed by formal analysis
- **Infrastructure Role:** Serves other Omega projects' governance needs

## Architecture

```
omega-f/
├── core/              # Core types and configuration
├── assessment/        # Assessment protocol implementation
├── determination/     # Determination generation and validation
├── integration/       # Integration with other Omega projects
├── evidence/          # Evidence collection and analysis
├── output/            # Public interfaces (API, web)
└── tests/             # Test suite
```

## Quick Start

### Installation

```bash
pip install -e .
```

### Basic Usage

```python
from core.types import SystemSpecification, SystemType
from assessment.protocol import AssessmentProtocol

# Create system specification
system_spec = SystemSpecification(
    name="My System",
    description="System to assess",
    system_type=SystemType.AI_SYSTEM,
    autonomous_components=[],
    human_oversight_points=["approval_gate"],
    deployment_scope="bounded_tasks",
    control_mechanisms=["human_approval", "audit_trail"]
)

# Run assessment
protocol = AssessmentProtocol()
determination = protocol.assess_system_governance(system_spec)

print(f"Status: {determination.status.value}")
print(f"Summary: {determination.summary}")
```

### Integration with OPLAS

```python
from integration.oplas_assessor import OPLASGovernanceAssessor

assessor = OPLASGovernanceAssessor()
result = assessor.assess_oplas_system({
    "system_name": "My OPLAS System",
    "deployment_scope": "bounded_tasks",
    "learned_models_in_parse_path": False
})

print(f"Governable: {result['determination'].status.value}")
print(f"Omega Compliant: {result['compliance_status']['overall_compliant']}")
```

## API Server

Start the public API server:

```bash
uvicorn output.api_interface:app --reload --port 8000
```

Access:
- API Documentation: http://localhost:8000/docs
- Web Interface: http://localhost:8000/
- Determinations: http://localhost:8000/determinations

## Testing

Run the test suite:

```bash
pytest tests/ -v
```

Or run individual test files:

```bash
python tests/test_assessment_protocol.py
python tests/test_integration.py
```

## Governance Principles

OMEGA-F assesses systems against these principles:1. **Information Symmetry:** Operators must have visibility into autonomous components
2. **Power-Consequence Matching:** High-impact activities require corresponding control authority
3. **Post-Hoc Mitigation Insufficiency:** Systems with irreversible actions cannot rely on post-hoc mitigation
4. **Human Sovereignty:** Humans maintain ultimate decision authority
5. **Bounded Autonomy:** Autonomous components operate within explicit bounds
6. **Accountability Traceability:** System actions are traceable and accountable## Determination Statuses- **GOVERNABLE:** System is governable under current conditions
- **NOT_GOVERNABLE:** System has critical governance violations
- **CONDITIONALLY_GOVERNABLE:** System is governable under specific conditions
- **INSUFFICIENT_INFORMATION:** Cannot determine governability with available information## Integration PointsOMEGA-F integrates with:- **OPLAS:** Assesses OPLAS-based abstraction systems
- **Constraint Universe:** Assesses constraint-based systems
- **Orientation Lab:** Assesses orientation and alignment systems
- **Spine:** Assesses Spine contract implementations## LicenseMIT License## ContributingOMEGA-F is part of the Omega ecosystem. See the main Omega repository for contribution guidelines.