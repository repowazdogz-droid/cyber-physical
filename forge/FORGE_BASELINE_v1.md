# Forge v1 Baseline

**Date:** 2026-02-05  
**Version:** v1  
**Status:** Qualified

## What Forge Does

Forge generates testable invention hypotheses from Spine's defensive analysis outputs. Where Spine asks "how could this fail?", Forge asks "what should exist that doesn't yet?" Forge takes constraint violations, failure modes, contradictions, and uncertainties from Spine and generates hypotheses for constraint relaxation, failure elimination, contradiction resolution, and uncertainty collapse. Each hypothesis includes testable predictions, falsification tests, confidence scores, and adjacency mappings to related fields.

## Metrics from 3 Test Cases

| Case | Hypotheses | Avg Confidence | Categories |
|------|------------|----------------|------------|
| Soft Gripper | 3 | 0.82 | Failure elimination (1), Uncertainty collapse (2) |
| Endoscopic Discitis | 2 | 0.80 | Uncertainty collapse (2) |
| Slip Under Load | 2 | 0.78 | Failure elimination (1), Uncertainty collapse (1) |

**Total:** 7 hypotheses generated across 2 categories

## Known Limits

- **Rule-based only:** No LLM calls, all logic is deterministic rule-based
- **Adjacency list hand-curated:** ~20 adjacency pairs, not exhaustive
- **Does not discover physics:** Cannot propose new physical mechanisms
- **Does not replace expert judgment:** Hypotheses require expert validation
- **Does not guarantee novelty:** May suggest known solutions
- **Limited domain coverage:** Optimized for surgical robotics, may miss adjacencies in other domains
- **Quality gate:** Catches unsafe suggestions but may miss subtle issues
