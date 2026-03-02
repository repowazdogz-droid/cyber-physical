# REFLEXIVE Similarity Labeling Guide

## Task

For each pair of claims, decide: are these two claims **making the same assertion**?

Label each pair as:
- **same** — Both claims are saying the same thing, even if worded differently
- **different** — The claims are about different things, or make different points

## Rules

1. **Ignore lens origin.** A claim from the analytical lens and one from the adversarial lens CAN be the same assertion.
2. **Ignore wording.** "Revenue growth is strong" and "The company shows robust top-line expansion" are the SAME assertion.
3. **Polarity matters.** "The acquisition is risky" and "The acquisition is safe" are DIFFERENT.
4. **Specificity matters.** "Revenue is $200M" and "Revenue is growing" are DIFFERENT (one is about the amount, the other about the trend).
5. **Scope matters.** "This will work in Q1" and "This will work long-term" are DIFFERENT.
6. **Entity matters.** "HelioTech has technical debt" and "Our company has technical debt" are DIFFERENT.

## Examples — SAME

| Claim A | Claim B | Why |
|---------|---------|-----|
| "HelioTech's engineering team of 150 is a key asset" | "The 150-person engineering team represents significant acquisition value" | Same assertion: engineering team is valuable |
| "Technical debt poses integration risk" | "Legacy platform debt will create integration challenges" | Same assertion: tech debt = risk |
| "15% YoY growth is above market average" | "Revenue growth rate of 15% exceeds industry benchmarks" | Same assertion: growth is strong |
| "$500M valuation is reasonable given $200M revenue" | "The 2.5x revenue multiple represents fair pricing" | Same assertion: price is fair |
| "Board pressure creates timeline risk" | "The Q2 deadline from the board introduces urgency risk" | Same assertion: board timeline = risk |

## Examples — DIFFERENT

| Claim A | Claim B | Why |
|---------|---------|-----|
| "Revenue growth is 15%" | "Revenue is $200M" | Different: growth rate vs absolute amount |
| "The acquisition is strategically sound" | "The acquisition carries significant risk" | Different: opposite polarity |
| "HelioTech has strong engineering" | "Our company needs more engineers" | Different: different entities |
| "Technical debt is manageable in 12 months" | "Technical debt will take 3+ years to resolve" | Different: contradictory scope |
| "The deal should close by Q2" | "Regulatory review may delay until Q4" | Different: different timelines |

## Edge Cases

**Scope-dependent:** "This works for North America" vs "This works globally" → **different** (scope differs)

**Polarity trap:** "Growth is decelerating" vs "Growth remains positive" → **different** (one is negative trend, one is positive state — even though both acknowledge growth exists)

## Process

1. Read both claims
2. Ask: "Is the core assertion identical?"
3. If you're unsure, lean toward **different** (false merges are more costly than false splits)
4. Label every row — do not skip
