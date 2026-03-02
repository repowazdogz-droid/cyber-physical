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
- (Define room-specific selectable entities here)

**Non-selectable entities:**
- Dash segments (DASH:*) — part of visualization
- Uncertainty halos (Uncertainty_Halo_*) — visual indicators only

**Disallowed interactions:**
- No dragging objects
- No manipulation of geometry
- No creation/deletion of elements
- No editing of properties

## Implementation rule
Any PR that adds a new verb must:
- justify why it is still non-operational
- list new failure modes
- update CORE_LOCK.md
- pass a manual demo check

Default answer: **do not add it**.

































