# LOCKED — V2-B (RC Audit)

This module is **LOCKED** as a safe, non-operational demo surface.

## Purpose (what this is)
A **local-only**, **human-led** reasoning hygiene tool that:
- accepts an optional screenshot as *context*
- accepts **manually pasted text** as the audit input
- produces a **structured, non-persuasive audit**
- exports an **Audit Card** (copy/share)
- supports **A→B comparison** as a structural diff

## Hard boundaries (non-negotiable)
1. **NO OCR**
   - Do not extract text from images automatically.
   - No Vision, no OCR pipeline, no "read slide" behavior.

2. **NO NETWORK**
   - No web browsing, no URL fetching, no remote calls.
   - No analytics uploads.
   - No background requests.

3. **NO MODEL CALLS (V2-B)**
   - No LLM usage in this mode.
   - Local heuristics only.

4. **NO CONCLUSIONS / NO PERSUASION**
   - The audit must not declare what is "true/false".
   - Must not recommend actions, policies, or choices.
   - Must not optimize wording to "win" or "convince".

5. **NO OPERATIONAL GUIDANCE**
   - No procedures, checklists, or "do X then Y" for real-world systems.
   - No medical, legal, or safety-critical operational advice.

6. **INPUT BOUNDARY**
   - The audit is **bounded to pasted text only**.
   - The screenshot is optional and must be treated as **non-authoritative context**.

7. **COMPARE BOUNDARY**
   - A→B compare is a **structural diff**, not a verdict.
   - Must not label A as "bad" or B as "good".

## Allowed features (safe expansions)
- Better UI layout / readability
- More explicit "bounded to text" language
- More transparent heuristics (show which triggers fired)
- Export formats (copy/share/pdf snapshot)
- Presets of example claims (built-in, static)

## Disallowed features (do not add)
- OCR / automatic claim extraction
- Web verification or citation lookup
- "Truth scoring" or fact-check verdicts
- "Rewrite this to be more convincing"
- "Decide who is right"
- Anything that could be interpreted as certification

## Freeze rule
Any change that touches these boundaries requires explicit review and a lock update.

---

Status: **LOCKED**
Owner: Human
Date: (fill in)





