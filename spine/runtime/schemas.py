"""Pydantic schemas for Spine Decision Runtime input and output."""

from typing import List, Optional, Literal, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field


class FailureCategory(str, Enum):
    """Taxonomy of failure modes."""
    MECHANICAL = "mechanical"
    THERMAL = "thermal"
    CONTROL = "control"
    MATERIAL = "material"
    GEOMETRIC = "geometric"
    SENSING = "sensing"
    INTERACTION = "interaction"
    UNKNOWN = "unknown"


class ProblemDefinition(BaseModel):
    """Problem definition from case.yaml"""
    name: str = Field(..., description="Problem name")
    domain: str = Field(..., description="Problem domain")


class CaseInput(BaseModel):
    """Input schema for case.yaml"""
    problem: ProblemDefinition
    constraints: List[str] = Field(default_factory=list, description="List of constraints")
    uncertainties: List[str] = Field(default_factory=list, description="List of uncertainties")
    objectives: List[str] = Field(default_factory=list, description="List of objectives")


class ConstraintCheck(BaseModel):
    """Result of checking a constraint against contracts"""
    constraint: str
    checked: bool
    contract_matched: Optional[str] = None
    violation: Optional[str] = None


class EpistemicWeight(BaseModel):
    """Epistemic weighting metadata for analysis outputs"""
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence level 0.0-1.0")
    evidence_type: Literal["physics_derived", "rule_derived", "heuristic"] = Field(
        ..., description="Type of evidence supporting this output"
    )
    provenance: List[str] = Field(
        default_factory=list, description="List of input sources that led to this output"
    )
    requires_validation: bool = Field(
        default=False, description="Whether this output requires validation"
    )


class ConditionalConfidence(BaseModel):
    """Confidence band that varies with uncertainty"""
    base_confidence: float = Field(..., ge=0.0, le=1.0, description="Base confidence level")
    min_confidence: float = Field(..., ge=0.0, le=1.0, description="Minimum confidence in band")
    max_confidence: float = Field(..., ge=0.0, le=1.0, description="Maximum confidence in band")
    sensitivity: float = Field(..., ge=0.0, le=1.0, description="Sensitivity to uncertainty (0-1)")
    dependent_on: List[str] = Field(
        default_factory=list, description="Uncertainty IDs this output depends on"
    )


class FailureMode(BaseModel):
    """Identified failure mode"""
    mode: str = Field(..., description="Failure mode identifier")
    severity: str = Field(..., description="Severity level: low, medium, high, critical")
    category: FailureCategory = Field(default=FailureCategory.UNKNOWN, description="Failure category taxonomy")
    detectability_score: int = Field(default=5, ge=1, le=10, description="Detectability score (1=easy to detect, 10=nearly invisible)")
    severity_detectability_product: int = Field(default=0, description="Severity × detectability (higher = higher priority)")
    # RPN (Risk Priority Number) fields
    likelihood: int = Field(default=5, ge=1, le=10, description="Likelihood of occurrence (1=rare, 10=almost certain)")
    severity_score: int = Field(default=5, ge=1, le=10, description="Severity score (1=minor, 10=catastrophic)")
    detectability_inverse: int = Field(default=5, ge=1, le=10, description="Detectability inverse (1=easy to detect, 10=hard to detect)")
    risk_priority_number: int = Field(default=125, ge=1, le=1000, description="RPN = severity_score × likelihood × detectability_inverse")
    mitigation: Optional[str] = Field(None, description="Suggested mitigation")
    epistemic: Optional[EpistemicWeight] = Field(None, description="Epistemic weighting metadata")
    conditional_confidence: Optional[ConditionalConfidence] = Field(None, description="Confidence band accounting for uncertainty")


class Contradiction(BaseModel):
    """Identified contradiction between constraints/objectives"""
    description: str = Field(..., description="Description of the contradiction")
    epistemic: Optional[EpistemicWeight] = Field(None, description="Epistemic weighting metadata")
    conditional_confidence: Optional[ConditionalConfidence] = Field(None, description="Confidence band accounting for uncertainty")


class Unknown(BaseModel):
    """Uncertainty that needs resolution"""
    item: str = Field(..., description="Uncertainty identifier")
    impact: str = Field(..., description="Impact level: low, medium, high, critical")
    resolution: Optional[str] = Field(None, description="Suggested resolution approach")
    epistemic: Optional[EpistemicWeight] = Field(None, description="Epistemic weighting metadata")
    conditional_confidence: Optional[ConditionalConfidence] = Field(None, description="Confidence band accounting for uncertainty")


class RecommendedExperiment(BaseModel):
    """Recommended experiment to resolve uncertainty"""
    name: str = Field(..., description="Experiment name")
    epistemic: Optional[EpistemicWeight] = Field(None, description="Epistemic weighting metadata")


class FalsificationTest(BaseModel):
    """A test that could disprove a claim"""
    id: str = Field(..., description="Test identifier")
    target_claim: str = Field(..., description="What we're trying to falsify")
    target_output_id: str = Field(..., description="ID of the output being tested")
    test_description: str = Field(..., description="What to do")
    test_type: Literal["bench", "simulation", "expert", "literature", "measurement"] = Field(
        ..., description="Type of test"
    )
    falsification_criterion: str = Field(..., description="What result would disprove the claim")
    confirmation_criterion: str = Field(..., description="What result would confirm the claim")
    estimated_cost: Literal["low", "medium", "high"] = Field(..., description="Estimated cost")
    estimated_time: Literal["hours", "days", "weeks"] = Field(..., description="Estimated time")
    decision_impact: str = Field(..., description="What changes if falsified")
    priority: int = Field(..., description="Priority (1=highest)")
    required_equipment: List[str] = Field(default_factory=list, description="Required equipment")
    required_expertise: List[str] = Field(default_factory=list, description="Required expertise")


class FormalConstraintResult(BaseModel):
    """Result of checking a formal constraint"""
    constraint_id: str = Field(..., description="Constraint identifier")
    constraint_name: str = Field(..., description="Constraint name")
    result: Literal["proven_satisfied", "proven_violated", "unknown"] = Field(
        ..., description="Check result"
    )
    value: Optional[float] = Field(None, description="Actual value if measurable")
    threshold: Optional[float] = Field(None, description="Threshold being checked")
    margin: Optional[float] = Field(None, description="Margin (positive = satisfied)")
    evidence: str = Field(..., description="Explanation")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence (1.0 = proven)")


class DecisionMap(BaseModel):
    """Decision map output"""
    constraints_checked: List[ConstraintCheck] = Field(default_factory=list)
    violations: List[str] = Field(default_factory=list)


class CoverageReport(BaseModel):
    """Coverage report for constraint evaluation."""
    constraint_id: str
    constraint_name: str
    evaluated: bool
    reason_if_not: Optional[str] = None


class DecisionAnalysis(BaseModel):
    """Complete decision analysis output"""
    decision_map: DecisionMap
    failure_modes: List[FailureMode] = Field(default_factory=list)
    contradictions: List[Contradiction] = Field(default_factory=list)
    unknowns: List[Unknown] = Field(default_factory=list)
    recommended_experiments: List[RecommendedExperiment] = Field(default_factory=list)
    falsification_tests: List[FalsificationTest] = Field(default_factory=list, description="Tests to falsify claims")
    formal_constraints: List[FormalConstraintResult] = Field(default_factory=list, description="Formal constraint check results")
    trace_graph: Optional[Dict] = Field(None, description="Decision trace graph for reasoning chains")
    coverage_report: Optional[List[CoverageReport]] = Field(None, description="Coverage report for constraint evaluation")
    coverage_score: Optional[float] = Field(None, description="Coverage score as percentage")
    required_fields_missing: Optional[List[str]] = Field(None, description="Aggregated list of missing fields")
