"""Standard determination formats"""
from typing import Dict, Any
from core.types import GovernanceDetermination
from determination.formatter import DeterminationFormatter

class StandardFormats:
    """Standard formats for determinations"""
    
    def __init__(self):
        self.formatter = DeterminationFormatter()
    
    def to_public_json(self, determination: GovernanceDetermination) -> str:
        """Convert to public JSON format"""
        return self.formatter.to_json(determination)
    
    def to_public_markdown(self, determination: GovernanceDetermination) -> str:
        """Convert to public Markdown format"""
        return self.formatter.to_markdown(determination)
    
    def to_api_response(self, determination: GovernanceDetermination) -> Dict[str, Any]:
        """Convert to API response format"""
        return {
            "determination_number": determination.determination_number,
            "status": determination.status.value,
            "system": {
                "name": determination.system_specification.name,
                "type": determination.system_specification.system_type.value
            },
            "summary": determination.summary,
            "assessment_date": determination.assessment_date.isoformat(),
            "violations_summary": {
                "total": len(determination.violations),
                "critical": len([v for v in determination.violations if v.severity == "critical"]),
                "high": len([v for v in determination.violations if v.severity == "high"])
            },
            "conditions": {
                "enabling": determination.enabling_conditions,
                "boundary": determination.boundary_conditions
            }
        }
