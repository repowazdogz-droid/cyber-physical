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
- Assumptions: A1–A6 (all selectable)
- Conflicts: C1, C2 volumes (selectable; outlines are non-selectable)
- Unsupported: U1, U2 markers (selectable; background regions are non-selectable)

**Non-selectable entities:**
- Conflict outlines: C1_Outline, C2_Outline (marked with userData.nonSelectable)
- Unsupported regions: U1_Region, U2_Region (marked with userData.nonSelectable)
- Uncertainty halos: H1, H2 (marked with userData.nonSelectable)

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

