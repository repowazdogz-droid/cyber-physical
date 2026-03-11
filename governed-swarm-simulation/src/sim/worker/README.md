# Workerized Simulation Runtime

## Worker message protocol

All messages are **structured-clone-safe** (plain objects and arrays). The main thread owns the clock; the worker owns simulation state and never creates timers.

### Main → Worker

| Message           | Payload | Purpose |
|-------------------|---------|--------|
| `INIT_SCENARIO`   | `{ scenarioId, seed, policy }` | Create initial agents for the scenario, set policy, reset governance stats. Worker replies with `RUN_INITIALIZED`. |
| `TICK`            | `{ tick, policy }` | Run one advance step for the given tick and current policy. Worker replies with `STATE_UPDATE`. |
| `RESET`           | `{ scenarioId, seed }` | Recreate agents for the scenario (e.g. after user changes scenario). Worker replies with `RUN_INITIALIZED`. |
| `REQUEST_STATE`   | `{}` | Return current agents and governance stats. Worker replies with `STATE_SNAPSHOT`. |

### Worker → Main

| Message           | Payload | Purpose |
|-------------------|---------|--------|
| `RUN_INITIALIZED` | `{ agents }` | Sent after `INIT_SCENARIO` or `RESET`. Main updates store and renders. |
| `STATE_UPDATE`    | `{ tick, agents, governanceStats, proofBundlesDelta }` | Sent after each `TICK`. Main updates store (agents, governance stats) and re-renders. |
| `STATE_SNAPSHOT`  | `{ agents, governanceStats }` | Sent in reply to `REQUEST_STATE`. |

Policy is the same shape as the UI store: `{ noFlyZone, minSafeDistance, escalationProtocol, batteryReserve }`. Governance stats: `{ total, allowed, blocked, escalationEvents }`.

---

## What simulation logic moved into the worker

The worker owns all simulation state and logic that used to run on the main thread:

- **Agent state** – Full array of `AgentRenderState` (position, heading, waypoints, trail, decisionState, chainHeadHash, recentProofBundles).
- **Scenario creation** – `createScenarioAgents(scenarioId, seed)` from `sim/engine/scenarioAgents.ts` (patrol, surveillance, escort, hostile agents and all scenario presets).
- **Advance step** – `advanceAgentsPure(agents, tick, policy, totalDecisionsSoFar)` from `sim/engine/advanceAgentsPure.ts`:
  - **Decision cycle** – Patrol / surveillance / escort / hostile decision logic and `computeDecisionTexts`.
  - **Governance gate** – `evaluateGovernance(agent, proposedAction, world, policy)` (no-fly, min distance, battery reserve, escalation, compromised).
  - **Proof bundle generation** – `buildProofBundle(...)` and append to each agent’s `recentProofBundles` (max 10).
  - **Hash chain** – Each bundle’s `prevHash` / `hash`; worker keeps `chainHeadHash` on each agent.
  - **Movement** – `advanceTowards`, waypoint index updates, trail (length derived from `totalDecisionsSoFar`).
- **Governance statistics** – Worker keeps running totals (`total`, `allowed`, `blocked`, `escalationEvents`) and sends the full snapshot in every `STATE_UPDATE`.

The worker does **not** import React, Three.js, or R3F. It only uses:

- `sim/engine/scenarioAgents.ts`
- `sim/engine/advanceAgentsPure.ts`
- `sim/governance/governance.ts` (and thus `worldConfig`, `lib/hash/sha256`)
- `types/simulation` and `sim/worker/messages.ts`

---

## How the UI receives updates

1. **Clock and provider**  
   `MainSimulationView` runs `useSimulationClock({ tickIntervalMs: 250, resetKey: scenarioRunId })` and wraps the view in `SimulationWorkerProvider tick={tick}`. The provider creates the worker once and owns the message loop.

2. **Sending ticks and scenario changes**  
   - On mount: post `INIT_SCENARIO` with `currentScenarioId`, `seed`, `policy` from the store.  
   - When `tick` changes and `tick > 0`: post `TICK(tick, policy)`.  
   - When `currentScenarioId` or `scenarioRunId` changes (after first init): post `RESET(scenarioId, seed)`.

3. **Receiving state**  
   - On `RUN_INITIALIZED`: set local state `agents` and `governanceStats` (zeros), call `updateAgentsSnapshot(agents)` and `setGovernanceStats(governanceStats)`.  
   - On `STATE_UPDATE`: set local `agents` and `governanceStats`, call `updateAgentsSnapshot(agents)` and `setGovernanceStats(governanceStats)`.  
   - On `STATE_SNAPSHOT`: same as above (used for `REQUEST_STATE`).

4. **Rendering**  
   `AgentLayer` uses `useSimulationWorker()` to read `agents` from context and renders positions, headings, trails, and selection from that state. It no longer runs `advanceAgents` or any simulation logic. The store’s `agentsById` and `governanceStats` are updated from worker messages so the rest of the UI (inspector, dashboard, verification panel, follow camera) stays in sync without touching the worker.

Tick is driven only by the main-thread clock; the worker never creates its own timer.
