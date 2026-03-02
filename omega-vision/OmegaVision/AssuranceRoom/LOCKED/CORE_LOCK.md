# CORE LOCK — AssuranceRoom (V1)

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
- No procedures or thresholds
- No certification claims

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
- Procedures or step-by-step instructions
- Certification or compliance claims

## Scope
V1 proves:
- calm spatial legibility
- explicit inputs/authority/outcomes/overrides/trace as separate layers
- selection → neutral inspector copy

Nothing beyond this.

---

## V1 Contents

V1 includes five frozen layers:

1. **Inputs** (InputsLayer root entity name: "Inputs")
   - 4 inputs (I1–I4) arranged in a row
   - Selectable input tiles
   - Conceptual degraded inputs, not prescriptions

2. **Authority** (AuthorityLayer root: "Authority")
   - 4 authority bands (A1–A4) as vertical pillars
   - Selectable authority markers
   - Shows remaining control capability, not guarantees

3. **Outcomes** (OutcomesLayer root: "Outcomes")
   - 4 outcome classes (S1–S4) as larger blocks
   - Selectable outcome markers
   - Shows bounded outcome classes, not procedures

4. **Overrides** (OverridesLayer root: "Overrides")
   - 3 override gates (OVR1–OVR3) as translucent red panels
   - Selectable override constraints
   - Shows hard boundaries, not advice

5. **Trace** (TraceLayer root: "Trace")
   - Trace markers and lines (TR*)
   - Non-selectable visual indicators
   - Shows traceability surface, not audit trail
