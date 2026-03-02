"""Core decision analysis logic for Spine Decision Runtime."""

from typing import List, Optional, Dict, Any
from .schemas import (
    CaseInput,
    DecisionAnalysis,
    DecisionMap,
    ConstraintCheck,
    FailureMode,
    Contradiction,
    Unknown,
    RecommendedExperiment,
    EpistemicWeight,
    ConditionalConfidence,
    FailureCategory
)
from .contracts import ContractLoader
from .trace import DecisionTraceGraph
from .ledger import OutcomeLedger
from .uncertainty import UncertaintyPropagator
from .falsification import FalsificationEngine
from .formal_constraints import FormalConstraintChecker


class DecisionAnalyzer:
    """Analyzes case inputs and produces decision analysis."""
    
    def __init__(self, contracts_dir: Optional[str] = None):
        """
        Initialize analyzer with contract loader.
        
        Args:
            contracts_dir: Optional path to contracts directory
        """
        self.contract_loader = ContractLoader(contracts_dir)
    
    def _categorize_failure(self, mode: str) -> FailureCategory:
        """Categorize failure mode based on mode name."""
        mode_lower = mode.lower()
        if any(x in mode_lower for x in ["slip", "force", "torque", "load", "stress", "strain"]):
            return FailureCategory.MECHANICAL
        elif any(x in mode_lower for x in ["thermal", "temperature", "overheat", "cooling"]):
            return FailureCategory.THERMAL
        elif any(x in mode_lower for x in ["control", "actuator", "motor", "servo"]):
            return FailureCategory.CONTROL
        elif any(x in mode_lower for x in ["material", "degradation", "wear", "fatigue"]):
            return FailureCategory.MATERIAL
        elif any(x in mode_lower for x in ["collision", "clearance", "interference", "geometry"]):
            return FailureCategory.GEOMETRIC
        elif any(x in mode_lower for x in ["sensor", "sensing", "feedback", "measurement"]):
            return FailureCategory.SENSING
        elif any(x in mode_lower for x in ["interaction", "contact", "grasp", "manipulation"]):
            return FailureCategory.INTERACTION
        else:
            return FailureCategory.UNKNOWN
    
    def _compute_detectability(self, mode: str, category: FailureCategory) -> int:
        """Compute detectability score (1=easy, 10=hard)."""
        mode_lower = mode.lower()
        
        # Easy to detect (1-3): obvious failures
        if any(x in mode_lower for x in ["collision", "binding", "slip", "overload"]):
            return 2
        
        # Medium detectability (4-6): requires monitoring
        if category == FailureCategory.THERMAL:
            return 5  # Thermal failures need sensors
        elif category == FailureCategory.MATERIAL:
            return 6  # Material degradation is gradual
        elif category == FailureCategory.CONTROL:
            return 4  # Control issues show up in behavior
        
        # Hard to detect (7-9): subtle failures
        if category == FailureCategory.SENSING:
            return 8  # Sensor failures can be silent
        elif "degradation" in mode_lower or "fatigue" in mode_lower:
            return 7  # Gradual degradation
        
        # Default medium
        return 5
    
    def _compute_severity_detectability_product(self, severity: str, detectability: int) -> int:
        """Compute severity × detectability product."""
        severity_map = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        severity_value = severity_map.get(severity.lower(), 2)
        return severity_value * detectability
    
    def _compute_likelihood(self, mode: str, category: FailureCategory, constraints: List[str]) -> int:
        """Compute likelihood of occurrence (1-10)."""
        mode_lower = mode.lower()
        constraints_lower = " ".join(c.lower() for c in constraints)
        
        # High likelihood indicators (8-10)
        if any(x in mode_lower for x in ["fatigue", "wear", "degradation", "accumulation"]):
            return 8  # Gradual processes are likely
        if "borderline" in constraints_lower or "marginal" in constraints_lower:
            return 9  # Borderline conditions are very likely
        if any(x in mode_lower for x in ["saturation", "overload", "exceed"]):
            return 7  # Overload conditions are likely
        
        # Medium likelihood (4-7)
        if category == FailureCategory.THERMAL:
            return 6  # Thermal issues are moderately likely
        elif category == FailureCategory.MATERIAL:
            return 5  # Material issues depend on environment
        elif category == FailureCategory.CONTROL:
            return 6  # Control issues are moderately likely
        
        # Low likelihood (1-3)
        if category == FailureCategory.SENSING:
            return 3  # Sensor failures are less likely
        elif "catastrophic" in mode_lower:
            return 2  # Catastrophic failures are rare
        
        return 5  # Default medium
    
    def _compute_severity_score(self, severity: str) -> int:
        """Convert severity string to numeric score (1-10)."""
        severity_map = {
            "low": 3,
            "medium": 5,
            "high": 7,
            "critical": 10
        }
        return severity_map.get(severity.lower(), 5)
    
    def _compute_detectability_inverse(self, detectability: int) -> int:
        """Convert detectability (1=easy, 10=hard) to inverse (1=easy, 10=hard)."""
        # detectability_inverse is the same as detectability_score
        # Both use 1=easy, 10=hard scale
        return detectability
    
    def _compute_rpn(self, severity_score: int, likelihood: int, detectability_inverse: int) -> int:
        """Compute Risk Priority Number."""
        return severity_score * likelihood * detectability_inverse
    
    def analyze(self, case: CaseInput, context: Optional[Dict[str, Any]] = None, ledger: Optional[OutcomeLedger] = None, design_data: Optional[Dict[str, Any]] = None) -> DecisionAnalysis:
        """
        Analyze a case and produce decision analysis.
        
        Args:
            case: Parsed case input
            context: Optional context dict containing physics results or other derived data
            ledger: Optional outcome ledger for recording predictions
            design_data: Optional design data dictionary for formal constraint checking
            
        Returns:
            DecisionAnalysis with all findings
        """
        # Initialize trace graph
        trace = DecisionTraceGraph()
        
        # Initialize uncertainty propagator
        propagator = UncertaintyPropagator()
        
        # Initialize falsification engine
        falsification_engine = FalsificationEngine()
        
        # Parse and register uncertainties
        uncertainty_map = {}  # Map from raw string to uncertainty ID
        for uncertainty_str in case.uncertainties:
            uncertainty = propagator.parse_uncertainty_string(uncertainty_str)
            uncertainty_id = propagator.register_uncertainty(uncertainty)
            uncertainty_map[uncertainty_str] = uncertainty_id
        
        # Add input nodes
        problem_node_id = trace.add_node(
            "input",
            {"type": "problem", "name": case.problem.name, "domain": case.problem.domain}
        )
        
        constraint_node_ids = []
        for constraint in case.constraints:
            node_id = trace.add_node(
                "input",
                {"type": "constraint", "value": constraint},
                parents=[problem_node_id]
            )
            constraint_node_ids.append(node_id)
        
        uncertainty_node_ids = []
        for uncertainty in case.uncertainties:
            node_id = trace.add_node(
                "input",
                {"type": "uncertainty", "value": uncertainty},
                parents=[problem_node_id]
            )
            uncertainty_node_ids.append(node_id)
        
        objective_node_ids = []
        for objective in case.objectives:
            node_id = trace.add_node(
                "input",
                {"type": "objective", "value": objective},
                parents=[problem_node_id]
            )
            objective_node_ids.append(node_id)
        
        # Enrich design_data for spine_surgery domain (patient_goals, comorbidities, prior_treatments from case)
        enriched_design_data = None
        if design_data and getattr(case.problem, "domain", None) == "spine_surgery":
            enriched_design_data = dict(design_data)
            enriched_design_data["patient_goals"] = ""
            if case.objectives:
                first_obj = case.objectives[0].strip()
                for prefix in ("patient_goal:", "patient_goal："):
                    if first_obj.lower().startswith(prefix):
                        first_obj = first_obj[len(prefix):].strip()
                        break
                enriched_design_data["patient_goals"] = first_obj
            enriched_design_data["comorbidities"] = [
                c.replace("comorbidity:", "").replace("comorbidity：", "").strip()
                for c in case.constraints
                if c.strip().lower().startswith("comorbidity:")
            ]
            enriched_design_data["prior_treatments"] = [
                c.replace("prior_treatment:", "").replace("prior_treatment：", "").strip()
                for c in case.constraints
                if c.strip().lower().startswith("prior_treatment:")
            ]
        
        # Check constraints against contracts
        constraints_checked = self._check_constraints(case.constraints)
        violations = [
            check.violation for check in constraints_checked
            if check.violation is not None
        ]
        
        # Add inference nodes for constraint checks
        for i, check in enumerate(constraints_checked):
            trace.add_node(
                "inference",
                {
                    "type": "constraint_check",
                    "constraint": check.constraint,
                    "checked": check.checked,
                    "contract_matched": check.contract_matched,
                    "violation": check.violation
                },
                parents=[constraint_node_ids[i]] if i < len(constraint_node_ids) else []
            )
        
        # Build decision map
        decision_map = DecisionMap(
            constraints_checked=constraints_checked,
            violations=violations
        )
        
        # Check if physics results are available in context
        has_physics_results = context is not None and context.get("physics_results") is not None
        
        # Identify failure modes
        failure_modes = self._identify_failure_modes(case, has_physics_results, trace, constraint_node_ids, ledger, trace.run_id, propagator, uncertainty_map)
        
        # Add clinical failure modes when domain is spine_surgery
        if enriched_design_data:
            from .clinical_constraints import detect_clinical_failure_modes
            clinical_modes_raw = detect_clinical_failure_modes(enriched_design_data)
            for cm in clinical_modes_raw:
                epistemic = EpistemicWeight(
                    confidence=cm.get("epistemic_confidence", 0.6),
                    evidence_type="heuristic",
                    provenance=["clinical_failure_mode"],
                    requires_validation=True,
                )
                severity_label = cm.get("severity_label", "medium")
                severity_score = cm.get("severity_score", 5)
                rpn = cm.get("rpn", 50)
                detectability = 6
                failure_modes.append(
                    FailureMode(
                        mode=cm["mode"],
                        severity=severity_label,
                        category=FailureCategory.UNKNOWN,
                        detectability_score=detectability,
                        severity_detectability_product=severity_score * detectability,
                        likelihood=5,
                        severity_score=min(10, severity_score),
                        detectability_inverse=detectability,
                        risk_priority_number=min(1000, rpn),
                        mitigation=cm.get("description"),
                        epistemic=epistemic,
                    )
                )
        
        # Find contradictions
        contradictions = self._find_contradictions(case, has_physics_results, trace, constraint_node_ids, objective_node_ids, propagator, uncertainty_map)
        
        # Process uncertainties
        unknowns = self._process_uncertainties(case.uncertainties, has_physics_results, trace, uncertainty_node_ids, propagator, uncertainty_map)
        
        # Generate recommended experiments
        recommended_experiments = self._recommend_experiments(case, unknowns, has_physics_results, trace, constraint_node_ids, uncertainty_node_ids, propagator, uncertainty_map)
        
        # Generate falsification tests for high-severity outputs
        falsification_tests = []
        test_output_counter = 0
        
        # Generate tests for failure modes (especially high severity)
        for fm in failure_modes:
            if fm.severity in ["high", "critical"]:
                constraints_mentioned = []
                if fm.epistemic and fm.epistemic.provenance:
                    constraints_mentioned = [p.replace("constraint: ", "") for p in fm.epistemic.provenance if p.startswith("constraint:")]
                
                tests = falsification_engine.generate_tests_for_failure_mode(
                    mode=fm.mode,
                    severity=fm.severity,
                    mitigation=fm.mitigation or "",
                    constraints=constraints_mentioned,
                    output_id=f"failure_mode_{test_output_counter}"
                )
                falsification_tests.extend(tests)
                test_output_counter += 1
        
        # Generate tests for unknowns (especially critical impact)
        for unknown in unknowns:
            if unknown.impact in ["high", "critical"]:
                tests = falsification_engine.generate_tests_for_unknown(
                    item=unknown.item,
                    impact=unknown.impact,
                    resolution=unknown.resolution or "",
                    output_id=f"unknown_{test_output_counter}"
                )
                falsification_tests.extend(tests)
                test_output_counter += 1
        
        # Add clinical falsification tests when domain is spine_surgery
        if enriched_design_data:
            from .clinical_constraints import generate_clinical_falsifications
            from .falsification import FalsificationTest as FalsificationTestDataclass, TestType
            clinical_falsifications = generate_clinical_falsifications(enriched_design_data)
            for i, cf in enumerate(clinical_falsifications):
                falsification_tests.append(
                    FalsificationTestDataclass(
                        id=f"clinical_falsification_{i}",
                        target_claim=cf.get("would_disprove", cf.get("test", "")),
                        target_output_id="clinical_assumptions",
                        test_description=cf.get("test", ""),
                        test_type=TestType.EXPERT,
                        falsification_criterion=cf.get("would_disprove", ""),
                        confirmation_criterion=cf.get("evidence_basis", ""),
                        estimated_cost=cf.get("cost", "medium"),
                        estimated_time="days",
                        decision_impact=cf.get("would_disprove", ""),
                        priority=i + 1,
                        required_equipment=[],
                        required_expertise=[],
                    )
                )
        
        # Convert dataclass tests to Pydantic models
        from .schemas import FalsificationTest as FalsificationTestSchema
        falsification_test_schemas = [
            FalsificationTestSchema(
                id=t.id,
                target_claim=t.target_claim,
                target_output_id=t.target_output_id,
                test_description=t.test_description,
                test_type=t.test_type.value,
                falsification_criterion=t.falsification_criterion,
                confirmation_criterion=t.confirmation_criterion,
                estimated_cost=t.estimated_cost,
                estimated_time=t.estimated_time,
                decision_impact=t.decision_impact,
                priority=t.priority,
                required_equipment=t.required_equipment,
                required_expertise=t.required_expertise
            )
            for t in falsification_tests
        ]
        
        # Check formal constraints if design_data provided
        formal_constraint_results = []
        coverage_report = None
        coverage_score = None
        required_fields_missing = None
        
        if design_data:
            from .schemas import FormalConstraintResult as FormalConstraintResultSchema, CoverageReport as CoverageReportSchema
            if case.problem.domain == "spine_surgery":
                from .clinical_constraints import ClinicalConstraintChecker
                formal_checker = ClinicalConstraintChecker()
                formal_results = formal_checker.check_all(enriched_design_data or design_data)
            else:
                formal_checker = FormalConstraintChecker()
                formal_results = formal_checker.check_all(design_data)
            
            # Convert dataclass results to Pydantic models
            formal_constraint_results = [
                FormalConstraintResultSchema(
                    constraint_id=r.constraint_id,
                    constraint_name=r.constraint_name,
                    result=r.result.value,
                    value=r.value,
                    threshold=r.threshold,
                    margin=r.margin,
                    evidence=r.evidence,
                    confidence=r.confidence
                )
                for r in formal_results
            ]
            
            # Compute coverage report
            total_constraints = len(formal_results)
            evaluated_count = sum(1 for r in formal_results if r.result.value != "unknown")
            
            coverage_report_list = []
            missing_fields_set = set()
            
            for r in formal_results:
                evaluated = r.result.value != "unknown"
                reason_if_not = None
                
                if not evaluated:
                    # Extract missing field from evidence
                    evidence = r.evidence.lower()
                    if "not provided" in evidence or "missing" in evidence:
                        # Try to extract field name from evidence
                        if "total_mass" in evidence:
                            missing_fields_set.add("total_mass_kg")
                        elif "force" in evidence:
                            missing_fields_set.add("max_force_n")
                        elif "acceleration" in evidence:
                            missing_fields_set.add("max_acceleration_mps2")
                        elif "clearance" in evidence:
                            missing_fields_set.add("min_clearance_mm")
                        elif "parts" in evidence or "tolerance" in evidence:
                            missing_fields_set.add("parts")
                        elif "thermal" in evidence or "temperature" in evidence:
                            missing_fields_set.add("operating_temp_c")
                        elif "assembly" in evidence:
                            missing_fields_set.add("assembly_stages")
                        elif "trajectory" in evidence:
                            missing_fields_set.add("trajectory_clearances")
                        elif "backlash" in evidence:
                            missing_fields_set.add("backlash_per_cycle_mm")
                        elif "passage" in evidence or "width" in evidence:
                            missing_fields_set.add("min_passage_width_mm")
                        elif "ik" in evidence or "reachability" in evidence:
                            missing_fields_set.add("ik_feasible")
                        elif "gap" in evidence:
                            missing_fields_set.add("initial_gap_mm")
                        elif "drift" in evidence:
                            missing_fields_set.add("drift_per_cycle_mm")
                        
                        reason_if_not = f"missing field: {r.evidence}"
                    else:
                        reason_if_not = r.evidence
                
                coverage_report_list.append(
                    CoverageReportSchema(
                        constraint_id=r.constraint_id,
                        constraint_name=r.constraint_name,
                        evaluated=evaluated,
                        reason_if_not=reason_if_not
                    )
                )
            
            coverage_report = coverage_report_list
            coverage_score = (evaluated_count / total_constraints * 100) if total_constraints > 0 else 0.0
            required_fields_missing = sorted(list(missing_fields_set))
        
        # Sort failure modes by RPN descending (highest risk first)
        failure_modes_sorted = sorted(failure_modes, key=lambda fm: fm.risk_priority_number, reverse=True)
        
        return DecisionAnalysis(
            decision_map=decision_map,
            failure_modes=failure_modes_sorted,
            contradictions=contradictions,
            unknowns=unknowns,
            recommended_experiments=recommended_experiments,
            falsification_tests=falsification_test_schemas,
            formal_constraints=formal_constraint_results,
            trace_graph=trace.to_dict(),
            coverage_report=coverage_report,
            coverage_score=coverage_score,
            required_fields_missing=required_fields_missing
        )
    
    def _check_constraints(self, constraints: List[str]) -> List[ConstraintCheck]:
        """Check each constraint against contracts."""
        results = []
        
        for constraint in constraints:
            relevant_contracts = self.contract_loader.find_relevant_contracts(constraint)
            violation = self.contract_loader.check_constraint_violation(constraint)
            
            contract_matched = relevant_contracts[0] if relevant_contracts else None
            
            results.append(ConstraintCheck(
                constraint=constraint,
                checked=True,
                contract_matched=contract_matched,
                violation=violation
            ))
        
        return results
    
    def _identify_failure_modes(self, case: CaseInput, has_physics_results: bool = False, trace: DecisionTraceGraph = None, constraint_node_ids: List[str] = None, ledger: Optional[OutcomeLedger] = None, run_id: str = None, propagator: UncertaintyPropagator = None, uncertainty_map: Dict[str, str] = None) -> List[FailureMode]:
        """Identify potential failure modes from constraints and objectives."""
        failure_modes = []
        constraint_node_ids = constraint_node_ids or []
        
        # Check for slip-related constraints
        slip_constraints = [c for c in case.constraints if 'slip' in c.lower()]
        if slip_constraints:
            slip_indices = [i for i, c in enumerate(case.constraints) if 'slip' in c.lower()]
            slip_parent_ids = [constraint_node_ids[i] for i in slip_indices if i < len(constraint_node_ids)]
            
            base_confidence = 0.8 if has_physics_results else 0.4
            epistemic = EpistemicWeight(
                confidence=base_confidence,
                evidence_type="physics_derived" if has_physics_results else "heuristic",
                provenance=[f"constraint: {c}" for c in slip_constraints],
                requires_validation=not has_physics_results
            )
            
            # Compute conditional confidence based on uncertainties
            conditional_conf = None
            if propagator and uncertainty_map:
                # Extract uncertainty IDs from provenance
                uncertainty_ids = []
                for u_str, u_id in uncertainty_map.items():
                    # Check if this uncertainty is mentioned in provenance
                    if any(u_str.lower() in prov.lower() for prov in epistemic.provenance):
                        uncertainty_ids.append(u_id)
                
                if uncertainty_ids:
                    conditional_conf_dict = propagator.compute_conditional_confidence(base_confidence, uncertainty_ids)
                    conditional_conf = ConditionalConfidence(**conditional_conf_dict.__dict__)
                    propagator.link_output_to_uncertainty(f"failure_mode_{len(failure_modes)}", uncertainty_ids)
            
            category = self._categorize_failure("slip_under_load")
            detectability = self._compute_detectability("slip_under_load", category)
            severity_detectability = self._compute_severity_detectability_product("high", detectability)
            likelihood = self._compute_likelihood("slip_under_load", category, slip_constraints)
            severity_score = self._compute_severity_score("high")
            detectability_inverse = self._compute_detectability_inverse(detectability)
            rpn = self._compute_rpn(severity_score, likelihood, detectability_inverse)
            
            failure_mode = FailureMode(
                mode="slip_under_load",
                severity="high",
                category=category,
                detectability_score=detectability,
                severity_detectability_product=severity_detectability,
                likelihood=likelihood,
                severity_score=severity_score,
                detectability_inverse=detectability_inverse,
                risk_priority_number=rpn,
                mitigation="increase_friction_coefficient",
                epistemic=epistemic,
                conditional_confidence=conditional_conf
            )
            failure_modes.append(failure_mode)
            
            if trace:
                trace.add_node(
                    "output",
                    {
                        "type": "failure_mode",
                        "mode": failure_mode.mode,
                        "severity": failure_mode.severity,
                        "mitigation": failure_mode.mitigation
                    },
                    parents=slip_parent_ids,
                    metadata={"epistemic": failure_mode.epistemic.dict() if failure_mode.epistemic else None}
                )
            
            # Record prediction in ledger if provided
            if ledger and run_id:
                confidence = failure_mode.epistemic.confidence if failure_mode.epistemic else 0.5
                ledger.record_prediction(
                    run_id=run_id,
                    prediction_type="failure_mode",
                    content={
                        "mode": failure_mode.mode,
                        "severity": failure_mode.severity,
                        "mitigation": failure_mode.mitigation,
                        "constraints": slip_constraints
                    },
                    confidence=confidence
                )
        
        # Check for force-related constraints
        force_constraints = [c for c in case.constraints if 'force' in c.lower()]
        if force_constraints:
            force_indices = [i for i, c in enumerate(case.constraints) if 'force' in c.lower()]
            force_parent_ids = [constraint_node_ids[i] for i in force_indices if i < len(constraint_node_ids)]
            
            base_confidence = 0.8 if has_physics_results else 0.4
            epistemic = EpistemicWeight(
                confidence=base_confidence,
                evidence_type="physics_derived" if has_physics_results else "heuristic",
                provenance=[f"constraint: {c}" for c in force_constraints],
                requires_validation=not has_physics_results
            )
            
            # Compute conditional confidence based on uncertainties
            conditional_conf = None
            if propagator and uncertainty_map:
                uncertainty_ids = []
                for u_str, u_id in uncertainty_map.items():
                    if any(u_str.lower() in prov.lower() for prov in epistemic.provenance):
                        uncertainty_ids.append(u_id)
                
                if uncertainty_ids:
                    conditional_conf_dict = propagator.compute_conditional_confidence(base_confidence, uncertainty_ids)
                    conditional_conf = ConditionalConfidence(**conditional_conf_dict.__dict__)
                    propagator.link_output_to_uncertainty(f"failure_mode_{len(failure_modes)}", uncertainty_ids)
            
            category = self._categorize_failure("excessive_force_damage")
            detectability = self._compute_detectability("excessive_force_damage", category)
            severity_detectability = self._compute_severity_detectability_product("medium", detectability)
            likelihood = self._compute_likelihood("excessive_force_damage", category, force_constraints)
            severity_score = self._compute_severity_score("medium")
            detectability_inverse = self._compute_detectability_inverse(detectability)
            rpn = self._compute_rpn(severity_score, likelihood, detectability_inverse)
            
            failure_mode = FailureMode(
                mode="excessive_force_damage",
                severity="medium",
                category=category,
                detectability_score=detectability,
                severity_detectability_product=severity_detectability,
                likelihood=likelihood,
                severity_score=severity_score,
                detectability_inverse=detectability_inverse,
                risk_priority_number=rpn,
                mitigation="implement_force_limiting_control",
                epistemic=epistemic,
                conditional_confidence=conditional_conf
            )
            failure_modes.append(failure_mode)
            
            if trace:
                trace.add_node(
                    "output",
                    {
                        "type": "failure_mode",
                        "mode": failure_mode.mode,
                        "severity": failure_mode.severity,
                        "mitigation": failure_mode.mitigation
                    },
                    parents=force_parent_ids,
                    metadata={"epistemic": failure_mode.epistemic.dict() if failure_mode.epistemic else None}
                )
            
            # Record prediction in ledger if provided
            if ledger and run_id:
                confidence = failure_mode.epistemic.confidence if failure_mode.epistemic else 0.5
                ledger.record_prediction(
                    run_id=run_id,
                    prediction_type="failure_mode",
                    content={
                        "mode": failure_mode.mode,
                        "severity": failure_mode.severity,
                        "mitigation": failure_mode.mitigation,
                        "constraints": force_constraints
                    },
                    confidence=confidence
                )
        
        # Check for biocompatibility constraints
        biocompat_constraints = [c for c in case.constraints if 'biocompatible' in c.lower()]
        if biocompat_constraints:
            biocompat_indices = [i for i, c in enumerate(case.constraints) if 'biocompatible' in c.lower()]
            biocompat_parent_ids = [constraint_node_ids[i] for i in biocompat_indices if i < len(constraint_node_ids)]
            
            base_confidence = 0.8 if has_physics_results else 0.4
            epistemic = EpistemicWeight(
                confidence=base_confidence,
                evidence_type="physics_derived" if has_physics_results else "heuristic",
                provenance=[f"constraint: {c}" for c in biocompat_constraints],
                requires_validation=not has_physics_results
            )
            
            # Compute conditional confidence based on uncertainties
            conditional_conf = None
            if propagator and uncertainty_map:
                uncertainty_ids = []
                for u_str, u_id in uncertainty_map.items():
                    if any(u_str.lower() in prov.lower() for prov in epistemic.provenance):
                        uncertainty_ids.append(u_id)
                
                if uncertainty_ids:
                    conditional_conf_dict = propagator.compute_conditional_confidence(base_confidence, uncertainty_ids)
                    conditional_conf = ConditionalConfidence(**conditional_conf_dict.__dict__)
                    propagator.link_output_to_uncertainty(f"failure_mode_{len(failure_modes)}", uncertainty_ids)
            
            category = self._categorize_failure("material_degradation")
            detectability = self._compute_detectability("material_degradation", category)
            severity_detectability = self._compute_severity_detectability_product("high", detectability)
            likelihood = self._compute_likelihood("material_degradation", category, biocompat_constraints)
            severity_score = self._compute_severity_score("high")
            detectability_inverse = self._compute_detectability_inverse(detectability)
            rpn = self._compute_rpn(severity_score, likelihood, detectability_inverse)
            
            failure_mode = FailureMode(
                mode="material_degradation",
                severity="high",
                category=category,
                detectability_score=detectability,
                severity_detectability_product=severity_detectability,
                likelihood=likelihood,
                severity_score=severity_score,
                detectability_inverse=detectability_inverse,
                risk_priority_number=rpn,
                mitigation="verify_material_certification",
                epistemic=epistemic,
                conditional_confidence=conditional_conf
            )
            failure_modes.append(failure_mode)
            
            if trace:
                trace.add_node(
                    "output",
                    {
                        "type": "failure_mode",
                        "mode": failure_mode.mode,
                        "severity": failure_mode.severity,
                        "mitigation": failure_mode.mitigation
                    },
                    parents=biocompat_parent_ids,
                    metadata={"epistemic": failure_mode.epistemic.dict() if failure_mode.epistemic else None}
                )
            
            # Record prediction in ledger if provided
            if ledger and run_id:
                confidence = failure_mode.epistemic.confidence if failure_mode.epistemic else 0.5
                ledger.record_prediction(
                    run_id=run_id,
                    prediction_type="failure_mode",
                    content={
                        "mode": failure_mode.mode,
                        "severity": failure_mode.severity,
                        "mitigation": failure_mode.mitigation,
                        "constraints": biocompat_constraints
                    },
                    confidence=confidence
                )
        
        return failure_modes
    
    def _find_contradictions(self, case: CaseInput, has_physics_results: bool = False, trace: DecisionTraceGraph = None, constraint_node_ids: List[str] = None, objective_node_ids: List[str] = None, propagator: UncertaintyPropagator = None, uncertainty_map: Dict[str, str] = None) -> List[Contradiction]:
        """Find contradictions between constraints and objectives."""
        contradictions = []
        constraint_node_ids = constraint_node_ids or []
        objective_node_ids = objective_node_ids or []
        provenance_items = []
        
        # Check for force vs grip tension contradiction
        force_limit_constraints = [c for c in case.constraints if 'force' in c.lower() and 'max' in c.lower()]
        grip_objectives = [o for o in case.objectives if 'grip' in o.lower()]
        
        if force_limit_constraints and grip_objectives:
            provenance_items = [f"constraint: {c}" for c in force_limit_constraints]
            provenance_items.extend([f"objective: {o}" for o in grip_objectives])
            
            force_indices = [i for i, c in enumerate(case.constraints) if 'force' in c.lower() and 'max' in c.lower()]
            grip_indices = [i for i, o in enumerate(case.objectives) if 'grip' in o.lower()]
            parent_ids = [constraint_node_ids[i] for i in force_indices if i < len(constraint_node_ids)]
            parent_ids.extend([objective_node_ids[i] for i in grip_indices if i < len(objective_node_ids)])
            
            base_confidence = 0.8 if has_physics_results else 0.4
            epistemic = EpistemicWeight(
                confidence=base_confidence,
                evidence_type="physics_derived" if has_physics_results else "rule_derived",
                provenance=provenance_items,
                requires_validation=not has_physics_results
            )
            
            # Compute conditional confidence based on uncertainties
            conditional_conf = None
            if propagator and uncertainty_map:
                uncertainty_ids = []
                for u_str, u_id in uncertainty_map.items():
                    if any(u_str.lower() in prov.lower() for prov in provenance_items):
                        uncertainty_ids.append(u_id)
                
                if uncertainty_ids:
                    conditional_conf_dict = propagator.compute_conditional_confidence(base_confidence, uncertainty_ids)
                    conditional_conf = ConditionalConfidence(**conditional_conf_dict.__dict__)
                    propagator.link_output_to_uncertainty(f"contradiction_{len(contradictions)}", uncertainty_ids)
            
            contradiction = Contradiction(
                description="max_force vs adequate_grip tension",
                epistemic=epistemic,
                conditional_confidence=conditional_conf
            )
            contradictions.append(contradiction)
            
            if trace:
                trace.add_node(
                    "output",
                    {
                        "type": "contradiction",
                        "description": contradiction.description
                    },
                    parents=parent_ids,
                    metadata={"epistemic": contradiction.epistemic.dict() if contradiction.epistemic else None}
                )
        
        # Check for safety vs performance contradictions
        has_safety_constraint = any('safe' in c.lower() or 'must_not' in c.lower() for c in case.constraints)
        has_performance_objective = any('adequate' in o.lower() or 'minimal' in o.lower() for o in case.objectives)
        
        if has_safety_constraint and has_performance_objective:
            # This is more of a trade-off than contradiction, but flag it
            pass
        
        return contradictions
    
    def _process_uncertainties(self, uncertainties: List[str], has_physics_results: bool = False, trace: DecisionTraceGraph = None, uncertainty_node_ids: List[str] = None, propagator: UncertaintyPropagator = None, uncertainty_map: Dict[str, str] = None) -> List[Unknown]:
        """Process uncertainties and assess their impact."""
        unknowns = []
        uncertainty_node_ids = uncertainty_node_ids or []
        
        for idx, uncertainty in enumerate(uncertainties):
            impact = "medium"  # Default
            
            # Assess impact based on keywords
            if 'compliance' in uncertainty.lower():
                impact = "critical"
                resolution = "bench_test_required"
            elif 'sterilization' in uncertainty.lower():
                impact = "high"
                resolution = "sterilization_cycle_testing"
            elif 'unknown_range' in uncertainty.lower():
                impact = "high"
                resolution = "characterization_study_required"
            else:
                resolution = "investigation_required"
            
            parent_id = uncertainty_node_ids[idx] if idx < len(uncertainty_node_ids) else None
            parent_ids = [parent_id] if parent_id else []
            
            base_confidence = 0.8 if has_physics_results else 0.4
            epistemic = EpistemicWeight(
                confidence=base_confidence,
                evidence_type="physics_derived" if has_physics_results else "heuristic",
                provenance=[f"uncertainty: {uncertainty}"],
                requires_validation=not has_physics_results
            )
            
            # Compute conditional confidence - unknowns depend on themselves
            conditional_conf = None
            if propagator and uncertainty_map and uncertainty in uncertainty_map:
                uncertainty_id = uncertainty_map[uncertainty]
                conditional_conf_dict = propagator.compute_conditional_confidence(base_confidence, [uncertainty_id])
                conditional_conf = ConditionalConfidence(**conditional_conf_dict.__dict__)
                propagator.link_output_to_uncertainty(f"unknown_{len(unknowns)}", [uncertainty_id])
            
            unknown = Unknown(
                item=uncertainty,
                impact=impact,
                resolution=resolution,
                epistemic=epistemic,
                conditional_confidence=conditional_conf
            )
            unknowns.append(unknown)
            
            if trace:
                trace.add_node(
                    "output",
                    {
                        "type": "unknown",
                        "item": unknown.item,
                        "impact": unknown.impact,
                        "resolution": unknown.resolution
                    },
                    parents=parent_ids,
                    metadata={"epistemic": unknown.epistemic.dict() if unknown.epistemic else None}
                )
        
        return unknowns
    
    def _recommend_experiments(self, case: CaseInput, unknowns: List[Unknown], has_physics_results: bool = False, trace: DecisionTraceGraph = None, constraint_node_ids: List[str] = None, uncertainty_node_ids: List[str] = None, propagator: UncertaintyPropagator = None, uncertainty_map: Dict[str, str] = None) -> List[RecommendedExperiment]:
        """Generate recommended experiments based on case and unknowns."""
        experiments = []
        constraint_node_ids = constraint_node_ids or []
        uncertainty_node_ids = uncertainty_node_ids or []
        provenance_items = []
        
        # Force-related experiments
        force_constraints = [c for c in case.constraints if 'force' in c.lower()]
        if force_constraints:
            provenance_items = [f"constraint: {c}" for c in force_constraints]
            force_indices = [i for i, c in enumerate(case.constraints) if 'force' in c.lower()]
            parent_ids = [constraint_node_ids[i] for i in force_indices if i < len(constraint_node_ids)]
            
            experiment = RecommendedExperiment(
                name="force_limit_characterization",
                epistemic=EpistemicWeight(
                    confidence=0.8 if has_physics_results else 0.4,
                    evidence_type="physics_derived" if has_physics_results else "rule_derived",
                    provenance=provenance_items,
                    requires_validation=not has_physics_results
                )
            )
            experiments.append(experiment)
            
            if trace:
                trace.add_node(
                    "output",
                    {
                        "type": "recommended_experiment",
                        "name": experiment.name
                    },
                    parents=parent_ids,
                    metadata={"epistemic": experiment.epistemic.dict() if experiment.epistemic else None}
                )
        
        # Sterilization experiments
        sterilization_uncertainties = [u for u in case.uncertainties if 'sterilization' in u.lower()]
        if sterilization_uncertainties:
            provenance_items = [f"uncertainty: {u}" for u in sterilization_uncertainties]
            sterilization_indices = [i for i, u in enumerate(case.uncertainties) if 'sterilization' in u.lower()]
            parent_ids = [uncertainty_node_ids[i] for i in sterilization_indices if i < len(uncertainty_node_ids)]
            
            experiment = RecommendedExperiment(
                name="sterilization_cycle_testing",
                epistemic=EpistemicWeight(
                    confidence=0.8 if has_physics_results else 0.4,
                    evidence_type="physics_derived" if has_physics_results else "rule_derived",
                    provenance=provenance_items,
                    requires_validation=not has_physics_results
                )
            )
            experiments.append(experiment)
            
            if trace:
                trace.add_node(
                    "output",
                    {
                        "type": "recommended_experiment",
                        "name": experiment.name
                    },
                    parents=parent_ids,
                    metadata={"epistemic": experiment.epistemic.dict() if experiment.epistemic else None}
                )
        
        # Tissue compliance experiments
        compliance_uncertainties = [u for u in case.uncertainties if 'compliance' in u.lower()]
        if compliance_uncertainties:
            provenance_items = [f"uncertainty: {u}" for u in compliance_uncertainties]
            compliance_indices = [i for i, u in enumerate(case.uncertainties) if 'compliance' in u.lower()]
            parent_ids = [uncertainty_node_ids[i] for i in compliance_indices if i < len(uncertainty_node_ids)]
            
            experiment = RecommendedExperiment(
                name="tissue_compliance_bench_test",
                epistemic=EpistemicWeight(
                    confidence=0.8 if has_physics_results else 0.4,
                    evidence_type="physics_derived" if has_physics_results else "rule_derived",
                    provenance=provenance_items,
                    requires_validation=not has_physics_results
                )
            )
            experiments.append(experiment)
            
            if trace:
                trace.add_node(
                    "output",
                    {
                        "type": "recommended_experiment",
                        "name": experiment.name
                    },
                    parents=parent_ids,
                    metadata={"epistemic": experiment.epistemic.dict() if experiment.epistemic else None}
                )
        
        return experiments
