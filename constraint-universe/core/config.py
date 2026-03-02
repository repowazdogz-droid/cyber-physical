"""Configuration and limits for constraint universe"""
from typing import Dict, Any

# Solver limits
Z3_TIMEOUT_MS = 5000
MAX_VARIABLES = 1000
MAX_CONSTRAINTS = 10000
MAX_STATE_SPACE_SIZE = 2**20  # 1M states

# Performance thresholds
CLASSIFICATION_TIMEOUT_SECONDS = 5.0
PROOF_GENERATION_TIMEOUT_SECONDS = 10.0

# Export settings
OPLAS_EXPORT_VERSION = "1.0"
ARTIFACT_FORMAT_VERSION = "1.0"

# Governance assessment thresholds
GOVERNANCE_VIABILITY_THRESHOLD = 0.7  # Minimum score for governable
CRITICAL_VIOLATION_THRESHOLD = 3      # Max violations before ungovernable
