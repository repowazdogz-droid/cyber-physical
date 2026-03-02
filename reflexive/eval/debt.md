# REFLEXIVE Evaluation Debt Register

Items older than 2 quarters without resolution escalate to High severity.

| Date | Issue | Severity | Detection | Owner | Planned Review |
|------|-------|----------|-----------|-------|---------------|
| 2026-02-08 | Confidence ceiling at 0.70 — weights need calibration | High | T1: confidence_range | — | First calibration cycle |
| 2026-02-08 | SIM_MATCH/SIM_REJECT untested on nomic-embed-text | High | T1: similarity_threshold_precision | — | First calibration cycle |
| 2026-02-08 | Polarity keyword coverage unmeasured | Medium | T3: polarity_accuracy | — | First stochastic eval |
| 2026-02-08 | Canonicalization accuracy unmeasured | Medium | T3: entity_extraction_accuracy | — | First stochastic eval |
| 2026-02-08 | 15 golden cases are scaffolds only | Medium | Track A: skip count | — | Next implementation cycle |
| 2026-02-08 | score_band_discrimination = 2 (target >= 3), only 5 of 20 golden cases implemented | Medium | T1: score_band_discrimination | — | When remaining 15 cases are implemented |
