"""Determination generation utilities"""
from typing import Dict, Any
from core.types import GovernanceDetermination, GovernabilityStatus

class DeterminationGenerator:
    """Generates formatted determinations"""
    
    @staticmethod
    def generate_executive_summary(determination: GovernanceDetermination) -> str:
        """Generate executive summary of determination"""
        lines = [
            f"DETERMINATION: {determination.determination_number}",
            f"SYSTEM: {determination.system_specification.name}",
            f"STATUS: {determination.status.value.upper()}",
            "",
            determination.summary,
            ""
        ]
        
        if determination.violations:
            lines.append(f"VIOLATIONS IDENTIFIED: {len(determination.violations)}")
            for violation in determination.violations:
                lines.append(f"  - {violation.violation_type.value} ({violation.severity})")
        
        if determination.enabling_conditions:
            lines.append("")
            lines.append("ENABLING CONDITIONS:")
            for condition in determination.enabling_conditions:
                lines.append(f"  - {condition}")
        
        return "\n".join(lines)
    
    @staticmethod
    def generate_detailed_report(determination: GovernanceDetermination) -> Dict[str, Any]:
        """Generate detailed determination report"""
        return {
            "determination": {
                "number": determination.determination_number,
                "status": determination.status.value,
                "date": determination.assessment_date.isoformat(),
                "version": determination.version
            },
            "system": {
                "name": determination.system_specification.name,
                "description": determination.system_specification.description,
                "type": determination.system_specification.system_type.value
            },
            "summary": determination.summary,
            "violations": [
                {
                    "type": v.violation_type.value,
                    "severity": v.severity,
                    "description": v.description,
                    "affected_components": v.affected_components,
                    "risk_factors": v.risk_factors,
                    "mitigations": v.possible_mitigations
                }
                for v in determination.violations
            ],
            "evidence": [
                {
                    "type": e.evidence_type,
                    "description": e.description,
                    "findings": e.findings,
                    "confidence": e.confidence_level
                }
                for e in determination.evidence
            ],
            "risk_assessment": determination.risk_assessment,
            "conditions": {
                "enabling": determination.enabling_conditions,
                "boundary": determination.boundary_conditions,
                "invalidation": determination.invalidation_conditions
            },
            "basis": determination.basis,
            "limits": determination.limits
        }
