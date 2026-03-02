# CORE LOCK — TradeoffRoom (V1)

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

V1 includes five frozen layers:

1. **Objectives** (ObjectivesLayer root entity name: "Objectives")
   - 3 objectives (O1–O3) arranged in a shallow arc
   - Selectable objective pillars
   - Conceptual goals, not prescriptions

2. **Constraints** (ConstraintsLayer root: "Constraints")
   - 3 constraints (K1–K3) as vertical slabs/walls
   - Selectable constraint boundaries
   - Shows limits, not commands

3. **Feasible Region** (FeasibleRegionLayer root: "FeasibleRegion")
   - 1 feasible region volume (F1)
   - Non-selectable visual indicator
   - Shows possibility, not a solution

4. **Tradeoff Front** (TradeoffFrontLayer root: "TradeoffFront")
   - 7 tradeoff front points (T1–T7) forming a curve
   - Selectable markers
   - Shows tensions, not "best choice"

5. **Uncertainty** (UncertaintyLayer root: "Uncertainty")
   - 2 uncertainty halos (U1–U2)
   - Non-selectable visual indicators

