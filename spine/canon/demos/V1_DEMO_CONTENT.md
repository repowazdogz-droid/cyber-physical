# V1 DEMO CONTENT — LOCKED

## Generic Robot Arm Workspace (Conceptual, Non-Operational)

## SCENE PURPOSE

Provide a calm, static spatial surface that helps humans reason about reach, limits, constraints, and uncertainty in a robotic workspace—without motion, control, or simulation.

## SCENE ELEMENTS (MINIMAL, FIXED)

### 1) Robot Arm (Abstracted)
- Simplified geometry (links + joints)
- No motors, no dynamics, no trajectories
- Neutral color, non-branded, non-real model

### 2) Workspace Volume
- Semi-transparent envelope indicating theoretical reach
- Clearly labeled as "conceptual reach, not executable"

### 3) Constraints Layer (Toggleable)
- Joint limits (angular ranges as arcs)
- Collision zones (static, highlighted regions)
- Safety buffer zones (fixed volumes)

### 4) Uncertainty Layer (Toggleable)
- Areas with incomplete knowledge (shaded/faded)
- Notes like "sensor coverage unknown" or "assumption-based"

### 5) Reference Frame
- World axes
- Base frame
- End-effector frame (static marker only)

## INTERACTION PRIMITIVES (ONLY THESE)

- Orbit / pan / zoom camera
- Toggle layers:
  - Structure
  - Constraints
  - Uncertainty
- Select an element to reveal:
  - What it connects to
  - What assumptions apply
  - What is known vs unknown

## NO OTHER INTERACTIONS

- No dragging joints
- No moving links
- No play/run buttons
- No sliders that change state
- No "what if" execution

## EXPLANATORY CALLOUTS (ON DEMAND)

When a user selects an element, show short, neutral text:
- "This limit represents a design constraint, not a command."
- "This region is excluded for safety, not optimized for performance."
- "Uncertainty here reflects missing information, not system error."

## OMEGA PRESENCE (INVISIBLE BUT ACTIVE)

- **OMEGA-V**: visual layout, affordances, calm aesthetics
- **OMEGA v37**: explanations of relationships and uncertainty when asked
- **OMEGA-G**: blocks any request to animate, predict, or control

## COMPLETION CRITERIA

The scene feels:
- calm
- legible
- non-impressive in the best way
- easy to explain with a pen and paper

**If it starts to feel like a simulator, it has failed.**




















