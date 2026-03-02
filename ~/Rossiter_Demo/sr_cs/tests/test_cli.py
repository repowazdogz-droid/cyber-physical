"""
Tests for CLI module.
"""

import subprocess
import sys
import unittest
from pathlib import Path


class TestCLI(unittest.TestCase):
    """Test cases for CLI interface."""

    def setUp(self):
        """Set up test fixtures."""
        # Get module directory
        module_dir = Path(__file__).parent.parent
        self.module_dir = module_dir
        self.examples_dir = module_dir / "examples"

    def run_cli(self, args: list) -> tuple:
        """Run CLI with given arguments."""
        cmd = [sys.executable, "-m", "sr_cs.cli"] + args
        result = subprocess.run(
            cmd,
            cwd=str(self.module_dir.parent),
            capture_output=True,
            text=True,
        )
        return result.returncode, result.stdout, result.stderr

    def test_case_octopus_gripper(self):
        """Test --case octopus_gripper."""
        returncode, stdout, stderr = self.run_cli(["--case", "octopus_gripper"])
        self.assertEqual(returncode, 0, f"CLI failed: {stderr}")
        self.assertIn("Octopus Gripper", stdout)
        self.assertIn("Overall Status", stdout)

    def test_case_endoluminal_sleeve(self):
        """Test --case endoluminal_sleeve."""
        returncode, stdout, stderr = self.run_cli(["--case", "endoluminal_sleeve"])
        self.assertEqual(returncode, 0, f"CLI failed: {stderr}")
        self.assertIn("Endoluminal Sleeve", stdout)

    def test_case_continuum_manipulator(self):
        """Test --case continuum_manipulator."""
        returncode, stdout, stderr = self.run_cli(["--case", "continuum_manipulator"])
        self.assertEqual(returncode, 0, f"CLI failed: {stderr}")
        self.assertIn("Continuum Manipulator", stdout)

    def test_spec_file(self):
        """Test --spec with example file."""
        spec_path = self.examples_dir / "case_octopus_gripper.json"
        returncode, stdout, stderr = self.run_cli(["--spec", str(spec_path)])
        self.assertEqual(returncode, 0, f"CLI failed: {stderr}")
        self.assertIn("Octopus Gripper", stdout)

    def test_raw_output(self):
        """Test --raw JSON output."""
        returncode, stdout, stderr = self.run_cli(["--case", "octopus_gripper", "--raw"])
        self.assertEqual(returncode, 0, f"CLI failed: {stderr}")
        self.assertIn('"case_name"', stdout)
        self.assertIn('"overall_status"', stdout)

    def test_missing_args(self):
        """Test that missing args shows help."""
        returncode, stdout, stderr = self.run_cli([])
        self.assertNotEqual(returncode, 0)  # Should exit with error
        self.assertIn("--spec", stdout or stderr)  # Help text should mention --spec


if __name__ == "__main__":
    unittest.main()


