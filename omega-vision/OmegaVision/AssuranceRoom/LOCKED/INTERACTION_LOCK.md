# INTERACTION LOCK — V1

If an interaction feels like:
- control
- manipulation
- execution
- simulation
- advice
- procedures
- certification
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
- Inputs: I1–I4 (all selectable)
- Authority: A1–A4 (all selectable)
- Outcomes: S1–S4 (all selectable)
- Overrides: OVR1–OVR3 (all selectable)

**Non-selectable entities:**
- Trace: TR* (marked with userData.nonSelectable)
- Any outlines/helpers (if any exist)

**Selection rule:**
- If an entity is non-selectable, it must not highlight and must not populate Inspector.

**Disallowed interactions:**
- No dragging inputs, authority, outcomes, or overrides
- No manipulation of geometry
- No creation/deletion of elements
- No editing of element properties
- No presets that add/remove objects
- No presets that change selection rules
- No procedures or step-by-step instructions
- No certification or compliance claims

## Implementation rule
Any PR that adds a new verb must:
- justify why it is still non-operational
- list new failure modes
- update CORE_LOCK.md
- pass a manual demo check

Default answer: **do not add it**.
