"""Governance criteria definitions"""
from typing import Dict, List, Any
from core.types import SystemSpecification, GovernanceViolationType
from core.constants import GovernancePrinciple

class GovernanceCriteria:
    """Formal criteria for governance assessment"""
    
    def __init__(self):
        self.principles = {
            GovernancePrinciple.INFORMATION_SYMMETRY: self._check_information_symmetry,
            GovernancePrinciple.POWER_CONSEQUENCE_MATCHING: self._check_power_consequence_mismatch,
            GovernancePrinciple.POST_HOC_MITIGATION_INSUFFICIENCY: self._check_post_hoc_mitigation,
            GovernancePrinciple.HUMAN_SOVEREIGNTY: self._check_human_sovereignty,
            GovernancePrinciple.BOUNDED_AUTONOMY: self._check_bounded_autonomy,
            GovernancePrinciple.ACCOUNTABILITY_TRACEABILITY: self._check_accountability_traceability
        }
    
    def evaluate_system(self, system_spec: SystemSpecification) -> Dict[GovernancePrinciple, bool]:
        """Evaluate system against all governance principles"""
        results = {}
        for principle, check_func in self.principles.items():
            results[principle] = check_func(system_spec)
        return results
    
    def _check_information_symmetry(self, system_spec: SystemSpecification) -> bool:
        """Check if operators have visibility into autonomous components"""
        if not system_spec.autonomous_components:
            return True  # No autonomous components = no asymmetry
        
        for component in system_spec.autonomous_components:
            visibility = system_spec.information_visibility.get(component, "none")
            if visibility in ["none", "limited"]:
                return False
        return True
    
    def _check_power_consequence_mismatch(self, system_spec: SystemSpecification) -> bool:
        """Check if high-impact activities have corresponding control authority"""
        high_impact_indicators = [
            "real_world_actions",
            "irreversible_decisions",
            "safety_critical",
            "financial_impact",
            "legal_impact"
        ]
        
        has_high_impact = any(
            indicator in system_spec.stakeholder_impact 
            for indicator in high_impact_indicators
        )
        
        if not has_high_impact:
            return True  # No high impact = no mismatch
        
        # Check for halt/control mechanisms
        has_control = any(
            "halt" in mechanism.lower() or 
            "stop" in mechanism.lower() or
            "emergency" in mechanism.lower()
            for mechanism in system_spec.control_mechanisms
        )
        
        return has_control
    
    def _check_post_hoc_mitigation(self, system_spec: SystemSpecification) -> bool:
        """Check if system relies on post-hoc mitigation"""
        # Systems with irreversible actions cannot rely on post-hoc mitigation
        irreversible = any(
            not value for value in system_spec.reversibility_characteristics.values()
        )
        
        if irreversible:
            # Must have pre-emptive controls, not just post-hoc mitigation
            has_preemptive = any(
                "approval" in mechanism.lower() or
                "gate" in mechanism.lower() or
                "verification" in mechanism.lower()
                for mechanism in system_spec.control_mechanisms
            )
            return has_preemptive
        
        return True
    
    def _check_human_sovereignty(self, system_spec: SystemSpecification) -> bool:
        """Check if humans maintain ultimate decision authority"""
        if not system_spec.human_oversight_points:
            return False
        
        # Check decision authority structure
        critical_decisions = [
            "goal_setting",
            "task_definition",
            "result_acceptance",
            "deployment_authorization"
        ]
        
        for decision in critical_decisions:
            authority = system_spec.decision_authority_structure.get(decision, "unknown")
            if authority not in ["human", "human_with_assistance"]:
                return False
        
        return True
    
    def _check_bounded_autonomy(self, system_spec: SystemSpecification) -> bool:
        """Check if autonomous components operate within explicit bounds"""
        if not system_spec.autonomous_components:
            return True
        
        # Check if deployment scope is bounded
        unbounded_scopes = ["unrestricted", "open_ended", "general_purpose"]
        if system_spec.deployment_scope in unbounded_scopes:
            return False
        
        # Check for boundary enforcement mechanisms
        has_boundaries = any(
            "boundary" in mechanism.lower() or
            "scope" in mechanism.lower() or
            "limit" in mechanism.lower()
            for mechanism in system_spec.control_mechanisms
        )
        
        return has_boundaries or len(system_spec.autonomous_components) == 0
    
    def _check_accountability_traceability(self, system_spec: SystemSpecification) -> bool:
        """Check if system actions are traceable and accountable"""
        # Check for audit trails or logging
        has_traceability = any(
            "audit" in mechanism.lower() or
            "log" in mechanism.lower() or
            "trace" in mechanism.lower() or
            "record" in mechanism.lower()
            for mechanism in system_spec.control_mechanisms
        )
        
        # Check information visibility for accountability
        has_visibility = any(
            visibility in ["full", "partial"]
            for visibility in system_spec.information_visibility.values()
        )
        
        return has_traceability or has_visibility
