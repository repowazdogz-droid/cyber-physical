"""OMEGA-F Assessment Protocol v1.0"""
from typing import Dict, List, Any, Tuple, Optional
from core.types import (
    SystemSpecification, GovernanceDetermination, GovernanceEvidence,
    GovernanceViolation, GovernabilityStatus, GovernanceViolationType
)
from assessment.criteria import GovernanceCriteria
from assessment.analyzer import SystemAnalyzer
from assessment.evidence_collector import EvidenceCollector
from datetime import datetime

class AssessmentProtocol:
    """Systematic protocol for governance determination"""
    
    def __init__(self):
        self.criteria = GovernanceCriteria()
        self.analyzer = SystemAnalyzer()
        self.evidence_collector = EvidenceCollector()
        self.version = "1.0"
        
    def assess_system_governance(self, system_spec: SystemSpecification) -> GovernanceDetermination:
        """Execute full governance assessment protocol"""
        
        # Phase 1: Evidence Collection
        evidence = self._collect_evidence(system_spec)
        
        # Phase 2: Violation Detection
        violations = self._detect_violations(system_spec, evidence)
        
        # Phase 3: Risk Assessment
        risk_assessment = self._assess_risks(system_spec, violations, evidence)
        
        # Phase 4: Determination Generation
        status = self._determine_governability_status(violations, risk_assessment)
        
        # Phase 5: Condition Identification (if conditionally governable)
        enabling_conditions = []
        boundary_conditions = []
        if status == GovernabilityStatus.CONDITIONALLY_GOVERNABLE:
            enabling_conditions, boundary_conditions = self._identify_conditions(
                system_spec, violations, evidence
            )
        
        # Phase 6: Formal Determination Construction
        determination = GovernanceDetermination(
            determination_number=self._generate_determination_number(),
            system_specification=system_spec,
            status=status,
            summary=self._generate_summary(status, violations),
            violations=violations,
            evidence=evidence,
            risk_assessment=risk_assessment,
            enabling_conditions=enabling_conditions,
            boundary_conditions=boundary_conditions,
            basis=self._generate_basis(),
            limits=self._generate_limits(),
            invalidation_conditions=self._generate_invalidation_conditions(system_spec)
        )
        
        return determination
    
    def _collect_evidence(self, system_spec: SystemSpecification) -> List[GovernanceEvidence]:
        """Collect evidence for governance assessment"""
        evidence = []
        
        # System structure evidence
        structure_evidence = self.evidence_collector.analyze_system_structure(system_spec)
        evidence.extend(structure_evidence)
        
        # Information flow evidence
        info_flow_evidence = self.evidence_collector.analyze_information_flow(system_spec)
        evidence.extend(info_flow_evidence)
        
        # Control mechanism evidence
        control_evidence = self.evidence_collector.analyze_control_mechanisms(system_spec)
        evidence.extend(control_evidence)
        
        # Risk factor evidence
        risk_evidence = self.evidence_collector.analyze_risk_factors(system_spec)
        evidence.extend(risk_evidence)
        
        return evidence
    
    def _detect_violations(self, 
                          system_spec: SystemSpecification,
                          evidence: List[GovernanceEvidence]) -> List[GovernanceViolation]:
        """Detect governance violations using formal criteria"""
        violations = []
        
        # Check information asymmetry
        info_asymmetry_violation = self._check_information_asymmetry(system_spec, evidence)
        if info_asymmetry_violation:
            violations.append(info_asymmetry_violation)
        
        # Check power-consequence mismatch
        power_mismatch_violation = self._check_power_consequence_mismatch(system_spec, evidence)
        if power_mismatch_violation:
            violations.append(power_mismatch_violation)
        
        # Check rollback fiction
        rollback_violation = self._check_rollback_fiction(system_spec, evidence)
        if rollback_violation:
            violations.append(rollback_violation)
        
        # Check delegated agency constraints
        agency_violation = self._check_delegated_agency(system_spec, evidence)
        if agency_violation:
            violations.append(agency_violation)
        
        # Check scope boundary violations
        scope_violation = self._check_scope_boundary_violation(system_spec, evidence)
        if scope_violation:
            violations.append(scope_violation)
        
        # Check accountability gaps
        accountability_violation = self._check_accountability_gap(system_spec, evidence)
        if accountability_violation:
            violations.append(accountability_violation)
        
        return violations
    
    def _check_information_asymmetry(self, 
                                   system_spec: SystemSpecification,
                                   evidence: List[GovernanceEvidence]) -> Optional[GovernanceViolation]:
        """Check for information asymmetry violations"""
        
        # Look for autonomous components without operator visibility
        autonomous_without_visibility = []
        
        for component in system_spec.autonomous_components:
            visibility = system_spec.information_visibility.get(component, "none")
            if visibility in ["none", "limited", "delayed"]:
                autonomous_without_visibility.append(component)
        
        if autonomous_without_visibility:
            return GovernanceViolation(
                violation_type=GovernanceViolationType.INFORMATION_ASYMMETRY,
                severity="critical",
                description=f"Autonomous components {autonomous_without_visibility} lack operator visibility",
                affected_components=autonomous_without_visibility,
                risk_factors=[
                    "Operators cannot see downstream behavior",
                    "Emergent behavior may be undetectable",
                    "Accountability gaps in autonomous actions"
                ],
                supporting_evidence=[e.id for e in evidence if "information_flow" in e.evidence_type],
                confidence="high",
                possible_mitigations=[
                    "Add visibility mechanisms for autonomous components",
                    "Implement logging and monitoring",
                    "Require human approval before autonomous actions"
                ]
            )
        
        return None
    
    def _check_power_consequence_mismatch(self,
                                        system_spec: SystemSpecification,
                                        evidence: List[GovernanceEvidence]) -> Optional[GovernanceViolation]:
        """Check for power-consequence mismatch violations"""
        
        # Identify high-impact components without halt authority
        high_impact_without_halt = []
        
        high_impact_indicators = [
            "real_world_actions",
            "irreversible_decisions",
            "safety_critical",
            "financial_impact"
        ]
        
        has_high_impact = any(
            indicator in system_spec.stakeholder_impact 
            for indicator in high_impact_indicators
        )
        
        if has_high_impact:
            # Check if halt authority exists
            has_halt_authority = any(
                "halt" in control.lower() or 
                "stop" in control.lower() or
                "emergency" in control.lower()
                for control in system_spec.control_mechanisms
            )
            
            if not has_halt_authority:
                high_impact_without_halt = system_spec.stakeholder_impact
        
        if high_impact_without_halt:
            return GovernanceViolation(
                violation_type=GovernanceViolationType.POWER_CONSEQUENCE_MISMATCH,
                severity="critical",
                description=f"High-impact activities {high_impact_without_halt} lack halt authority",
                affected_components=high_impact_without_halt,
                risk_factors=[
                    "Real-world impact without control authority",
                    "Cannot stop harmful actions once initiated",
                    "Responsibility without power to intervene"
                ],
                supporting_evidence=[e.id for e in evidence if "control_mechanism" in e.evidence_type],
                confidence="high",
                possible_mitigations=[
                    "Implement emergency halt mechanism",
                    "Add human-in-the-loop approval gates",
                    "Require explicit authorization for high-impact actions"
                ]
            )
        
        return None
    
    def _check_rollback_fiction(self,
                               system_spec: SystemSpecification,
                               evidence: List[GovernanceEvidence]) -> Optional[GovernanceViolation]:
        """Check for rollback fiction violations"""
        
        # Check if system has irreversible actions but claims rollback capability
        irreversible_actions = [
            key for key, value in system_spec.reversibility_characteristics.items()
            if not value
        ]
        
        if irreversible_actions:
            # Check if system claims rollback capability
            has_rollback = any(
                "rollback" in mechanism.lower() or
                "undo" in mechanism.lower() or
                "revert" in mechanism.lower()
                for mechanism in system_spec.control_mechanisms
            )
            
            if has_rollback:
                return GovernanceViolation(
                    violation_type=GovernanceViolationType.ROLLBACK_FICTION,
                    severity="high",
                    description=f"System claims rollback capability but has irreversible actions: {irreversible_actions}",
                    affected_components=irreversible_actions,
                    risk_factors=[
                        "False sense of safety from claimed rollback",
                        "Operators may rely on non-existent mitigation",
                        "Post-hoc mitigation insufficient for irreversible actions"
                    ],
                    supporting_evidence=[e.id for e in evidence if "risk_assessment" in e.evidence_type],
                    confidence="high",
                    possible_mitigations=[
                        "Remove rollback claims for irreversible actions",
                        "Implement pre-emptive controls instead",
                        "Clarify actual reversibility characteristics"
                    ]
                )
        
        return None
    
    def _check_delegated_agency(self,
                               system_spec: SystemSpecification,
                               evidence: List[GovernanceEvidence]) -> Optional[GovernanceViolation]:
        """Check for delegated agency without halt violations"""
        
        # Check if autonomous components exist without halt capability
        if system_spec.autonomous_components:
            has_halt = any(
                "halt" in mechanism.lower() or
                "stop" in mechanism.lower()
                for mechanism in system_spec.control_mechanisms
            )
            
            if not has_halt:
                return GovernanceViolation(
                    violation_type=GovernanceViolationType.DELEGATED_AGENCY_WITHOUT_HALT,
                    severity="critical",
                    description=f"Autonomous components {system_spec.autonomous_components} lack halt authority",
                    affected_components=system_spec.autonomous_components,
                    risk_factors=[
                        "Cannot stop autonomous actions once initiated",
                        "Delegated agency without revocation capability",
                        "Loss of human control over autonomous systems"
                    ],
                    supporting_evidence=[e.id for e in evidence if "control_mechanism" in e.evidence_type],
                    confidence="high",
                    possible_mitigations=[
                        "Implement halt/stop mechanism for all autonomous components",
                        "Add human approval gates before autonomous execution",
                        "Require explicit authorization for each autonomous action"
                    ]
                )
        
        return None
    
    def _check_scope_boundary_violation(self,
                                       system_spec: SystemSpecification,
                                       evidence: List[GovernanceEvidence]) -> Optional[GovernanceViolation]:
        """Check for scope boundary violations"""
        
        unbounded_scopes = ["unrestricted", "open_ended", "general_purpose", ""]
        
        if system_spec.deployment_scope in unbounded_scopes:
            if system_spec.autonomous_components:
                return GovernanceViolation(
                    violation_type=GovernanceViolationType.SCOPE_BOUNDARY_VIOLATION,
                    severity="high",
                    description=f"Autonomous components operate in unbounded scope: {system_spec.deployment_scope}",
                    affected_components=system_spec.autonomous_components,
                    risk_factors=[
                        "Unbounded autonomy increases risk",
                        "Cannot predict all deployment scenarios",
                        "Boundary enforcement mechanisms missing"
                    ],
                    supporting_evidence=[e.id for e in evidence if "system_structure" in e.evidence_type],
                    confidence="medium",
                    possible_mitigations=[
                        "Define explicit deployment boundaries",
                        "Implement scope enforcement mechanisms",
                        "Limit autonomous components to bounded domains"
                    ]
                )
        
        return None
    
    def _check_accountability_gap(self,
                                 system_spec: SystemSpecification,
                                 evidence: List[GovernanceEvidence]) -> Optional[GovernanceViolation]:
        """Check for accountability gaps"""
        
        # Check if system has actions but no accountability mechanisms
        has_actions = (
            len(system_spec.autonomous_components) > 0 or
            len(system_spec.stakeholder_impact) > 0
        )
        
        if has_actions:
            has_accountability = any(
                "audit" in mechanism.lower() or
                "log" in mechanism.lower() or
                "trace" in mechanism.lower() or
                "record" in mechanism.lower()
                for mechanism in system_spec.control_mechanisms
            )
            
            if not has_accountability:
                return GovernanceViolation(
                    violation_type=GovernanceViolationType.ACCOUNTABILITY_GAP,
                    severity="medium",
                    description="System actions lack accountability mechanisms",
                    affected_components=system_spec.autonomous_components or ["system"],
                    risk_factors=[
                        "Cannot trace system actions",
                        "No audit trail for decisions",
                        "Accountability gaps in case of harm"
                    ],
                    supporting_evidence=[e.id for e in evidence if "control_mechanism" in e.evidence_type],
                    confidence="medium",
                    possible_mitigations=[
                        "Implement audit logging",
                        "Add action traceability",
                        "Create accountability records"
                    ]
                )
        
        return None
    
    def _assess_risks(self,
                     system_spec: SystemSpecification,
                     violations: List[GovernanceViolation],
                     evidence: List[GovernanceEvidence]) -> Dict[str, Any]:
        """Assess overall risk profile"""
        risk_profile = self.analyzer.analyze_risk_profile(system_spec)
        
        # Add violation-based risk factors
        critical_violations = [v for v in violations if v.severity == "critical"]
        high_violations = [v for v in violations if v.severity == "high"]
        
        risk_profile.update({
            "critical_violation_count": len(critical_violations),
            "high_violation_count": len(high_violations),
            "total_violations": len(violations),
            "overall_risk_level": self._calculate_overall_risk_level(
                risk_profile, violations
            )
        })
        
        return risk_profile
    
    def _calculate_overall_risk_level(self,
                                     risk_profile: Dict[str, Any],
                                     violations: List[GovernanceViolation]) -> str:
        """Calculate overall risk level"""
        if risk_profile.get("critical_violation_count", 0) > 0:
            return "critical"
        elif risk_profile.get("high_violation_count", 0) > 0:
            return "high"
        elif risk_profile.get("irreversibility_score", 0) > 0.5:
            return "medium"
        else:
            return "low"
    
    def _determine_governability_status(self,
                                      violations: List[GovernanceViolation],
                                      risk_assessment: Dict[str, Any]) -> GovernabilityStatus:
        """Determine overall governability status"""
        
        # Critical violations = not governable
        critical_violations = [v for v in violations if v.severity == "critical"]
        if critical_violations:
            return GovernabilityStatus.NOT_GOVERNABLE
        
        # High violations = conditionally governable (if mitigatable)
        high_violations = [v for v in violations if v.severity == "high"]
        if high_violations:
            mitigatable = all(
                len(v.possible_mitigations) > 0 for v in high_violations
            )
            if mitigatable:
                return GovernabilityStatus.CONDITIONALLY_GOVERNABLE
            else:
                return GovernabilityStatus.NOT_GOVERNABLE
        
        # Medium/low violations or no violations = governable
        return GovernabilityStatus.GOVERNABLE
    
    def _identify_conditions(self,
                            system_spec: SystemSpecification,
                            violations: List[GovernanceViolation],
                            evidence: List[GovernanceEvidence]) -> Tuple[List[str], List[str]]:
        """Identify enabling and boundary conditions for conditional governability"""
        enabling_conditions = []
        boundary_conditions = []
        
        for violation in violations:
            if violation.severity == "high":
                # Add mitigations as enabling conditions
                enabling_conditions.extend(violation.possible_mitigations)
                
                # Add boundary conditions based on violation type
                if violation.violation_type == GovernanceViolationType.SCOPE_BOUNDARY_VIOLATION:
                    boundary_conditions.append(
                        f"System must operate within bounded scope: {system_spec.deployment_scope}"
                    )
        
        # Remove duplicates
        enabling_conditions = list(set(enabling_conditions))
        boundary_conditions = list(set(boundary_conditions))
        
        return enabling_conditions, boundary_conditions
    
    def _generate_determination_number(self) -> str:
        """Generate unique determination number"""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        return f"OMEGA-F-{timestamp}"
    
    def _generate_summary(self, 
                         status: GovernabilityStatus,
                         violations: List[GovernanceViolation]) -> str:
        """Generate determination summary"""
        
        if status == GovernabilityStatus.GOVERNABLE:
            return "This system is governable under current deployment conditions."
            
        elif status == GovernabilityStatus.NOT_GOVERNABLE:
            violation_types = [v.violation_type.value for v in violations if v.severity == "critical"]
            if violation_types:
                return f"This system is not governable due to: {', '.join(violation_types)}"
            else:
                return "This system is not governable due to governance violations."
            
        elif status == GovernabilityStatus.CONDITIONALLY_GOVERNABLE:
            return "This system is governable under specific conditions and constraints."
            
        else:
            return "Insufficient information for governance determination."
    
    def _generate_basis(self) -> List[str]:
        """Generate formal basis for determination"""
        return [
            "OMEGA-F Governance Framework v1.0",
            "Structural governability analysis",
            "Information asymmetry principles", 
            "Power-consequence matching requirements",
            "Post-hoc mitigation insufficiency principle"
        ]
    
    def _generate_limits(self) -> List[str]:
        """Generate scope limitations"""
        return [
            "Assessment applies to structural governance viability only",
            "Does not assess technical safety or correctness",
            "Does not evaluate policy appropriateness",
            "Limited to information provided in system specification"
        ]
    
    def _generate_invalidation_conditions(self, system_spec: SystemSpecification) -> List[str]:
        """Generate conditions that would invalidate this determination"""
        return [
            "System specification changes materially",
            "New autonomous components added without assessment",
            "Deployment scope expands beyond specified boundaries",
            "Control mechanisms removed or disabled",
            "Information visibility mechanisms removed"
        ]
