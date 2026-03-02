"""
Tests for engine module.
"""

import json
import unittest
from pathlib import Path

from sr_cs.engine import compile_from_dict
from sr_cs.models import RiskLevel


class TestEngine(unittest.TestCase):
    """Test cases for compile_from_dict."""

    def setUp(self):
        """Set up test fixtures."""
        # Get examples directory
        module_dir = Path(__file__).parent.parent
        self.examples_dir = module_dir / "examples"

    def load_example(self, case_name: str) -> dict:
        """Load an example spec."""
        case_file = self.examples_dir / f"case_{case_name}.json"
        with open(case_file, "r") as f:
            return json.load(f)

    def test_octopus_gripper(self):
        """Test octopus gripper case."""
        spec = self.load_example("octopus_gripper")
        result = compile_from_dict(spec)

        self.assertEqual(result.case_name, "Octopus Gripper")
        self.assertEqual(len(result.dimensions), 6)
        self.assertGreaterEqual(result.overall_score, 0.0)
        self.assertLessEqual(result.overall_score, 1.0)
        self.assertIn(result.overall_status, RiskLevel)

    def test_endoluminal_sleeve(self):
        """Test endoluminal sleeve case."""
        spec = self.load_example("endoluminal_sleeve")
        result = compile_from_dict(spec)

        self.assertEqual(result.case_name, "Endoluminal Sleeve")
        self.assertEqual(len(result.dimensions), 6)
        self.assertGreaterEqual(result.overall_score, 0.0)
        self.assertLessEqual(result.overall_score, 1.0)
        self.assertIn(result.overall_status, RiskLevel)

    def test_continuum_manipulator(self):
        """Test continuum manipulator case."""
        spec = self.load_example("continuum_manipulator")
        result = compile_from_dict(spec)

        self.assertEqual(result.case_name, "Continuum Manipulator")
        self.assertEqual(len(result.dimensions), 6)
        self.assertGreaterEqual(result.overall_score, 0.0)
        self.assertLessEqual(result.overall_score, 1.0)
        self.assertIn(result.overall_status, RiskLevel)

    def test_missing_required_field(self):
        """Test that missing required fields raise ValueError."""
        spec = {"case_name": "Test"}
        with self.assertRaises(ValueError) as context:
            compile_from_dict(spec)
        self.assertIn("Missing required fields", str(context.exception))

    def test_to_dict_serialization(self):
        """Test that result can be serialized to dict."""
        spec = self.load_example("octopus_gripper")
        result = compile_from_dict(spec)
        result_dict = result.to_dict()

        self.assertIn("case_name", result_dict)
        self.assertIn("overall_status", result_dict)
        self.assertIn("overall_score", result_dict)
        self.assertIn("dimensions", result_dict)
        self.assertEqual(len(result_dict["dimensions"]), 6)


if __name__ == "__main__":
    unittest.main()


