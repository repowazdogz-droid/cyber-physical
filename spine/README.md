# Omega Spine

This is a set of contracts that govern research → learning → system evolution.

## How to Use

- Start with `/spine/spine_contract.md`
- Use `/spine/index.md` to navigate contracts 25–67
- Contracts are immutable unless explicitly revised

## What This Is Not

- Not a product
- Not a chatbot persona
- Not autonomous execution

## Enhanced Integration Infrastructure

The Spine now provides enhanced integration infrastructure for the Omega ecosystem:

### Integration Contracts
- **SpineArtifact**: Universal artifact format for cross-project exchange
- **SpineContract**: Base contract for all integrated systems
- **IntegrationStatus**: Compatibility checking across projects

### Governance Kernel
- **System governance assessment**: Evaluate governance viability
- **Artifact compliance checking**: Verify Omega compliance requirements
- **Cross-project governance**: Assess governance implications of integration

### Multi-Project Orchestration
- **IntegrationManager**: Manages workflows across multiple projects
- **MultiProjectWorkflow**: Define complex workflows spanning projects
- **WorkflowStep**: Individual steps in multi-project workflows

### Cross-Project Verification
- **CrossProjectVerifier**: Verify consistency across project boundaries
- **Semantic consistency**: Check semantic compatibility
- **Formal consistency**: Verify logical consistency
- **Governance consistency**: Ensure governance compatibility

### System Interfaces
- **OPLASInterface**: OPLAS integration contract
- **ConstraintUniverseInterface**: Constraint Universe integration
- **OrientationLabInterface**: Orientation Lab integration
- **OmegaFInterface**: OMEGA-F governance integration

## Usage

```python
from contracts.integration_contracts import SpineArtifact, ArtifactType
from orchestrator.integration_manager import IntegrationManager, MultiProjectWorkflow, WorkflowStep, WorkflowStepType
from kernels.governance_kernel import GovernanceKernel
from integration.oplas_interface import OPLASInterface

# Register systems
manager = IntegrationManager()
manager.register_system("oplas", OPLASInterface())

# Create workflow
workflow = MultiProjectWorkflow(
    id="test_workflow",
    name="Test Workflow",
    description="Test multi-project workflow",
    steps=[
        WorkflowStep(
            id="step1",
            type=WorkflowStepType.OPLAS_PROCESSING,
            system="oplas",
            dependencies=[],
            parameters={"request": "test"}
        )
    ],
    input_requirements={},
    output_specifications={}
)

# Execute workflow
result = manager.execute_workflow(workflow, {"request": "test"})

# Check compliance
gov_kernel = GovernanceKernel()
compliance = gov_kernel.check_artifact_compliance(artifact)
```

## Folder Map

- `/spine/contracts/` (numbered contracts + integration contracts)
- `/spine/kernels/` (execution kernels + governance kernel)
- `/spine/orchestrator/` (DAG runner + integration manager)
- `/spine/artifacts/` (artifact storage and management)
- `/spine/policies/` (capability gates and policies)
- `/spine/claims/` (evidence registry + cross-verification)
- `/spine/integration/` (system-specific interfaces)
- `/spine/index.md` (index)

## Status

- **Core contracts**: Active; immutable; versioned via git
- **Integration infrastructure**: Enhanced with cross-project support
- **Governance support**: Built-in OMEGA-F integration
- **Multi-project workflows**: Deterministic orchestration

Status: active; mac-first; versioned via git.
