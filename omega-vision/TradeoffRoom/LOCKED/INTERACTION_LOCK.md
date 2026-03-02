# INTERACTION LOCK — V1

If an interaction feels like:
- control
- manipulation
- execution
- simulation
- advice
…it is out of scope for V1.

## V1 Interaction Contract (short)
- Camera only (user movement)
- Toggle only (visibility)
- Select only (metadata)
- Reset only (rebuild view)

No other verbs.

---

## Explicit Selection Rules

**Selectable entities:**
- Objectives: O1–O3 (all selectable)
- Constraints: K1–K3 (all selectable)
- Tradeoff Front: T1–T7 (all selectable)

**Non-selectable entities:**
- Feasible Region: F1 (marked with userData.nonSelectable)
- Uncertainty halos: U1, U2 (marked with userData.nonSelectable)
- Any outlines/helpers (if any exist)

**Selection rule:**
- If an entity is non-selectable, it must not highlight and must not populate Inspector.

**Disallowed interactions:**
- No dragging assumptions, conflicts, or markers
- No manipulation of geometry
- No creation/deletion of assumptions
- No editing of assumption properties
- No presets that add/remove objects
- No presets that change selection rules

## Implementation rule
Any PR that adds a new verb must:
- justify why it is still non-operational
- list new failure modes
- update CORE_LOCK.md
- pass a manual demo check

Default answer: **do not add it**.

