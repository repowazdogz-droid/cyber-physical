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
- Nodes (N1–N6)
- Links (LINK:L1, LINK:L2, LINK:L3, LINK:L4)
- Disallowed Links (DISALLOWED:D1, DISALLOWED:D2, DISALLOWED:D3)

**Non-selectable entities:**
- Dash segments (DASH:*) — part of disallowed link visualization
- Uncertainty halos (Uncertainty_Halo_*) — visual indicators only

**Disallowed interactions:**
- No dragging nodes or links
- No manipulation of geometry
- No creation/deletion of nodes or links
- No editing of link properties

## Implementation rule
Any PR that adds a new verb must:
- justify why it is still non-operational
- list new failure modes
- update CORE_LOCK.md
- pass a manual demo check

Default answer: **do not add it**.

