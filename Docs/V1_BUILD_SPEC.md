# V1 BUILD SURFACE — LOCKED (WEB-FIRST, MINIMUM VIABLE DEMO)

## GOAL

Build a single-page web demo that renders a static robot-arm workspace scene with:
- camera orbit controls
- three layer toggles (Structure / Constraints / Uncertainty)
- click-to-select elements (shows a short, neutral panel)

**No motion. No dragging. No simulation. No "run".**

## DELIVERABLES (ONLY THESE)

1) A public demo page (local first, deploy later)
2) One 3D scene with the locked elements
3) A right-side "Inspector" panel that shows metadata on selection
4) Three toggles to show/hide layers

## REPO STRUCTURE (MINIMAL)

```
/spatial-demo
  /src
    index.html
    main.js
    scene.js
    ui.js
    styles.css
  /assets
    (optional) simple textures/icons
  README.md
```

## TECH CHOICE (LOWEST FRICTION)

- Three.js (rendering)
- OrbitControls (camera)
- Simple DOM UI (checkboxes + panel)
**No frameworks required.**

## EXECUTION STEPS (ORDERED)

1) Create project folder: `spatial-demo/`
2) Create the files listed above (empty placeholders)
3) Implement a basic Three.js scene (grid + lights + camera + orbit)
4) Add abstract robot arm:
   - base + 3–4 link segments + end-effector marker
   - grouped as "Structure"
5) Add workspace reach envelope:
   - semi-transparent volume (box/sphere/cylinder)
6) Add "Constraints" layer:
   - joint limit arcs (simple torus segments or line arcs)
   - static "collision zone" volumes (red translucent boxes)
   - safety buffer volumes (yellow translucent boxes)
7) Add "Uncertainty" layer:
   - shaded volumes or fog-like translucent meshes
   - tag these as "assumption-based / unknown"
8) Add UI toggles:
   - checkbox controls that show/hide each group
9) Add selection:
   - raycast on click
   - highlight selected mesh
   - show Inspector panel with:
     - element name
     - type (Structure/Constraint/Uncertainty)
     - "Known / Assumed / Unknown" tag
     - neutral callout text (from spec)
10) Add guardrails in UI text:
    - footer line: "Conceptual visualization. No control or simulation."
11) Smoke test:
    - reload page
    - toggle layers
    - click objects
    - confirm nothing moves except camera

## REQUIRED INPUTS / TOOLS

- Cursor
- Node.js OR simple local server (any)
- Three.js via CDN or npm (choose easiest)

## WHAT IS NOT INCLUDED (EXPLICIT)

- No joint manipulation
- No trajectories
- No physics
- No time progression
- No "what-if" execution
- No Omniverse / Unity / Unreal in V1

## CHECKPOINT (PAUSE HERE BEFORE BUILDING)

Before writing code, decide ONE:
- **A)** Use Three.js via CDN (fastest)
- **B)** Use Vite + npm (cleaner, slightly more setup)

**Reply with:** `"CDN"` or `"Vite"`

I will then give the exact next Cursor block (copy/paste) for that choice.


































