"""Configuration constants for OPLAS"""
from typing import Dict, Any

# Determinism constraints
MAX_GRAPH_NODES = 1000
MAX_GRAPH_EDGES = 5000
MAX_CONSTRAINTS = 100
MAX_ENTITIES = 50

# Execution limits
MAX_EXECUTION_TIME_SECONDS = 30
MAX_MEMORY_MB = 512
MAX_OPERATIONS = 1000

# Verification tiers
VERIFICATION_TIER0_ENABLED = True
VERIFICATION_TIER1_ENABLED = True
VERIFICATION_TIER2_ENABLED = True

# Artifact storage
ARTIFACT_STORAGE_PATH = "./artifacts"
MAX_ARTIFACT_SIZE_MB = 10

# Hash algorithm
HASH_ALGORITHM = "sha256"

# Determinism test iterations
DETERMINISM_TEST_ITERATIONS = 1000
