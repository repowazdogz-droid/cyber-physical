# Typed Scenario Config System

## Scenario config structure

Configs are **JSON-compatible** (no functions). All behaviour is deterministic from **seed**.

- **ScenarioConfig**
  - `id` – ScenarioId (routine_patrol, threat_detection, governance_failure, adversarial_coordination_attack)
  - `label`, `description` – UI text
  - `seed` – default/base seed (documentation; runtime uses the seed passed to `instantiateScenario`)
  - `agentTemplates` – list of **AgentTemplate**
  - `hostileTemplates` – optional list of hostile-only templates (spawned after agentTemplates)
  - `policyOverrides` – optional policy at run start
  - `scriptPhases` – optional `{ startTick, endTick, events[] }` for future runtime scripting
  - `positionScale` – optional `{ x?, y?, z? }` to scale all positions (e.g. governance_failure uses 0.6 on x/z)
  - `compromiseHostileIndex` – optional index in hostile list to set status COMPROMISED and override mission text

- **AgentTemplate**
  - `role` – PATROL | SURVEILLANCE | ESCORT | HOSTILE
  - `count` – number of agents
  - `spawnRegion` – where to place agents (see below)
  - `waypointPattern` – how waypoints are derived from spawn (see below)
  - `seedOffset` – added to base seed for this template’s RNG stream (default: template index × 1000)
  - optional: `missionObjective`, `speed`, `sensorRangeMeters`

- **SpawnRegion** (one of)
  - **circle** – `radius`, optional `centerX`, `centerZ`, `y`. Positions on a ring; angle = (i/count)*2π + jitter.
  - **grid** – `rows`, `cols`, `spacingX`, `spacingZ`, `originX`, `originZ`, optional `y`. Index maps to row/col.
  - **line** – `startX`, `startZ`, `endX`, `endZ`, optional `y`, optional `jitterX`, `jitterZ`. Positions interpolated along segment + jitter.
  - **anchors** – `points: {x,y,z}[]`, optional `jitterX`, `jitterZ`. Position = points[i % len] + jitter.

- **WaypointPattern** (one of)
  - **perimeter** – `numWaypoints`, optional `radiusJitterMin/Max`. Waypoints at angles around spawn angle (for patrol).
  - **station** – `radius`. Three points on a circle around spawn (or anchor for surveillance).
  - **corridor** – optional `forwardOffset`, `backOffset`. Two waypoints from line spawn endpoints + offset.
  - **ingress** – `waypoint1`, `waypoint2`. Fixed waypoints (for hostiles).

- **ScriptPhase** (for future use)
  - `startTick`, `endTick` – window
  - `events` – e.g. `spawnHostiles`, `policyChange`, `threatEscalation`, `compromiseAgent`

---

## How the worker instantiates scenarios

1. **INIT_SCENARIO** or **RESET**  
   The worker receives `scenarioId` and `seed` (no config object; main thread does not send the full config).

2. **Lookup**  
   `getScenarioConfig(scenarioId)` returns the **ScenarioConfig** for that id (from `scenarioConfigs.ts`).

3. **Instantiate**  
   `instantiateScenario(config, seed)`:
   - Uses `seed` as the base RNG seed (deterministic).
   - For each template in `agentTemplates` then `hostileTemplates`:
     - For each of `count` agents: `spawnPosition(region, index, count, rng)` → position (and optional angle/anchor).
     - Then `waypointsFromPattern(pattern, spawn, rng, region)` → waypoints.
     - Builds **AgentRenderState** (id, type, position, heading, waypoints, trail, decisionState, etc.) with role defaults.
   - If `positionScale` is set, multiplies all positions and waypoints.
   - If `compromiseHostileIndex` is set, sets that hostile’s status and mission text.
   - Returns **InitialSimulationState** `{ agents }`.

4. **Worker state**  
   The worker sets `agents = state.agents`, resets governance stats, and posts **RUN_INITIALIZED** with `agents`.

Persistence and UI are unchanged; they still use the same agent state. Script phases are stored in config but not yet applied during TICK (reserved for future use).

---

## How to add new scenarios

1. **Define a ScenarioConfig** in `scenarioConfigs.ts` (or a new file that you register):
   - Set `id` to a new **ScenarioId** (add the union in `types/simulation.ts` and the option in the dashboard).
   - Set `label`, `description`, `seed`.
   - Set `agentTemplates` (and optionally `hostileTemplates`) with:
     - `role`, `count`, `spawnRegion`, `waypointPattern`, and optional `seedOffset`, `missionObjective`, `speed`, `sensorRangeMeters`.
   - Use **circle** / **grid** / **line** / **anchors** for spawn and **perimeter** / **station** / **corridor** / **ingress** for waypoints so generation stays deterministic from seed.
   - Optionally set `positionScale`, `compromiseHostileIndex`, `policyOverrides`, `scriptPhases`.

2. **Register the config**  
   Add the new config to the `CONFIGS` record in `scenarioConfigs.ts` keyed by the new `ScenarioId`.

3. **UI**  
   Add the new scenario to the scenario dropdown (e.g. in `GovernanceDashboard.tsx`) so users can select it. No worker or engine changes are required; the worker only needs `scenarioId` and `seed`.

No functions or non-JSON values in the config; all randomness comes from `createSeededRandom(seed + templateSeedOffset + agentIndex)` in the engine.
