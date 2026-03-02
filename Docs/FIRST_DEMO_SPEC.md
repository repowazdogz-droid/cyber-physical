# FIRST DEMO — ZERO-RISK HUMAN-IN-THE-LOOP SPATIAL INTELLIGENCE

## DEMO INTENT (ONE LINE)

Show how a human can explore and reason about a spatial system without the system making decisions, issuing commands, or acting autonomously.

## DEMO TYPE (SAFEST POSSIBLE)

Pure spatial visualization + human-guided exploration  
(no control, no simulation execution, no optimisation)

## CORE DEMO CONCEPT

A static-but-interactive spatial scene that allows a human to:
- inspect components
- toggle viewpoints
- reveal constraints and relationships
- ask "what depends on what?" visually

**Nothing moves unless the human moves the camera.**

## NOT A SIMULATION

- No physics running
- No control loops
- No time evolution
- No "run" button

This is a *thinking surface*, not a system.

## WHAT THE USER CAN DO

- Rotate / zoom / pan the scene
- Toggle layers (structure, constraints, uncertainty)
- Select an element and see:
  - what it connects to
  - what assumptions it relies on
  - what is known vs unknown

## WHAT THE SYSTEM NEVER DOES

- Never predicts outcomes
- Never recommends actions
- Never suggests "best" configurations
- Never advances time
- Never acts without a click

## SPATIAL CONTENT (GENERIC, DOMAIN-SAFE)

**LOCKED FOR V1:** Generic Robot Arm Workspace (reach, limits, blind spots)

See `V1_DEMO_CONTENT.md` for detailed specification.

**No real vehicle.**  
**No operational parameters.**  
**Conceptual only.**

## WHY THIS WORKS

- Academics recognise the thinking model
- Engineers see structure without control risk
- Clinicians see safety by design
- You can explain it on a whiteboard
- It survives scrutiny because it *does less*, not more

## HOW OMEGA IS PRESENT (SUBTLE)

- **OMEGA-V**: drives visual layout and exploration affordances
- **OMEGA v37**: explains relationships and uncertainty when asked
- **OMEGA-G**: enforces "no action / no recommendation" boundaries

## SUCCESS SIGNAL

Someone says:  
*"Oh — this helps me *think* about the system without telling me what to do."*

## STOP CONDITION

If the demo tempts you to add motion, prediction, or control —  
**that feature is deferred.**

This demo is complete when it feels calm.

