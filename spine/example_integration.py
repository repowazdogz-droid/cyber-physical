#!/usr/bin/env python3
"""Example: Spine enhanced integration infrastructure"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from contracts.integration_contracts import SpineArtifact, ArtifactType
from orchestrator.integration_manager import IntegrationManager, MultiProjectWorkflow, WorkflowStep, WorkflowStepType
from kernels.governance_kernel import GovernanceKernel, GovernanceAssessmentType
from integration.oplas_interface import OPLASInterface
from integration.constraint_interface import ConstraintUniverseInterface
from integration.orientation_interface import OrientationLabInterface
from integration.omega_f_interface import OmegaFInterface
from claims.cross_verification import CrossProjectVerifier
from datetime import datetime

def main():
    print("=== Spine: Enhanced Integration Infrastructure ===\n")
    
    # Initialize components
    gov_kernel = GovernanceKernel()
    integration_manager = IntegrationManager()
    verifier = CrossProjectVerifier()
    
    # Register systems
    print("Registering systems...")
    integration_manager.register_system("oplas", OPLASInterface())
    integration_manager.register_system("constraint_universe", ConstraintUniverseInterface())
    integration_manager.register_system("orientation_lab", OrientationLabInterface())
    integration_manager.register_system("omega_f", OmegaFInterface())
    print("✓ Systems registered\n")
    
    # Create sample artifacts from different systems
    print("Creating sample artifacts...")
    
    # OPLAS artifact
    oplas_interface = OPLASInterface()
    oplas_artifact = oplas_interface.produce_artifact({
        "canonical_graph": {"nodes": {"node1": {}}, "edges": []},
        "target_systems": ["constraint_universe"],
        "scope": "data_analysis",
        "limitations": ["limited_to_structured_data"],
        "resource_limits": {"memory": "512MB"},
        "replay_data": {"replayable": True},
        "human_decision_points": ["approval_required"]
    })
    print(f"  OPLAS artifact: {oplas_artifact.id}")
    
    # Constraint Universe artifact
    constraint_interface = ConstraintUniverseInterface()
    constraint_artifact = constraint_interface.produce_artifact({
        "constraint_model": {"variables": ["A", "B"], "constraints": ["A requires B"]},
        "target_systems": ["omega_f"],
        "scope": "governance_assessment",
        "limitations": ["boolean_variables_only"],
        "resource_limits": {"time": "5s"},
        "proofs": [{"proof_type": "z3", "verified": True}],
        "replay_data": {"replayable": True},
        "human_decision_points": ["interpretation_required"]
    })
    print(f"  Constraint artifact: {constraint_artifact.id}")
    
    # Orientation Lab artifact
    orientation_interface = OrientationLabInterface()
    orientation_artifact = orientation_interface.produce_artifact({
        "assumption_graph": {"assumptions": ["assumption1", "assumption2"]},
        "target_systems": ["oplas"],
        "scope": "uncertainty_analysis",
        "limitations": ["qualitative_only"],
        "resource_limits": {"participants": 10},
        "decision_points": ["decision_1", "decision_2"]
    })
    print(f"  Orientation artifact: {orientation_artifact.id}\n")
    
    # Test compliance checking
    print("=== Governance Compliance Check ===")
    for artifact in [oplas_artifact, constraint_artifact, orientation_artifact]:
        compliance = gov_kernel.check_artifact_compliance(artifact)
        status = "✓ COMPLIANT" if compliance["compliant"] else "✗ NON-COMPLIANT"
        print(f"{status}: {artifact.source_system}")
        if not compliance["compliant"]:
            missing = [k for k, v in compliance.items() if not v and k != "compliant"]
            print(f"  Missing: {', '.join(missing)}")
    
    # Test cross-project verification
    print("\n=== Cross-Project Verification ===")
    artifacts = [oplas_artifact, constraint_artifact, orientation_artifact]
    consistency = verifier.verify_cross_project_consistency(artifacts)
    
    status = "✓ CONSISTENT" if consistency["overall_consistent"] else "✗ INCONSISTENT"
    print(f"Overall consistency: {status}")
    
    for check_name, check_result in consistency["individual_checks"].items():
        check_status = "✓" if check_result["consistent"] else "✗"
        print(f"  {check_status} {check_name}: {len(check_result.get('conflicts', []))} conflicts")
    
    # Test multi-project workflow
    print("\n=== Multi-Project Workflow ===")
    workflow = MultiProjectWorkflow(
        id="full_analysis_pipeline",
        name="Full Analysis Pipeline",
        description="OPLAS → Constraint → Orientation → Governance",
        steps=[
            WorkflowStep(
                id="parse",
                type=WorkflowStepType.OPLAS_PROCESSING,
                system="oplas",
                dependencies=[],
                parameters={"request_text": "analyze system governance"}
            ),
            WorkflowStep(
                id="constraints",
                type=WorkflowStepType.CONSTRAINT_ANALYSIS,
                system="constraint_universe",
                dependencies=["parse"],
                parameters={}
            ),
            WorkflowStep(
                id="orientation",
                type=WorkflowStepType.ORIENTATION_ANALYSIS,
                system="orientation_lab",
                dependencies=["constraints"],
                parameters={}
            ),
            WorkflowStep(
                id="governance",
                type=WorkflowStepType.GOVERNANCE_ASSESSMENT,
                system="omega_f",
                dependencies=["orientation"],
                parameters={}
            )
        ],
        input_requirements={"request_text": "string"},
        output_specifications={"governance_determination": "object"}
    )
    
    print(f"Workflow: {workflow.name}")
    print(f"Steps: {len(workflow.steps)}")
    print(f"Dependencies valid: {workflow.validate_dependencies()}")
    
    # Execute workflow
    result = integration_manager.execute_workflow(
        workflow,
        {"request_text": "assess system governance"}
    )
    
    if result["success"]:
        print(f"✓ Workflow executed successfully")
        print(f"  Final artifacts: {len(result['final_artifacts'])}")
    else:
        print(f"✗ Workflow execution failed")
        print(f"  Errors: {result.get('execution_context', {}).get('errors', [])}")
    
    print("\n✓ Spine integration infrastructure complete!")

if __name__ == "__main__":
    main()
