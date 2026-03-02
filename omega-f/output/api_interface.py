"""Public API for governance determinations"""
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from core.types import GovernanceDetermination, GovernabilityStatus, SystemSpecification, SystemType
from assessment.protocol import AssessmentProtocol
from determination.validator import DeterminationValidator
from output.public_records import PublicRecordManager
from output.determination_formats import StandardFormats

app = FastAPI(title="OMEGA-F Governance Determinations API", version="1.0")

# Initialize components
protocol = AssessmentProtocol()
validator = DeterminationValidator()
record_manager = PublicRecordManager()
formats = StandardFormats()

class SystemSpecRequest(BaseModel):
    """Request model for system specification"""
    name: str
    description: str = ""
    system_type: str = "unknown"
    autonomous_components: List[str] = []
    human_oversight_points: List[str] = []
    decision_authority_structure: Dict[str, str] = {}
    deployment_scope: str = ""
    stakeholder_impact: List[str] = []
    reversibility_characteristics: Dict[str, bool] = {}
    potential_harms: List[str] = []
    failure_modes: List[str] = []
    control_mechanisms: List[str] = []
    information_visibility: Dict[str, str] = {}
    feedback_loops: List[str] = []

@app.get("/determinations")
async def list_determinations(
    status: Optional[str] = None,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """List public governance determinations"""
    
    gov_status = None
    if status:
        try:
            gov_status = GovernabilityStatus(status)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    return record_manager.list_public_records(gov_status, limit)

@app.get("/determinations/{determination_id}")
async def get_determination(determination_id: str) -> Dict[str, Any]:
    """Get specific governance determination"""
    
    determination = record_manager.publisher.get_published(determination_id)
    if not determination:
        raise HTTPException(status_code=404, detail="Determination not found")
    
    return formats.to_api_response(determination)

@app.post("/assessment")
async def request_assessment(system_spec_request: SystemSpecRequest) -> Dict[str, Any]:
    """Request governance assessment for system specification"""
    
    # Convert request to SystemSpecification
    try:
        system_type = SystemType(system_spec_request.system_type)
    except ValueError:
        system_type = SystemType.UNKNOWN
    
    system_spec = SystemSpecification(
        name=system_spec_request.name,
        description=system_spec_request.description,
        system_type=system_type,
        autonomous_components=system_spec_request.autonomous_components,
        human_oversight_points=system_spec_request.human_oversight_points,
        decision_authority_structure=system_spec_request.decision_authority_structure,
        deployment_scope=system_spec_request.deployment_scope,
        stakeholder_impact=system_spec_request.stakeholder_impact,
        reversibility_characteristics=system_spec_request.reversibility_characteristics,
        potential_harms=system_spec_request.potential_harms,
        failure_modes=system_spec_request.failure_modes,
        control_mechanisms=system_spec_request.control_mechanisms,
        information_visibility=system_spec_request.information_visibility,
        feedback_loops=system_spec_request.feedback_loops
    )
    
    # Run assessment
    determination = protocol.assess_system_governance(system_spec)
    
    # Validate
    is_valid, errors = validator.validate(determination)
    if not is_valid:
        raise HTTPException(status_code=500, detail=f"Invalid determination: {errors}")
    
    # Publish
    record_manager.publish_determination(determination)
    
    return {
        "determination_id": determination.id,
        "determination_number": determination.determination_number,
        "status": determination.status.value,
        "summary": determination.summary,
        "public_record": determination.to_public_record()
    }

@app.get("/statistics")
async def get_statistics() -> Dict[str, Any]:
    """Get aggregate statistics on governance determinations"""
    return record_manager.get_statistics()

@app.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint"""
    return {"status": "healthy", "service": "OMEGA-F Governance Determinations API"}
