"""Falsification engine - generates tests to disprove claims."""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum


class TestType(Enum):
    """Types of falsification tests."""
    BENCH = "bench"           # Lab bench test
    SIMULATION = "simulation" # Additional simulation
    EXPERT = "expert"         # Expert review/adjudication
    LITERATURE = "literature" # Literature search
    MEASUREMENT = "measurement" # Direct measurement


@dataclass
class FalsificationTest:
    """A test that could disprove a claim."""
    id: str
    target_claim: str           # What we're trying to falsify
    target_output_id: str       # ID of the output being tested
    
    test_description: str       # What to do
    test_type: TestType
    
    falsification_criterion: str  # What result would disprove the claim
    confirmation_criterion: str   # What result would confirm the claim
    
    estimated_cost: str         # "low", "medium", "high"
    estimated_time: str         # "hours", "days", "weeks"
    
    decision_impact: str        # What changes if falsified
    priority: int               # 1=highest priority
    
    required_equipment: List[str] = field(default_factory=list)
    required_expertise: List[str] = field(default_factory=list)


class FalsificationEngine:
    """Generates falsification tests for analysis outputs."""
    
    def __init__(self):
        self.tests: List[FalsificationTest] = []
        self._test_counter = 0
    
    def generate_tests_for_failure_mode(
        self,
        mode: str,
        severity: str,
        mitigation: str,
        constraints: List[str],
        output_id: str
    ) -> List[FalsificationTest]:
        """
        Generate falsification tests for a failure mode.
        
        Args:
            mode: Failure mode identifier
            severity: Severity level
            mitigation: Suggested mitigation
            constraints: Related constraints
            output_id: ID of the output being tested
            
        Returns:
            List of falsification tests
        """
        tests = []
        
        # Pattern matching for common failure modes
        if "slip" in mode.lower():
            tests.append(self._create_test(
                target_claim=f"Gripper will slip under load ({mode})",
                target_output_id=output_id,
                test_description="Apply increasing normal force until slip occurs. Measure slip threshold.",
                test_type=TestType.BENCH,
                falsification_criterion="No slip observed up to 150% of expected operating force",
                confirmation_criterion="Slip occurs below expected operating force",
                estimated_cost="low",
                estimated_time="hours",
                decision_impact="If falsified: remove slip_under_load from risks. If confirmed: redesign friction surfaces.",
                priority=1 if severity == "high" else 2,
                required_equipment=["force gauge", "test fixture", "representative surface"],
                required_expertise=["mechanical testing"]
            ))
        
        if "force" in mode.lower() or "damage" in mode.lower():
            tests.append(self._create_test(
                target_claim=f"Excessive force causes damage ({mode})",
                target_output_id=output_id,
                test_description="Apply gripper to tissue phantom at rated force. Inspect for damage markers.",
                test_type=TestType.BENCH,
                falsification_criterion="No damage markers at 120% rated force",
                confirmation_criterion="Visible damage at or below rated force",
                estimated_cost="medium",
                estimated_time="days",
                decision_impact="If falsified: increase force limit. If confirmed: implement force limiting.",
                priority=1 if severity == "high" else 2,
                required_equipment=["tissue phantom", "force-controlled actuator", "microscope"],
                required_expertise=["biomechanics", "materials testing"]
            ))
        
        if "material" in mode.lower() or "degradation" in mode.lower():
            tests.append(self._create_test(
                target_claim=f"Material will degrade ({mode})",
                target_output_id=output_id,
                test_description="Accelerated aging test: expose material to sterilization cycles and measure property changes.",
                test_type=TestType.BENCH,
                falsification_criterion="<5% property change after 100 equivalent cycles",
                confirmation_criterion=">10% property change within 50 cycles",
                estimated_cost="medium",
                estimated_time="weeks",
                decision_impact="If falsified: material approved. If confirmed: select alternative material.",
                priority=2,
                required_equipment=["autoclave", "tensile tester", "material samples"],
                required_expertise=["materials science", "sterilization validation"]
            ))
        
        if "compliance" in mode.lower() or "stiffness" in mode.lower():
            tests.append(self._create_test(
                target_claim=f"Compliance is unknown ({mode})",
                target_output_id=output_id,
                test_description="Measure force-displacement curve on representative tissue samples.",
                test_type=TestType.MEASUREMENT,
                falsification_criterion="Compliance measured with <10% uncertainty",
                confirmation_criterion="Compliance varies >50% across samples",
                estimated_cost="medium",
                estimated_time="days",
                decision_impact="If measured: update model with real values. If high variance: design for worst case.",
                priority=1,
                required_equipment=["indentation tester", "tissue samples", "environmental chamber"],
                required_expertise=["tissue mechanics"]
            ))
        
        # Generic test for any unmatched failure mode
        if not tests:
            tests.append(self._create_test(
                target_claim=f"Failure mode: {mode}",
                target_output_id=output_id,
                test_description=f"Expert review of {mode} risk assessment",
                test_type=TestType.EXPERT,
                falsification_criterion="Expert consensus: risk is overstated",
                confirmation_criterion="Expert consensus: risk is understated or accurate",
                estimated_cost="low",
                estimated_time="days",
                decision_impact=f"Adjust severity rating for {mode}",
                priority=3,
                required_equipment=[],
                required_expertise=["domain expert"]
            ))
        
        self.tests.extend(tests)
        return tests
    
    def generate_tests_for_unknown(
        self,
        item: str,
        impact: str,
        resolution: str,
        output_id: str
    ) -> List[FalsificationTest]:
        """
        Generate tests to resolve an unknown.
        
        Args:
            item: Unknown item identifier
            impact: Impact level
            resolution: Suggested resolution approach
            output_id: ID of the output being tested
            
        Returns:
            List of falsification tests
        """
        tests = []
        
        # The "falsification" of an unknown is determining its actual value
        tests.append(self._create_test(
            target_claim=f"Unknown: {item}",
            target_output_id=output_id,
            test_description=resolution if resolution else f"Investigate: {item}",
            test_type=TestType.MEASUREMENT if "range" in item.lower() else TestType.BENCH,
            falsification_criterion=f"Value of {item.split(':')[0]} determined with acceptable precision",
            confirmation_criterion=f"Unable to determine {item.split(':')[0]} - remains unknown",
            estimated_cost="medium" if impact == "critical" else "low",
            estimated_time="days" if impact == "critical" else "hours",
            decision_impact=f"Resolving {item} will narrow confidence bands on dependent outputs",
            priority=1 if impact == "critical" else 2,
            required_equipment=[],
            required_expertise=["domain expert"]
        ))
        
        self.tests.extend(tests)
        return tests
    
    def _create_test(self, **kwargs) -> FalsificationTest:
        """
        Create a test with auto-generated ID.
        
        Args:
            **kwargs: Test parameters
            
        Returns:
            FalsificationTest with generated ID
        """
        self._test_counter += 1
        return FalsificationTest(
            id=f"FALS_{self._test_counter:04d}",
            **kwargs
        )
    
    def get_prioritized_tests(self) -> List[FalsificationTest]:
        """
        Return tests sorted by priority.
        
        Returns:
            List of tests sorted by priority (1=highest)
        """
        return sorted(self.tests, key=lambda t: t.priority)
    
    def get_cheapest_tests(self, n: int = 5) -> List[FalsificationTest]:
        """
        Return the N cheapest tests.
        
        Args:
            n: Number of tests to return
            
        Returns:
            List of N cheapest tests
        """
        cost_order = {"low": 0, "medium": 1, "high": 2}
        return sorted(self.tests, key=lambda t: cost_order.get(t.estimated_cost, 3))[:n]
    
    def to_dict(self) -> Dict:
        """
        Serialize all tests.
        
        Returns:
            Dictionary representation of all tests and summary
        """
        return {
            "tests": [
                {
                    "id": t.id,
                    "target_claim": t.target_claim,
                    "target_output_id": t.target_output_id,
                    "test_description": t.test_description,
                    "test_type": t.test_type.value,
                    "falsification_criterion": t.falsification_criterion,
                    "confirmation_criterion": t.confirmation_criterion,
                    "estimated_cost": t.estimated_cost,
                    "estimated_time": t.estimated_time,
                    "decision_impact": t.decision_impact,
                    "priority": t.priority,
                    "required_equipment": t.required_equipment,
                    "required_expertise": t.required_expertise
                }
                for t in self.tests
            ],
            "summary": {
                "total_tests": len(self.tests),
                "by_priority": {
                    1: len([t for t in self.tests if t.priority == 1]),
                    2: len([t for t in self.tests if t.priority == 2]),
                    3: len([t for t in self.tests if t.priority == 3])
                },
                "by_cost": {
                    "low": len([t for t in self.tests if t.estimated_cost == "low"]),
                    "medium": len([t for t in self.tests if t.estimated_cost == "medium"]),
                    "high": len([t for t in self.tests if t.estimated_cost == "high"])
                }
            }
        }
