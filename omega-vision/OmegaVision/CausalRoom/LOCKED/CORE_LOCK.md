# CORE LOCK — CausalRoom (V1)

This project is a **trust surface**. It is **not** a simulator, controller, planner, or agent.

## Non-negotiables
- Human-led, non-autonomous
- No time evolution
- No physics
- No run/play actions
- No recommendations
- No optimization
- No "best" outputs
- No hidden goals

## Allowed interactions (V1)
- Walk/look (head pose)
- Layer toggles (UI)
- Tap-to-inspect (read-only metadata)
- Reset View (camera/state reset only)

## Disallowed interactions (V1)
- Grabbing/dragging objects
- Scaling/rotating objects
- Editing geometry
- Moving joints / "pose" control
- Trajectories
- Sliders that "solve"
- Simulate / predict / recommend

## Scope
V1 proves:
- calm spatial legibility
- explicit constraints/assumptions/uncertainty as separate layers
- selection → neutral inspector copy

Nothing beyond this.

---

## V1 Contents

V1 includes four frozen layers:

1. **Nodes** (StructureLayer root entity name: "Nodes")
   - 6 nodes (N1–N6) arranged in a ring
   - Conceptual labels only, not measurements

2. **Links** (LinkLayer root: "Links")
   - 4 allowed causal links (L1–L4)
   - No weights, no arrows (direction only exists in inspector text fields "From/To")
   - Illustrative influence, not asserted truth

3. **DisallowedLinks** (DisallowedLinkLayer root: "DisallowedLinks")
   - 3 boundary markers (D1–D3)
   - Explicit "not allowed" constraints
   - Boundary markers, not claims

4. **Uncertainty** (UncertaintyLayer root: "Uncertainty")
   - 2 halos around nodes N2 and N5
   - Non-selectable visual indicators

