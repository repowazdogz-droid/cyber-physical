"""Determination validation"""
from typing import List, Tuple
from core.types import GovernanceDetermination, GovernabilityStatus

class DeterminationValidator:
    """Validates governance determinations"""
    
    def validate(self, determination: GovernanceDetermination) -> Tuple[bool, List[str]]:
        """Validate determination structure and consistency"""
        errors = []
        
        # Check required fields
        if not determination.determination_number:
            errors.append("Missing determination number")
        
        if not determination.system_specification:
            errors.append("Missing system specification")
        
        if not determination.status:
            errors.append("Missing governability status")
        
        # Check consistency between status and violations
        critical_violations = [v for v in determination.violations if v.severity == "critical"]
        if critical_violations and determination.status == GovernabilityStatus.GOVERNABLE:
            errors.append("Inconsistent: Governable status with critical violations")
        
        if determination.status == GovernabilityStatus.NOT_GOVERNABLE and not critical_violations:
            high_violations = [v for v in determination.violations if v.severity == "high"]
            if not high_violations:
                errors.append("Inconsistent: Not governable status without critical or high violations")
        
        # Check conditional governability requirements
        if determination.status == GovernabilityStatus.CONDITIONALLY_GOVERNABLE:
            if not determination.enabling_conditions:
                errors.append("Missing enabling conditions for conditionally governable status")
            if not determination.boundary_conditions:
                errors.append("Missing boundary conditions for conditionally governable status")
        
        # Check evidence consistency
        if not determination.evidence:
            errors.append("Missing evidence for determination")
        
        # Check basis and limits
        if not determination.basis:
            errors.append("Missing basis for determination")
        
        if not determination.limits:
            errors.append("Missing limits for determination")
        
        # Check violation evidence references
        for violation in determination.violations:
            if violation.supporting_evidence:
                evidence_ids = {e.id for e in determination.evidence}
                missing_evidence = set(violation.supporting_evidence) - evidence_ids
                if missing_evidence:
                    errors.append(f"Violation references missing evidence: {missing_evidence}")
        
        return len(errors) == 0, errors
    
    def is_valid(self, determination: GovernanceDetermination) -> bool:
        """Check if determination is valid"""
        is_valid, _ = self.validate(determination)
        return is_valid
