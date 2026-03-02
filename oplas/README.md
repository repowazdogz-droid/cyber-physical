# OPLAS — Omega Post-LLM Abstraction System

**One-line aim**: Build a system where **intelligence compounds as executable, verifiable abstractions** (artifacts) that persist across tasks and remain useful even if the underlying LLM is swapped.

## Project Status

**Current Gate**: 1a — Determinism Foundation ✅

## Architecture

Built on Omega Spine:
- Contracts: typed interfaces + invariants
- Artifacts: durable storage, versioning, provenance
- Kernels: execution + routing primitives
- Orchestrator: DAG runner, topological ordering, replay
- Policies/Gates: capability + consent + safety constraints
- Claims/Verifier: evidence registry + deterministic checking

## Gate 1a — Determinism Foundation ✅

**Goal**: Establish deterministic parse → canonicalize → hash → validate → store → replay pipeline.

**Components**:
- ✅ Deterministic parser (no LLM in parse path)
- ✅ Canonicalizer (normalized ordering/encoding)
- ✅ Content-addressable hashing
- ✅ Schema validator
- ⏳ Storage (JSON, using artifact vault) - Next
- ⏳ Manual replay script - Next

**Example Task**: Simple graph parsing (nodes + edges) → canonical representation → hash → store → replay.

## Next Gates

- Gate 1b: Execution core (DSL v0, executor, verifier tiers 0-1)
- Gate 1c: Propose/verify loop (model API, verifier tier 2)
- Gate 2: Concept vault v0
- Gate 3: Model swap suite
- Gate 4: Generalization probing
- Gate 5: Scale + optimize

## Determinism Doctrine

**Hard Rule**: No learned model in the parse path.

Determinism enforced at:
- Parser → Canonicalizer → Executor → Verifier → Replay

## Usage

```python
from parser.deterministic_parser import DeterministicParser
from canonicalization.canonicalizer import Canonicalizer

# Parse request
parser = DeterministicParser()
request = parser.parse("analyze csv data for patterns")

# Canonicalize to graph
canonicalizer = Canonicalizer()
graph = canonicalizer.canonicalize(request)

# Graph hash is deterministic
print(f"Graph hash: {graph.hash}")
```

## Testing

```bash
# Run all tests
python -m pytest tests/ -v

# Run determinism tests
python -m pytest tests/test_determinism.py -v

# Run canonicalization tests
python -m pytest tests/test_canonicalization.py -v
```

## Success Criteria for Gate 1A

1. ✅ **Deterministic Parsing**: Same input → identical TypedRequest (verified over 1000 iterations)
2. ✅ **Canonical Graphs**: Equivalent requests → identical graph hashes
3. ✅ **Rule-Based Only**: Zero ML/LLM dependencies in core pipeline
4. ⏳ **Perfect Replay**: All executions replay to identical results (Gate 1b)
5. ⏳ **Formal Verification**: Multi-tier verification system functional (Gate 1b)
