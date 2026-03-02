# AssumptionRoom V1 — LOCKED

V1 Contents (frozen):
- Assumptions layer (A1–A6, static objects, selectable)
- Conflicts layer (C1–C2, static volumes with non-selectable outlines)
- Unsupported layer (U1–U2, static regions with selectable markers)
- Uncertainty layer (H1–H2, static halos, non-selectable)
- 3 presets (Research Reasoning, Clinical Workflow, Engineering Systems)
  - Presets ONLY change assumption titles/meanings in Inspector
  - Presets do NOT change geometry, objects, or interactions

Allowed interactions:
- Camera move only (head pose)
- Layer toggles only (visibility)
- Tap to select only (read-only metadata)
- Reset view only (camera/state reset)
- Preset switching (changes Inspector copy only)

Disallowed:
- Editing assumptions in-app
- Any time evolution, "run", or animation
- Any recommendation, optimization, or "best" selection
- Any claim of validation, certification, or operational readiness
- Presets adding/removing objects
- Presets changing selection rules
- Presets changing toggles

Trust language must remain visible:
"Human-led. Non-autonomous. Visual reasoning only. Not a simulation."

## Selection Rules (V1)

**Selectable:**
- Assumptions: A1–A6 (all selectable)
- Conflicts: C1, C2 volumes (selectable; outlines are non-selectable)
- Unsupported: U1, U2 markers (selectable; background regions are non-selectable)

**Non-selectable:**
- Conflict outlines: C1_Outline, C2_Outline
- Unsupported regions: U1_Region, U2_Region
- Uncertainty halos: H1, H2

## Change Policy

Only bugfixes and copy clarifications allowed without creating V2.

