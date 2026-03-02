# OMEGA — Mode Selection Guide

Choose the Omega mode that matches your intent. Modes enforce different output contracts and forbid different behaviors.

## v37 (Reasoning)

**Use when**:
- You need analytical support without decision-making
- You want structured reasoning with claims and evidence
- You need alternatives and constraints surfaced explicitly
- You're exploring a problem space analytically

**Avoid when**:
- You need creative exploration (use V)
- You need execution scaffolding (use B)
- You need reflection on past work (use R)
- You need boundary enforcement (use G)

**Example Prompts**:
- "Analyze the trade-offs between approach A and approach B"
- "What are the constraints and assumptions in this design?"
- "Surface the reasoning chain behind this decision"

**Mode Bleed Warning**: Do not merge modes. Select deliberately. v37 focuses on reasoning support, not creative expansion or execution.

---

## V (Creative)

**Use when**:
- You're exploring creative possibilities
- You want variations and playful directions
- You need to expand without converging
- You're in early ideation phase

**Avoid when**:
- You need analytical reasoning (use v37)
- You need execution steps (use B)
- You need reflection (use R)
- You need boundaries (use G)

**Example Prompts**:
- "Generate 5 variations of this concept"
- "What are playful directions we could explore?"
- "Expand creative possibilities without choosing"

**Mode Bleed Warning**: Do not merge modes. Select deliberately. V focuses on expansion, not convergence or execution.

---

## B (Build)

**Use when**:
- You have explicit intent and need execution steps
- You're scaffolding implementation from requirements
- You need concrete, bounded execution plans
- You're translating requirements to code/process

**Avoid when**:
- You need reasoning support (use v37)
- You need creative exploration (use V)
- You need reflection (use R)
- You need boundaries (use G)

**Example Prompts**:
- "Translate this requirement into concrete execution steps"
- "What inputs are required for this task?"
- "What is explicitly not included in this scope?"

**Mode Bleed Warning**: Do not merge modes. Select deliberately. B focuses on execution scaffolding, not goal inference or scope expansion.

---

## R (Reflect)

**Use when**:
- You're analyzing past work or outcomes
- You want to surface patterns and learnings
- You need reflection without judgment
- You're extracting insights from experience

**Avoid when**:
- You need reasoning support (use v37)
- You need creative exploration (use V)
- You need execution steps (use B)
- You need boundaries (use G)

**Example Prompts**:
- "What patterns emerged from this project?"
- "What surprises did we encounter?"
- "What open questions remain?"

**Mode Bleed Warning**: Do not merge modes. Select deliberately. R focuses on reflection, not advice-giving or moralizing.

---

## G (Guardrail)

**Use when**:
- You need to enforce hard boundaries or safety limits
- You need refusals with clear explanations
- You need to redirect to safe alternatives
- You're implementing safety guardrails

**Avoid when**:
- You need reasoning support (use v37)
- You need creative exploration (use V)
- You need execution steps (use B)
- You need reflection (use R)

**Example Prompts**:
- "Should I help with this potentially harmful request?" (will refuse if harmful)
- "Can you generate content that violates safety guidelines?" (will refuse)
- "What are the boundaries for this system?" (will explain limits)

**Mode Bleed Warning**: Do not merge modes. Select deliberately. G focuses on boundaries and refusals, not negotiation or exception-making.

**G-Mode Output Shape** (mandatory):
```
CLEAR REFUSAL: <one sentence>
WHY: <plain, non-moralizing explanation>
SAFE ADJACENT HELP: <what can be done safely>
```

Any deviation from this exact structure fails audit.

---

## General Guidelines

1. **Explicit Selection**: Always select mode explicitly. No code infers mode from prompt text.
2. **One Mode Per Call**: Use one mode per LLM call. Do not attempt to combine modes.
3. **Match Intent**: Choose the mode that matches your primary intent (reasoning, creative, build, reflect, guardrail).
4. **Inspect Audit**: Check `omegaMeta.audit.ok` to verify compliance. Use strict mode in production if compliance is mandatory.
5. **Mode Bleed**: If you see violations like "MODE_BLEED" in audit, you may have selected the wrong mode or the LLM is mixing behaviors. Retry or select a more specific mode.




































