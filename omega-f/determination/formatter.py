"""Standard determination format utilities"""
from typing import Dict, Any
from core.types import GovernanceDetermination
import json

class DeterminationFormatter:
    """Formats determinations in standard formats"""
    
    @staticmethod
    def to_json(determination: GovernanceDetermination, indent: int = 2) -> str:
        """Convert determination to JSON format"""
        data = {
            "determination_number": determination.determination_number,
            "status": determination.status.value,
            "system": {
                "id": determination.system_specification.id,
                "name": determination.system_specification.name,
                "description": determination.system_specification.description,
                "type": determination.system_specification.system_type.value
            },
            "summary": determination.summary,
            "violations": [
                {
                    "id": v.id,
                    "type": v.violation_type.value,
                    "severity": v.severity,
                    "description": v.description,
                    "affected_components": v.affected_components,
                    "risk_factors": v.risk_factors,
                    "confidence": v.confidence,
                    "mitigations": v.possible_mitigations
                }
                for v in determination.violations
            ],
            "evidence": [
                {
                    "id": e.id,
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
            "limits": determination.limits,
            "metadata": {
                "assessed_by": determination.assessed_by,
                "assessment_date": determination.assessment_date.isoformat(),
                "public_release_date": determination.public_release_date.isoformat() if determination.public_release_date else None,
                "version": determination.version
            }
        }
        return json.dumps(data, indent=indent, default=str)
    
    @staticmethod
    def to_markdown(determination: GovernanceDetermination) -> str:
        """Convert determination to Markdown format"""
        lines = [
            f"# Governance Determination: {determination.determination_number}",
            "",
            f"**Status:** {determination.status.value.upper()}",
            f"**System:** {determination.system_specification.name}",
            f"**Assessment Date:** {determination.assessment_date.strftime('%Y-%m-%d')}",
            "",
            "## Summary",
            "",
            determination.summary,
            ""
        ]
        
        if determination.violations:
            lines.extend([
                "## Violations",
                ""
            ])
            for i, violation in enumerate(determination.violations, 1):
                lines.extend([
                    f"### Violation {i}: {violation.violation_type.value}",
                    f"**Severity:** {violation.severity}",
                    f"**Description:** {violation.description}",
                    "",
                    "**Affected Components:**",
                ])
                for component in violation.affected_components:
                    lines.append(f"- {component}")
                
                lines.extend([
                    "",
                    "**Risk Factors:**",
                ])
                for risk in violation.risk_factors:
                    lines.append(f"- {risk}")
                
                if violation.possible_mitigations:
                    lines.extend([
                        "",
                        "**Possible Mitigations:**",
                    ])
                    for mitigation in violation.possible_mitigations:
                        lines.append(f"- {mitigation}")
                lines.append("")
        
        if determination.enabling_conditions:
            lines.extend([
                "## Enabling Conditions",
                ""
            ])
            for condition in determination.enabling_conditions:
                lines.append(f"- {condition}")
            lines.append("")
        
        if determination.boundary_conditions:
            lines.extend([
                "## Boundary Conditions",
                ""
            ])
            for condition in determination.boundary_conditions:
                lines.append(f"- {condition}")
            lines.append("")
        
        lines.extend([
            "## Basis",
            ""
        ])
        for basis_item in determination.basis:
            lines.append(f"- {basis_item}")
        lines.append("")
        
        lines.extend([
            "## Limitations",
            ""
        ])
        for limit in determination.limits:
            lines.append(f"- {limit}")
        
        return "\n".join(lines)
    
    @staticmethod
    def to_public_format(determination: GovernanceDetermination) -> Dict[str, Any]:
        """Convert to public-facing format"""
        return determination.to_public_record()
