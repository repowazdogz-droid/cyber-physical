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

## Implementation rule

Any PR that adds a new verb must:
- justify why it is still non-operational
- list new failure modes
- update CORE_LOCK.md
- pass a manual demo check

Default answer: **do not add it**.





