# Quality Scorecard

- Overall: **4.0/5**
- Quantification: **2/5**
- Contradiction handling: **4/5**
- Uncertainty discipline: **5/5**
- Actionability: **5/5**
- **Model order vs computed VoI:** 2 engine(s) had different intuitive vs computed ranking (informative).

## Notes
- Quantification score is based on numeric signals present in baseline outputs.
- Contradiction handling score is based on adversarial evidence coverage.
- **VoI:** All scores in `prioritized-unknowns.json` are computed in code as (impact × uncertainty × decision_sensitivity) / 30; the model supplies only the three inputs and prose rationale.
- Uncertainty and actionability scores are based on prioritized unknowns and next actions.


## Generated citations (UNVERIFIED)
- 4 citation(s) extracted from baseline outputs. These may be fabricated or loosely attributed.
- **Do not quote in high-stakes documents without verification.** A post-hoc verification step (e.g. web search) should be run before use. See `citations-to-verify.json`.


## Evidence vs reasoning (reliability)
- **Reasoning** (commitments, counterarguments, failure conditions, VoI rationale): produced by the model and robust across runs; treat as structured analysis to stress-test.
- **Evidence** (citations, statistics, specific empirical claims): model-generated and stochastic; reliability is lower. Treat all as unverified unless grounded by retrieval or verification. See `citations-to-verify.json` and `claims-to-verify.json` (if present).
