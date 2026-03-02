"""Multi-project orchestration and workflow management"""
from typing import Dict, List, Any, Optional, Callable
from contracts.integration_contracts import SpineArtifact, ArtifactType
from dataclasses import dataclass
from enum import Enum
from datetime import datetime

class WorkflowStepType(Enum):
    OPLAS_PROCESSING = "oplas_processing"
    CONSTRAINT_ANALYSIS = "constraint_analysis"
    ORIENTATION_ANALYSIS = "orientation_analysis"
    GOVERNANCE_ASSESSMENT = "governance_assessment"
    CROSS_VERIFICATION = "cross_verification"

@dataclass
class WorkflowStep:
    """Single step in multi-project workflow"""
    id: str
    type: WorkflowStepType
    system: str
    dependencies: List[str]
    parameters: Dict[str, Any]
    timeout_seconds: int = 300

@dataclass
class MultiProjectWorkflow:
    """Definition of workflow spanning multiple Omega projects"""
    id: str
    name: str
    description: str
    steps: List[WorkflowStep]
    input_requirements: Dict[str, Any]
    output_specifications: Dict[str, Any]
    
    def validate_dependencies(self) -> bool:
        """Validate that workflow dependencies are resolvable"""
        step_ids = {step.id for step in self.steps}
        
        for step in self.steps:
            for dep in step.dependencies:
                if dep not in step_ids:
                    return False
        return True

class IntegrationManager:
    """Manages complex workflows across multiple Omega projects"""
    
    def __init__(self):
        self.registered_systems = {}
        self.workflow_registry = {}
        self.execution_history = []
        
    def register_system(self, system_id: str, contract_implementation: Any):
        """Register a system for multi-project workflows"""
        self.registered_systems[system_id] = contract_implementation
        
    def execute_workflow(self, 
                       workflow: MultiProjectWorkflow, 
                       initial_inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute multi-project workflow with deterministic orchestration"""
        
        # Validate workflow
        if not workflow.validate_dependencies():
            raise ValueError(f"Workflow {workflow.id} has unresolvable dependencies")
        
        # Create execution context
        execution_context = {
            "workflow_id": workflow.id,
            "start_time": datetime.utcnow(),
            "artifacts": {},
            "step_results": {},
            "errors": []
        }
        
        # Execute steps in dependency order
        executed_steps = set()
        remaining_steps = workflow.steps.copy()
        
        while remaining_steps:
            # Find steps with satisfied dependencies
            ready_steps = [
                step for step in remaining_steps
                if all(dep in executed_steps for dep in step.dependencies)
            ]
            
            if not ready_steps:
                raise RuntimeError("Circular dependency or unresolvable workflow")
            
            # Execute ready steps sequentially (deterministic)
            for step in ready_steps:
                try:
                    result = self._execute_step(step, execution_context, initial_inputs)
                    execution_context["step_results"][step.id] = result
                    if "artifact" in result:
                        execution_context["artifacts"][step.id] = result["artifact"]
                    
                    executed_steps.add(step.id)
                    remaining_steps.remove(step)
                except Exception as e:
                    execution_context["errors"].append({
                        "step_id": step.id,
                        "error": str(e)
                    })
                    raise
        
        # Return final results
        return {
            "workflow_id": workflow.id,
            "execution_context": execution_context,
            "final_artifacts": execution_context["artifacts"],
            "success": len(execution_context["errors"]) == 0
        }
    
    def _execute_step(self, 
                     step: WorkflowStep,
                     execution_context: Dict[str, Any],
                     initial_inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute single workflow step"""
        
        # Get system implementation
        system = self.registered_systems.get(step.system)
        if not system:
            raise ValueError(f"System {step.system} not registered")
        
        # Prepare step inputs
        step_inputs = self._prepare_step_inputs(step, execution_context, initial_inputs)
        
        # Execute step implementation
        result = self._execute_step_implementation(system, step, step_inputs)
        
        return result
    
    def _prepare_step_inputs(self, 
                            step: WorkflowStep,
                            execution_context: Dict[str, Any],
                            initial_inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare inputs for workflow step"""
        step_inputs = step.parameters.copy()
        
        # Add artifacts from dependency steps
        for dep_id in step.dependencies:
            if dep_id in execution_context["artifacts"]:
                step_inputs[f"artifact_from_{dep_id}"] = execution_context["artifacts"][dep_id]
        
        # Add initial inputs if referenced
        for key, value in initial_inputs.items():
            if key in step_inputs:
                step_inputs[key] = value
                
        return step_inputs
    
    def _execute_step_implementation(self, 
                                   system: Any,
                                   step: WorkflowStep,
                                   step_inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the actual step implementation"""
        
        if step.type == WorkflowStepType.OPLAS_PROCESSING:
            # Call OPLAS produce_artifact method
            if hasattr(system, 'produce_artifact'):
                artifact = system.produce_artifact(step_inputs)
                return {"artifact": artifact, "type": "oplas_result"}
            else:
                # Fallback for testing
                return {"result": "oplas_processed", "type": "oplas_result"}
            
        elif step.type == WorkflowStepType.CONSTRAINT_ANALYSIS:
            # Process constraint universe analysis
            if hasattr(system, 'analyze_constraints'):
                result = system.analyze_constraints(step_inputs)
                return {"result": result, "type": "constraint_analysis"}
            else:
                return {"result": "constraint_analyzed", "type": "constraint_analysis"}
            
        elif step.type == WorkflowStepType.ORIENTATION_ANALYSIS:
            # Process orientation lab analysis
            if hasattr(system, 'analyze_orientation'):
                result = system.analyze_orientation(step_inputs)
                return {"result": result, "type": "orientation_analysis"}
            else:
                return {"result": "orientation_analyzed", "type": "orientation_analysis"}
            
        elif step.type == WorkflowStepType.GOVERNANCE_ASSESSMENT:
            # Process governance assessment
            if hasattr(system, 'assess_governance'):
                result = system.assess_governance(step_inputs)
                return {"result": result, "type": "governance_assessment"}
            else:
                return {"result": "governance_assessed", "type": "governance_assessment"}
            
        else:
            raise ValueError(f"Unknown step type: {step.type}")
