"""YAML case file parser for Spine Decision Runtime."""

import yaml
from pathlib import Path
from typing import Dict, Any

from .schemas import CaseInput


def parse_case_file(case_path: str) -> CaseInput:
    """
    Parse a YAML case file and return a CaseInput model.
    
    Args:
        case_path: Path to the case.yaml file
        
    Returns:
        CaseInput: Parsed and validated case input
        
    Raises:
        FileNotFoundError: If case file doesn't exist
        yaml.YAMLError: If YAML is invalid
        ValueError: If schema validation fails
    """
    path = Path(case_path)
    
    if not path.exists():
        raise FileNotFoundError(f"Case file not found: {case_path}")
    
    with open(path, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f)
    
    if not data:
        raise ValueError("Case file is empty")
    
    return CaseInput(**data)
