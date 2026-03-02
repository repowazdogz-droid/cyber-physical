# CORE LOCK — AssumptionRoom (V1)

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

1. **Assumptions** (AssumptionsLayer root entity name: "Assumptions")
   - 6 assumptions (A1–A6) arranged in a gentle arc
   - Selectable assumption objects
   - Framing assumptions, not guarantees

2. **Conflicts** (ConflictsLayer root: "Conflicts")
   - 2 conflict volumes (C1–C2) with non-selectable outlines
   - Selectable volumes only
   - Highlights tensions between assumptions, not commands

3. **Unsupported** (UnsupportedLayer root: "Unsupported")
   - 2 unsupported regions (U1–U2) with selectable markers
   - Non-selectable background regions, selectable markers
   - Gap indicators, not commands

4. **Uncertainty** (UncertaintyLayer root: "Uncertainty")
   - 2 halos (H1–H2) around assumptions A2 and A6
   - Non-selectable visual indicators

