# TradeoffRoom — V1 LOCK (FROZEN)

Purpose:
A visual-only tradeoff surface (objectives, constraints, feasible region, tradeoff front, uncertainty).
Human-led. Non-autonomous. Not a simulator. Not an optimizer.

V1 CONTENTS (FROZEN LAYERS)
- ObjectivesLayer: O1–O3 (selectable)
- ConstraintsLayer: K1–K3 (selectable)
- FeasibleRegionLayer: F1 (non-selectable)
- TradeoffFrontLayer: T1–T7 (selectable)
- UncertaintyLayer: U1–U2 (non-selectable)

ALLOWED (V1)
- Camera orbit/pan/zoom
- Layer toggles
- Tap-to-select ONLY O*, K*, T* → Inspector shows neutral metadata
- Reset View (camera only)
- Presets that ONLY change Inspector copy

DISALLOWED (V1)
- Any motion, animation, time evolution
- Any "solve", "optimize", "recommend", "best point", "choose this"
- Arrows, weights, scores, rankings, or "frontier winner"
- Editing/dragging objects
- Sliders that imply optimization
- Export claiming compliance/certification

FAILURE SIGNAL
If a user can interpret this as a recommendation engine or optimizer, V1 has failed.

CHANGE POLICY
- Bug fixes + copy tightening allowed
- Anything affecting behavior, selectability, or semantics requires new lock version (V2)
