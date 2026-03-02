"""Cross-project integration tests"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from contracts.integration_contracts import SpineArtifact, ArtifactType
from orchestrator.integration_manager import IntegrationManager, MultiProjectWorkflow, WorkflowStep, WorkflowStepType
from kernels.governance_kernel import GovernanceKernel, GovernanceAssessmentType
from integration.oplas_interface import OPLASInterface
from integration.constraint_interface import ConstraintUniverseInterface
from integration.orientation_interface import OrientationLabInterface
from integration.omega_f_interface import OmegaFInterface
from datetime import datetime, timezone

def test_multi_project_workflow():
    """Test workflow spanning OPLAS -> Constraint Universe -> Governance"""
    
    # Create sample workflow
    workflow = MultiProjectWorkflow(
        id="oplas_constraint_governance",
        name="OPLAS to Governance Assessment",
        description="Process request through OPLAS, analyze constraints, assess governance",
        steps=[
            WorkflowStep(
                id="parse_request",
                type=WorkflowStepType.OPLAS_PROCESSING,
                system="oplas",
                dependencies=[],
                parameters={"request_text": "analyze sales data for patterns"}
            ),
            WorkflowStep(
                id="constraint_analysis", 
                type=WorkflowStepType.CONSTRAINT_ANALYSIS,
                system="constraint_universe",
                dependencies=["parse_request"],
                parameters={}
            ),
            WorkflowStep(
                id="governance_assessment",
                type=WorkflowStepType.GOVERNANCE_ASSESSMENT,
                system="omega_f",
                dependencies=["constraint_analysis"],
                parameters={}
            )
        ],
        input_requirements={"request_text": "string"},
        output_specifications={"governance_determination": "object"}
    )
    
    # Validate workflow
    assert workflow.validate_dependencies()
    print("✓ Workflow dependency validation passed")
    
    # Test governance kernel
    gov_kernel = GovernanceKernel()
    
    # Create sample artifact for compliance checking
    sample_artifact = SpineArtifact(
        id="test_artifact",
        type=ArtifactType.CANONICAL_REPRESENTATION,
        version="1.0",
        source_system="test",
        target_systems=[],
        canonical_data={"test": "data"},
        metadata={
            "requires_human_approval": True,
            "autonomous_actions": False,
            "scope": "test_scope",
            "limitations": ["test_limit"],
            "resource_limits": {"memory": "100MB"},
            "replay_data": {"replayable": True},
            "human_decision_points": ["decision_1"],
            "autonomous_goal_setting": False
        },
        provenance={"created_by": "test"},
        content_hash="",
        verification_proofs=[],
        conversion_hints={},
        compatibility_matrix={},
        created_at=datetime.now(timezone.utc)
    )
    
    # Compute hash
    sample_artifact.content_hash = sample_artifact._compute_content_hash()
    
    # Test compliance checking
    compliance = gov_kernel.check_artifact_compliance(sample_artifact)
    assert compliance["compliant"]
    assert compliance["deterministic"]
    assert compliance["bounded"]
    assert compliance["non_autonomous"]
    assert compliance["human_sovereignty"]
    print("✓ Artifact compliance checking passed")
    
    # Test integration manager
    manager = IntegrationManager()
    
    # Register systems
    manager.register_system("oplas", OPLASInterface())
    manager.register_system("constraint_universe", ConstraintUniverseInterface())
    manager.register_system("omega_f", OmegaFInterface())
    
    # Execute workflow
    result = manager.execute_workflow(
        workflow,
        {"request_text": "analyze sales data"}
    )
    
    assert result["success"]
    assert "final_artifacts" in result
    print("✓ Multi-project workflow execution passed")
    
    print("\nAll cross-project integration tests passed!")

if __name__ == "__main__":
    test_multi_project_workflow()
