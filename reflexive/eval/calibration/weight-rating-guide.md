# REFLEXIVE Weight Calibration — Human Rating Guide

## Task

Rate each analysis on a 1–5 scale based on its quality as institutional reasoning.

## Rating Scale

| Rating | Label | Meaning |
|--------|-------|---------|
| 1 | Poor | Misleading, contradictory, or empty. Would harm decision-making. |
| 2 | Weak | Superficial or mostly obvious. Adds little value. |
| 3 | Usable | Identifies real tradeoffs but misses important angles or lacks depth. |
| 4 | Good | Covers key dimensions, surfaces genuine insights, defensible reasoning. |
| 5 | Excellent | Comprehensive, nuanced, identifies non-obvious risks/opportunities. Would trust for real decisions. |

## Instructions

1. For each analysis, read the stimulus (in weight-rating-context.csv) and the synthesis output.
2. Rate based on **usefulness and defensibility** — not optimism or pessimism.
3. **Do NOT look at the confidence_score column while rating.** The goal is to calibrate the score to match your judgment, not validate it.
4. Consider: Would a senior decision-maker find this analysis helpful? Does it surface things they wouldn't have thought of?
5. Rate quickly — gut reaction after reading is fine. Don't overthink.
6. Fill the `human_quality_rating` column in weight-rating.csv with an integer 1-5.

## What you're rating

You're rating the SYNTHESIS output — the convergence/divergence analysis, not individual lens outputs. Ask:
- Are the convergence points genuine agreements or trivial restatements?
- Are divergence points real disagreements or false contradictions?
- Is the orphan rate reasonable or does it indicate the engine missed connections?
- Does the overall picture help you understand the decision space?

## Tie-breaking

If torn between two ratings, choose the lower one. We want calibration to be conservative.
