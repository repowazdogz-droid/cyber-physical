# Complete Technical Audit — Governed Swarm Simulation

---

## 1. Architecture overview

### 1.1 Overall structure

The application is a **single-page React app** that runs a **deterministic multi-agent simulation** in a **Web Worker**. The main thread owns the clock, UI state, and 3D rendering; the worker owns agent state, the advance step (decision → governance → proof bundle → movement), and proof chains. State is pushed from worker to main via postMessage; the main thread never runs simulation logic.

- **Entry:** `src/main.tsx` — mounts React root, runs proof-chain self-test in dev, renders `<App />`.
- **App shell:** `src/App.tsx` → `src/app/App.tsx` — layout: header + `SimulationClockProvider` wrapping four panel sections and overlays.
- **Simulation flow:** Clock tick (from `SimulationClockContext`) → `SimulationWorkerProvider` receives `tick` and `policy` from store → coordinator `sendTick(tick, policy)` → worker runs `advanceAgentsPure` → worker posts `STATE_UPDATE` (agents, governanceStats, proofBundlesDelta) → coordinator updates state, pushes proof records to audit buffer, optionally runs memory guard and trims agents → notifies subscribers → store and context update → UI re-renders.

### 1.2 Main modules and files

| Path | Role |
|------|------|
| **Types** | |
| `src/types/simulation.ts` | Agent, AgentRenderState, ProofBundle, ProposedAction, AgentDecisionState, PolicyRuleId, ScenarioId, GovernanceEvent, etc. |
| **Store** | |
| `src/store/simulationStore.ts` | Zustand store: selectedAgentId, currentScenarioId, scenarioRunId, runId, agentsById, policy, governanceStats, integrityOk, threatLevel, simulationSpeed, selectedProofBundle, independentVerificationResult, workerUnresponsive; actions: selectAgent, setScenario, resetDemo, updateAgentsSnapshot, setGovernanceStats, togglePolicy, setSimulationSpeed, setSelectedProofBundle, setIndependentVerificationResult, setWorkerUnresponsive, openVerification, closeVerification, setFollowSelectedAgent. |
| **Runtime** | |
| `src/sim/runtime/runtimeCoordinator.ts` | Creates worker and audit sink; startRun (INIT_SCENARIO), resetRun (RESET), sendTick (TICK); subscribes to worker messages; buffers proof records and flushes every 4 ticks; memory guard (checkAndTrim) on every state update; 2s worker response timeout and workerUnresponsive flag; notify(listeners) with agents, governanceStats, runId, workerUnresponsive. |
| **Worker** | |
| `src/sim/worker/simulationWorker.ts` | Web Worker: handles INIT_SCENARIO, RESET, TICK, REQUEST_STATE; holds agents and governanceStats; INIT/RESET → getScenarioConfig + instantiateScenario + post RUN_INITIALIZED; TICK → advanceAgentsPure + post STATE_UPDATE with proofBundlesDelta. |
| `src/sim/worker/messages.ts` | MainToWorkerMessage (INIT_SCENARIO, TICK, RESET, REQUEST_STATE), WorkerToMainMessage (RUN_INITIALIZED, STATE_UPDATE, STATE_SNAPSHOT), GovernanceStatsSnapshot, ShadowVerificationCounts. |
| `src/sim/worker/SimulationWorkerContext.tsx` | React context: creates coordinator (worker + IndexedDB audit sink), startRun on mount with currentScenarioId and DEFAULT_SEED 42, subscribe → updateAgentsSnapshot, setGovernanceStats, setRunId, setWorkerUnresponsive; effect on [currentScenarioId, scenarioRunId] → resetRun; effect on [tick, policy] → sendTick. Exposes { agents, governanceStats }. |
| **Clock** | |
| `src/sim/clock.ts` | useSimulationClock(tickIntervalMs, autoStart, resetKey): setInterval to increment tick; reset when resetKey changes; start/stop/step. |
| `src/sim/clock/SimulationClockContext.tsx` | Provider: tickIntervalMs = 250 / simulationSpeed, resetKey = scenarioRunId; exposes tick, running, start, stop, step, reset. |
| **Scenarios** | |
| `src/sim/scenarios/scenarioConfig.ts` | ScenarioConfig type (id, label, description, seed, agentTemplates, hostileTemplates, positionScale, compromiseHostileIndex), SpawnRegion, WaypointPattern. |
| `src/sim/scenarios/scenarioConfigs.ts` | ROUTINE_PATROL_CONFIG, THREAT_DETECTION_CONFIG, GOVERNANCE_FAILURE_CONFIG, ADVERSARIAL_COORDINATION_ATTACK_CONFIG; getScenarioConfig(id). |
| `src/sim/scenarios/scenarioEngine.ts` | instantiateScenario(config, seed): createSeededRandom(seed + offsets), spawnPosition per template, waypointsFromPattern, build AgentRenderState (id, type, position, waypoints, trail, decisionState, chainHeadHash null, recentProofBundles []); optional positionScale; optional compromiseHostileIndex → one hostile set status COMPROMISED. |
| **Engine** | |
| `src/sim/engine/advanceAgentsPure.ts` | Pure advance: for each agent compute proposedAction by type (PATROL/SURVEILLANCE/ESCORT/HOSTILE), computeDecisionTexts (observe/derive/assume/decide/act), evaluateGovernance, buildProofBundle, shadowVerifyDecision, attach shadowVerification; if blocked → effectiveAction HOLD_POSITION, decisionState updated; advance position; append proof to recentProofBundles (cap 10), chainHeadHash = bundle.hash; trail cap 10–22 by totalDecisionsSoFar. Returns nextAgents, statsDelta, proofBundlesDelta. |
| `src/sim/engine/scenarioAgents.ts` | createInitialAgents() for main-thread use (getState().currentScenarioId, DEFAULT_SEED) → instantiateScenario(getScenarioConfig(scenarioId), seed).agents. Not used by worker; worker uses scenarioEngine directly. |
| **Governance** | |
| `src/sim/governance/governance.ts` | evaluateGovernance(agent, proposedAction, world, policy): no-fly check (NO_GO_ZONES), min distance 14m, battery reserve 15%, escalation (INTERCEPT/WARN/INVESTIGATE), COMPROMISED → COORDINATION_INTEGRITY + COMPROMISED_ISOLATION; blocking list NO_FLY_ZONE, MIN_SAFE_DISTANCE, BATTERY_RESERVE, COMPROMISED_ISOLATION; buildCanonicalProofPayload; buildProofBundle (canonical → sha256Hex → hash); verifyProofChain (prevHash link + hash recompute). |
| `src/sim/governance/shadowVerifier.ts` | shadowVerifyDecision(agent, proposedAction, worldState, policy, prevHash, decisionState, tick, runtimeProofBundle): re-run evaluateGovernance, rebuild canonical, recompute hash; decisionMatches, hashMatches, prevLinkageOk; integrityOk = all three. |
| **Verification** | |
| `src/sim/verification/proofVerifier.ts` | verifyAgentChain(proofBundles): required fields check (prevHash may be null), prevHash linkage, canonical hash recompute per bundle; verifyAllAgents(agentsById); buildRunProofsExport(runId, scenarioId, agentsById). |
| **World** | |
| `src/sim/world/worldConfig.ts` | NO_GO_ZONES (2 boxes), HARBOR_STRUCTURES, INFRASTRUCTURE_MARKERS, WORLD_EXTENTS. |
| `src/sim/world/WorldScene.tsx` | Canvas (R3F), Ocean plane, Coastline, HarborStructures, InfrastructureMarkers, NoGoZones (semi-transparent red), AgentLayer, FollowCameraControls (useFrame camera lerp when followSelectedAgent). |
| **Agents (UI)** | |
| `src/sim/agents/AgentLayer.tsx` | R3F group: maps agents from useSimulationWorker(), sphere + box (heading), optional ring (selected), Line trail; click → selectAgent; getAgentColor(type), ISOLATED → amber. |
| `src/sim/agents/agentModel.ts` | getAgentColor; also contains duplicate/legacy decision logic (createInitialAgents, advanceAgents, etc.) used only from scenarioAgents / old paths — worker uses advanceAgentsPure from engine. |
| **Audit** | |
| `src/sim/audit/auditSink.ts` | AuditSink interface: initRun(meta), appendProof(record), appendProofBatch?(records), getRun(runId). ProofRecord = { runId, scenarioId, tick, agentId, bundle }. |
| `src/sim/audit/indexedDbAuditSink.ts` | createIndexedDbAuditSink(): IndexedDB DB_NAME GovernedSwarmAudit, RUNS_STORE, PROOF_RECORDS_STORE; initRun puts meta; appendProof/add record; getRun reads meta + records by runId index. |
| `src/sim/audit/httpAuditSink.ts` | createHttpAuditSink(): initRun no-op, appendProof/appendProofBatch POST to /proofs (stub; backend not implemented). |
| **Panels** | |
| `src/panels/MainSimulationView.tsx` | Wraps SimulationWorkerProvider(tick) and WorldScene(tick); shows tick and scenario. |
| `src/panels/AgentInspectorPanel.tsx` | Selected agent: id, type, status, battery, speed, sensor, mission; decision cycle (stage, last action, last tick); Governance Trace list of recentProofBundles (click → setSelectedProofBundle); Runtime/Shadow/Chain indicators. |
| `src/panels/GovernanceDashboard.tsx` | Scenario select, governance metrics (total, allowed, blocked, blocked ratio, isolated), threat level, integrity, health; Verification block (Runtime Governance PASS, Shadow Verification PASS/FAIL, Chain Integrity PASS/FAIL, Independent Verification —); policy toggles (no-fly, min distance, escalation, battery); governance_failure warnings when toggles off; follow selected agent, Open Verification Panel. |
| `src/panels/OperatorControlPanel.tsx` | Run ID, scenario select, simulation speed 0.5×/1×/2×, policy toggles, metrics (total, blocked, isolated), Reset demo; workerUnresponsive warning banner. |
| `src/panels/VerificationPanel.tsx` | Modal: hash lookup; primary/secondary agent chain replay and compare; per-bundle detail (runtime hash, recomputed hash, shadow integrity, copy recomputed hash); Run Independent Verification, Export run proofs JSON; playback footer (Pause/Play, Step). |
| `src/panels/GovernanceExplainPanel.tsx` | Overlay when selectedProofBundle set: observe/derive/assume/decide/act, action, governance result, policy rules, reason, runtime hash, shadow recomputed decision/hash/integrity, Copy bundle JSON, Copy hash, Copy recomputed hash, Close. |
| **Dev / hardening** | |
| `src/dev/runScenarioStressTest.ts` | runScenarioStressTest(ticks, scenarioIds): for each scenario instantiateScenario + loop advanceAgentsPure 500 ticks; check agent count stable, no undefined state; return results + log. |
| `src/dev/verifyDeterminism.ts` | verifyDeterminism(scenarioId, seed, tick): run scenario twice to tick, compare first 20 hashes, governance total, first agent position. |
| `src/dev/memoryGuard.ts` | checkAndTrim(agents): if total bundles > 8000 or trail points > 40000 or agents > 120, trim recentProofBundles to 5 and trail to 12 per agent; return trimmed copy (used by coordinator; worker unchanged). |
| `src/dev/proofChainSelfTest.ts` | runProofChainSelfTest(): build 5-bundle synthetic chain, verify linkage and hash; verifyAgentChain(chain). Called from main.tsx in DEV. |
| **Lib** | |
| `src/lib/hash/sha256.ts` | sha256Hex(string): in-browser SHA-256 (no crypto.subtle); used for proof bundle hash. |
| `src/lib/utils/seededRandom.ts` | createSeededRandom(seed): Mulberry32 PRNG, next(), nextInRange(min,max), nextInt(maxExclusive). DEFAULT_SEED 42. |

### 1.3 Dependency map (simplified)

```
main.tsx
  → App.tsx → app/App.tsx
       → SimulationClockProvider (clock context)
            → MainSimulationView → SimulationWorkerProvider (worker context) → WorldScene → AgentLayer
            → AgentInspectorPanel
            → GovernanceDashboard
            → OperatorControlPanel
            → VerificationPanel (conditional)
            → GovernanceExplainPanel

SimulationWorkerProvider
  → createRuntimeCoordinator(createWorker, createIndexedDbAuditSink, generateRunId)
  → coordinator.startRun(scenarioId, 42, policy) on mount
  → coordinator.subscribe → setAgents, setGovernanceStats, updateAgentsSnapshot, setRunId, setWorkerUnresponsive
  → coordinator.sendTick(tick, policy) when [tick, policy] change
  → coordinator.resetRun(scenarioId, 42) when scenario or scenarioRunId change

Worker (simulationWorker.ts)
  → getScenarioConfig, instantiateScenario (scenarioEngine)
  → advanceAgentsPure (engine) → evaluateGovernance, buildProofBundle, shadowVerifyDecision (governance, shadowVerifier)
  → NO_GO_ZONES from worldConfig (governance)

runtimeCoordinator
  → handleMessage: checkAndTrim (memoryGuard) on agents
  → auditBuffer → sink.appendProofBatch (indexedDbAuditSink)
  → notify(state) → store + context

Store (simulationStore)
  ← updateAgentsSnapshot(agents) from coordinator subscriber
  ← setGovernanceStats from coordinator subscriber
  ← setRunId, setWorkerUnresponsive from coordinator
  → policy, currentScenarioId, scenarioRunId, tick (via context) → coordinator
```

---

## 2. Agent system

### 2.1 How many agents exist?

Per scenario (from `scenarioConfigs.ts`):

- **Routine Patrol:** 30 PATROL + 10 SURVEILLANCE + 10 ESCORT = **50 agents**. No hostiles.
- **Threat Detection:** 24 PATROL + 10 SURVEILLANCE + 4 ESCORT + 6 HOSTILE = **44 agents**.
- **Governance Failure:** Same as Routine Patrol (50) with `positionScale: { x: 0.6, y: 1, z: 0.6 }` so agents start closer and trigger more min-distance / no-fly.
- **Adversarial Coordination Attack:** 22 PATROL + 8 SURVEILLANCE + 10 ESCORT + 10 HOSTILE = **50 agents**; `compromiseHostileIndex: 0` so first hostile is COMPROMISED.

So **50 agents** is achieved in Routine Patrol, Governance Failure, and Adversarial; Threat Detection has 44.

### 2.2 How are they spawned?

- **Entry:** Worker receives `INIT_SCENARIO` or `RESET` with `scenarioId` and `seed` (seed is always 42 from `SimulationWorkerContext`; RESET does not send policy, worker keeps current policy).
- **Flow:** `getScenarioConfig(scenarioId)` → `instantiateScenario(config, seed)` in `scenarioEngine.ts`.
- **Per template:** For each entry in `config.agentTemplates` and `config.hostileTemplates`, for each index `i` in count:
  - RNG: `createSeededRandom(baseSeed + seedOffset + i * 100)` (e.g. 42 + 0 + i*100 for first template).
  - **Spawn position:** `spawnPosition(region, i, count, rng)` — circle (angle + jitter), line (linear interpolate + jitter), anchors (one per anchor + jitter), or grid.
  - **Waypoints:** `waypointsFromPattern(pattern, spawn, rng, region)` — perimeter (circle of waypoints), station (single anchor), corridor (forward/back offsets), ingress (two waypoints for hostiles).
  - **Agent:** id = `PATROL_1` style (prefix + index); type from template; position, headingDeg from spawn; speed, sensorRangeMeters, missionObjective from template or ROLE_DEFAULTS; status `ON_MISSION` unless hostile and `i === config.compromiseHostileIndex` → `COMPROMISED`; decisionState = emptyDecisionState(observeNote); chainHeadHash null; recentProofBundles []; waypoints, currentWaypointIndex 0, trail [position].
- **Position scale:** If `config.positionScale` present (governance_failure), multiply position and waypoints by scale.
- **Result:** `InitialSimulationState { agents }`; worker sets `agents = state.agents` and posts `RUN_INITIALIZED`.

So spawning is **deterministic** given scenarioId and seed (42).

### 2.3 Decision-making model

- **Model:** Fixed **OBSERVE → DERIVE → ASSUME → DECIDE → ACT** cycle. Implemented in `advanceAgentsPure`: for each agent a **proposed action** is chosen by type; then **decision texts** (observe, derive, assume, decide, act) are filled from templates keyed by agent type and action kind; then **governance** evaluates the proposed action; then a **proof bundle** is built (and shadow-verified); if blocked, **effective action** becomes HOLD_POSITION and decision texts are overwritten to describe the block.
- **No learning or planning:** Actions are deterministic functions of agent type, waypoints, and tick (e.g. escort alternates forward/back by tick/80; hostile phases by tick/60). No sensor fusion, no world model beyond positions in the current tick.

### 2.4 Reasoning flow from observation to action

1. **Proposed action (by type):**
   - **PATROL:** `computePatrolDecision` — target = waypoints[currentWaypointIndex], MOVE_TO_WAYPOINT to that target.
   - **SURVEILLANCE:** `computeSurveillanceDecision` — anchor = waypoints[0]; if distance to anchor < 6 then MAINTAIN_STATION else MOVE_TO_WAYPOINT to anchor.
   - **ESCORT:** `computeEscortDecision(tick)` — forward/back waypoints; movingForward = (tick/80)%2===0; MAINTAIN_ESCORT to that target.
   - **HOSTILE:** `computeHostileDecision(agent, tick)` — phase = (tick/60)%3; phase 0 INVESTIGATE_CONTACT, 1 INTERCEPT_INTRUDER, 2 HOLD_POSITION.

2. **Decision texts:** `computeDecisionTexts(agent, tick, proposedAction)` — stage = stageOrder[tick % 5]; observe/derive/assume/decide/act are **hardcoded strings** per agent type and action kind (e.g. PATROL: "Monitoring perimeter geometry...", "Route is clear; continuing perimeter sweep.", etc.). So the “reasoning” is **scripted narrative**, not computed from world state.

3. **Governance:** `evaluateGovernance(agent, proposedAction, worldView, policy)` — see §3.

4. **Proof bundle:** `buildProofBundle(agent, proposedAction, decisionState, evaluation, agent.chainHeadHash, tick)` — canonical JSON of (agentId, tick, observe, derive, assume, decide, act, proposedAction, allowed, reason, constraintsTriggered, prevHash) → SHA-256 → hash; bundle includes all of these + timestampMs.

5. **Shadow verifier:** `shadowVerifyDecision(...)` — re-run governance and canonical hash; attach decisionMatches, hashMatches, integrityOk, recomputedHash, allowedRecomputed to bundle.

6. **Movement:** If allowed, `advanceTowards(agent.position, target, step)` with step 4.0 (PATROL), 1.2 (SURVEILLANCE), 2.6 (ESCORT/HOSTILE); else target = agent.position (hold). Waypoint index advances when within 8m of target. Trail appended and trimmed to 10–22 points.

7. **State update:** Agent gets new position, headingDeg, currentWaypointIndex, trail, decisionState, chainHeadHash = proofBundle.hash, recentProofBundles (append, cap 10). If COMPROMISED_ISOLATION triggered, status set to ISOLATED.

So: **observation** is not read from environment; it’s a fixed string. **Derive/assume/decide** are fixed strings. **Action** is the proposed action kind; governance can block it and replace with HOLD_POSITION. The only real “sensing” is in governance (no-fly, min distance, battery, other agents’ positions).

---

## 3. Governance runtime

### 3.1 Is there a policy gate?

**Yes.** `evaluateGovernance` in `governance.ts` is the policy gate. It is called once per agent per tick inside `advanceAgentsPure`, before any state change is applied.

### 3.2 How it works

- **Inputs:** agent, proposedAction, world (tick + agents array), policy (four booleans: noFlyZone, minSafeDistance, escalationProtocol, batteryReserve).
- **Rules (all optional via policy toggles):**
  1. **NO_FLY_ZONE:** Candidate position = proposedAction.targetPosition ?? agent.position; if policy.noFlyZone and position inside any NO_GO_ZONES box → push NO_FLY_ZONE.
  2. **MIN_SAFE_DISTANCE:** If policy.minSafeDistance and action is movement type, for each other agent distance(candidatePosition, other.position) < 14m → push MIN_SAFE_DISTANCE.
  3. **BATTERY_RESERVE:** If policy.batteryReserve and agent.batteryPercent ≤ 15 and movement and not MAINTAIN_STATION → push BATTERY_RESERVE.
  4. **ESCALATION_PROTOCOL / RULES_OF_ENGAGEMENT:** If policy.escalationProtocol and action is INTERCEPT_INTRUDER, WARN_INTRUDER, or INVESTIGATE_CONTACT → push both (informational; not blocking).
  5. **COMPROMISED:** If agent.status === 'COMPROMISED' → push COORDINATION_INTEGRITY, COMPROMISED_ISOLATION.
- **Blocking:** If any of NO_FLY_ZONE, MIN_SAFE_DISTANCE, BATTERY_RESERVE, COMPROMISED_ISOLATION is in constraintsTriggered, allowed = false and reason set from first blocking constraint.
- **Output:** `{ allowed, reason, constraintsTriggered }`.

### 3.3 What happens when an agent proposes an action?

1. Proposed action is computed (see §2.4).
2. `evaluateGovernance(agent, proposedAction, worldView, policy)` is called.
3. If `!evaluation.allowed`: effectiveAction = HOLD_POSITION at current position; decisionState text overwritten to describe block; if COMPROMISED_ISOLATION, agent status set to ISOLATED and isolatedCount incremented.
4. Proof bundle is **always** built (with proposedAction and evaluation result) and appended to the agent’s chain; chainHeadHash and recentProofBundles updated.
5. Shadow verifier runs on the same inputs and result is attached to the bundle.
6. Movement uses effectiveAction (so blocked moves do not move).

### 3.4 Is there a proof bundle generated per decision?

**Yes.** Every agent that has waypoints gets one proof bundle per tick in `advanceAgentsPure`. The bundle is built by `buildProofBundle(agent, proposedAction, decisionState, evaluation, agent.chainHeadHash, tick)` and pushed to `proofBundlesDelta` and to the agent’s `recentProofBundles` (capped at 10).

### 3.5 Are decisions hash-chained?

**Yes.** Each bundle has `prevHash: string | null` (null for the first decision of the run for that agent) and `hash: string`. The chain is:

- `bundle[i].prevHash === (i === 0 ? null : bundle[i-1].hash)`.
- `hash` is SHA-256 of the canonical JSON of (agentId, tick, observe, derive, assume, decide, act, proposedAction, allowed, reason, constraintsTriggered, prevHash).

`verifyProofChain(bundles)` in governance checks linkage and recomputes each hash. The independent verifier in `proofVerifier.ts` does the same using only bundle data.

---

## 4. Simulation environment

### 4.1 What is the world?

A **maritime-themed 3D space**: ocean plane, coastline and land meshes, harbor structures (boxes), infrastructure markers (platform, buoys, cable nodes), and two **no-go zones** (axis-aligned boxes) used by the governance policy. Extents and positions are in `worldConfig.ts` (e.g. ocean 800 units, two NO_GO_ZONES with center/size).

### 4.2 2D or 3D? What framework?

**3D.** Rendered with **React Three Fiber (R3F)** and **Three.js** via `@react-three/fiber` and `@react-three/drei`. The view is a single `<Canvas>` in `WorldScene.tsx` with OrbitControls, fog, lights, and meshes.

### 4.3 What entities exist?

- **Ocean:** Large plane (800×800) at y=0.
- **Coastline:** Two box meshes (coast strip and rotated land).
- **Harbor structures:** Three boxes (main_pier, secondary_pier, offshore_platform).
- **Infrastructure markers:** Five markers (platform cylinder, buoys spheres, cable nodes box + a corridor line).
- **No-go zones:** Two semi-transparent red boxes (harbor_inner_sanctuary, subsea_cable_corridor); used by governance, not by physics.
- **Agents:** Rendered in `AgentLayer` as sphere + small box (heading) + optional ring (selection) + Line (trail). No collision or physics engine; movement is pure `advanceTowards` in the worker.

### 4.4 How do agents interact with the environment and each other?

- **Environment:** Only through **governance**: candidate position is checked against NO_GO_ZONES; no other terrain or obstacle logic. Agents do not “see” structures; they follow waypoints.
- **Each other:** Governance uses `world.agents` to compute distances for MIN_SAFE_DISTANCE (14m). There is no explicit communication channel; “coordination” is only via the shared world view in the policy gate and the compromised-agent isolation (one hostile marked COMPROMISED and then ISOLATED).

---

## 5. Scenarios

### 5.1 Are there predefined scenarios?

**Yes.** Four: `routine_patrol`, `threat_detection`, `governance_failure`, `adversarial_coordination_attack`.

### 5.2 What are they?

- **Routine Patrol:** 50 agents (30 patrol, 10 surveillance, 10 escort), no hostiles. Circle spawn for patrol, anchors for surveillance, line for escort; perimeter/station/corridor waypoints.
- **Threat Detection:** 44 agents (24 patrol, 10 surveillance, 4 escort, 6 hostile). Hostiles spawn on a line and use ingress waypoints toward the area.
- **Governance Failure:** Same as Routine Patrol with `positionScale: { x: 0.6, y: 1, z: 0.6 }` so agents start closer; more blocks expected (min distance, no-fly).
- **Adversarial Coordination Attack:** 50 agents (22 patrol, 8 surveillance, 10 escort, 10 hostile); `compromiseHostileIndex: 0` so first hostile is COMPROMISED and will be isolated by governance.

### 5.3 How are they triggered?

- **Dashboard** and **Operator** panels both have a scenario `<select>` bound to `currentScenarioId`. On change, `setScenario(scenarioId)` is called: store updates `currentScenarioId`, increments `scenarioRunId`, clears selection and resets governance stats.
- **SimulationWorkerProvider** has an effect on `[currentScenarioId, scenarioRunId]`: when the key changes, it calls `coordinator.resetRun(currentScenarioId, DEFAULT_SEED)` (seed always 42). Worker receives RESET, re-runs instantiateScenario, posts RUN_INITIALIZED; coordinator flushes audit buffer, sends new runId, and notifies. So changing the dropdown triggers a full reset with the new scenario.

---

## 6. UI and visualisation

### 6.1 What panels or views exist?

- **Main Simulation View:** 3D canvas (R3F) with world + agents; header shows tick and scenario.
- **Agent Inspector:** Identity/status and decision cycle for selected agent; Governance Trace (recent proof bundles); Runtime/Shadow/Chain indicators; click on a proof row opens Governance Explain overlay.
- **Governance Dashboard:** Scenario select, governance metrics (total, allowed, blocked, ratio, isolated), threat level, integrity, health summary; Verification block (Runtime, Shadow, Chain, Independent); policy toggles; follow selected agent; Open Verification Panel; governance_failure warnings when toggles off.
- **Operator Control Panel:** Run ID, scenario select, speed (0.5×/1×/2×), policy toggles, total/blocked/isolated, Reset demo; worker-unresponsive warning when timeout fires.
- **Verification Panel (modal):** Hash lookup; primary/secondary agent chain replay and comparison; bundle detail (runtime/recomputed hash, shadow integrity, copy recomputed hash); Run Independent Verification; Export run proofs (JSON); playback (Pause/Play, Step).
- **Governance Explain (overlay):** Shown when a proof bundle is selected from the inspector; shows full observe/derive/assume/decide/act, action, result, rules, reason, hashes; Copy bundle JSON, Copy hash, Copy recomputed hash.

### 6.2 Can you inspect individual agents?

**Yes.** Click an agent in the 3D view → `selectAgent(agent.id)` → Inspector shows that agent’s id, type, status, battery, speed, sensor, mission, decision cycle (stage, last action, last tick), and Governance Trace (last 5 proof bundles). Clicking a proof row sets `selectedProofBundle` and opens the Governance Explain overlay.

### 6.3 Can you see governance decisions in real time?

**Yes.** Dashboard shows aggregate governance stats (total, allowed, blocked, isolated) and Verification indicators. Inspector shows per-agent recent proof bundles (tick, action kind, allowed/blocked, reason). Governance Explain shows the full decision and governance result for the selected bundle. Blocked decisions are visible in the 3D view (red ring when selected + blocked).

### 6.4 Is there a verification panel?

**Yes.** “Open Verification Panel” in the Dashboard opens a modal with: hash lookup; primary/secondary agent chain replay and divergence; per-bundle runtime vs recomputed hash and shadow integrity; Run Independent Verification (verifyAllAgents) and Export run proofs; playback controls (Pause/Play, Step). Verification panel does not run the simulation; it operates on current in-memory agents and their recentProofBundles.

---

## 7. Current state

### 7.1 What is working right now

- **Worker lifecycle:** INIT_SCENARIO and RESET produce RUN_INITIALIZED; TICK produces STATE_UPDATE with agents, governanceStats, proofBundlesDelta. Coordinator subscribes and updates store/context; no crashes in normal flow.
- **Clock:** Tick advances at 250ms (or 250/speed); reset on scenario/run change; step for single-tick advance when paused.
- **All four scenarios:** Load and run; agent counts and roles match config; stress test runs 500 ticks per scenario without exceptions.
- **Governance:** No-fly, min distance, battery reserve, escalation tagging, COMPROMISED→ISOLATED; policy toggles are sent to worker each tick and applied. Blocked actions become HOLD_POSITION; proof bundle still emitted.
- **Proof chain:** Every decision produces a bundle; prevHash links to previous bundle; hash = SHA-256(canonical); verifyProofChain and independent verifier both validate chains.
- **Shadow verifier:** Runs after each bundle; attaches decisionMatches, hashMatches, integrityOk, recomputedHash; stats shadowPassed/shadowFailed; UI shows Shadow Verification PASS/FAIL.
- **3D rendering:** Ocean, coastline, structures, no-go zones, agents (sphere + heading box + trail + selection ring); OrbitControls; optional follow camera.
- **Panels:** Main view, Inspector (select agent, trace, open explain), Dashboard (scenario, metrics, toggles, verification indicators, open Verification), Operator (scenario, speed, toggles, reset, worker warning), Verification (hash lookup, replay, independent verify, export, playback), Governance Explain (bundle detail + copy).
- **Audit:** IndexedDB sink is created by the coordinator; proof records are buffered and flushed every 4 ticks; initRun and appendProofBatch are implemented. No UI to browse past runs; getRun exists for a runId.
- **Determinism:** Same scenario + seed 42 produces identical first 20 hashes, governance total, and first agent position at tick 50 (tested).
- **Reset/demo:** Reset demo clears selection and stats, flushes audit buffer, sends RESET with same scenario and seed 42; worker re-inits; first tick after reset is deterministic.
- **Worker watchdog:** 2s timeout per message; on timeout, workerUnresponsive set and UI shows warning; Reset demo clears flag and resets run.
- **Memory guard:** Coordinator runs checkAndTrim on each state update; over limits trim in-memory bundles/trails; worker and audit sink unchanged.

### 7.2 What is partially built

- **Battery:** Governance has BATTERY_RESERVE rule and agents have batteryPercent (init 100), but **battery is never decremented** in advanceAgentsPure. So the rule only fires if something else set battery low (nothing does).
- **Threat level / integrity:** Store derives threatLevel from escalation and blocked ratios; integrityOk from verifyProofChain over all agents. Both are displayed but **no automatic alerts or escalation actions** beyond display.
- **registerGovernanceOutcome:** Exists on the store but is **never called** from the app. Stats are driven entirely by worker STATE_UPDATE. So that action is dead code unless a future path pushes outcomes from elsewhere.
- **HTTP audit sink:** Implemented (POST /proofs) but **not used**; coordinator uses IndexedDB only. Backend not implemented.

### 7.3 What is stubbed or placeholder

- **WorldState (types):** timeOfDay, weather exist in types but are **not used** in governance or rendering. No day/night or weather effects.
- **ProposedAction channels:** WARN_INTRUDER, etc. have optional `channel` and `targetAgentId`; **no inter-agent messaging** is implemented. Escalation is only tagging in constraintsTriggered.
- **getRun (IndexedDB):** Implemented for loading a run by runId; **no UI** to list runs or load one for replay.
- **GovernanceEvent / VerificationResult:** Types exist; no event log or verification result list in the UI beyond the verification panel’s one-shot “Run Independent Verification” result.

### 7.4 What is broken

- **Seed on RESET:** Worker’s handleReset uses `msg.scenarioId` and `msg.seed` for RESET. The coordinator’s resetRun calls `worker.postMessage({ type: 'RESET', scenarioId, seed })` with current scenario and the seed passed to resetRun (which is always 42 from the provider). So **seed is correct**. No bug here.
- **Policy on RESET:** RESET payload does **not** include policy. Worker keeps the previous policy. So after a scenario change, the first RUN_INITIALIZED uses the **current** policy from the last TICK. That is consistent (policy is in main thread store and sent every tick); only the initial run after load gets policy from startRun(..., policy). So no bug.
- **agentModel.ts:** Contains `createInitialAgents`, `advanceAgents`, and other logic that appears to duplicate or predate the worker/engine. The worker does **not** use agentModel for advance; it uses advanceAgentsPure. So agentModel is either dead code or used only from scenarioAgents (createInitialAgents). createInitialAgents is used only if something in the app calls it; the worker path uses instantiateScenario directly. So **agentModel advance path is unused**; only getAgentColor and possibly createInitialAgents are used.

---

## 8. Test coverage

### 8.1 Are there tests?

**Yes.** Vitest; one suite file `src/validation.test.ts`.

### 8.2 What do they cover?

- **Proof chain verification:** Valid two-bundle chain passes verifyProofChain; broken hash fails with brokenIndex 0.
- **Shadow verifier:** One agent, one bundle from buildProofBundle; shadowVerifyDecision yields integrityOk true, decisionMatches and hashMatches true.
- **Independent verifier:** verifyAgentChain passes for a chain from buildProofBundle; fails when hash is tampered; verifyAllAgents with one agent and empty chains returns allValid true.
- **Deterministic scenario init:** instantiateScenario(routine_patrol, 42) twice; same agent count and same first agent position.
- **Governance block/allow:** evaluateGovernance blocks (allowed false, NO_FLY_ZONE) when target in no-fly zone; allows when agent outside no-fly and no other constraints.
- **Proof chain survives reset:** After instantiateScenario + one advanceAgentsPure tick, first agent’s recentProofBundles passed to verifyAgentChain → valid.
- **Scenario stress:** runScenarioStressTest(500) for all four scenarios; all results ok (no exceptions, stable agent count).
- **Determinism check:** verifyDeterminism('routine_patrol', 42, 50) → match true.
- **Proof chain self-test:** runProofChainSelfTest() → ok true.

### 8.3 What is untested

- **Worker thread:** No test runs the actual Web Worker or postMessage protocol.
- **Coordinator:** No test for coordinator (subscribe, buffer flush, memory guard, timeout).
- **Store:** No tests for store actions or derived state (integrity, threat level).
- **UI:** No React Testing Library or E2E tests; no tests for panels or user flows.
- **IndexedDB sink:** No test that writes and reads back proof records.
- **Scenario engine waypoints:** Only init and first-agent position are asserted; waypoint shapes and hostile/escort behaviour are not tested.
- **Governance edge cases:** Only one no-fly and one allow case; no tests for min distance, battery, or COMPROMISED isolation.

---

## 9. Tech stack

| Category | Dependency | Version (package.json) |
|----------|------------|------------------------|
| Runtime | React | ^19.2.0 |
| Runtime | react-dom | ^19.2.0 |
| 3D | three | ^0.183.2 |
| 3D | @react-three/fiber | ^9.5.0 |
| 3D | @react-three/drei | ^10.7.7 |
| State | zustand | ^5.0.11 |
| Build | Vite | ^7.3.1 |
| Build | TypeScript | ~5.9.3 |
| Build | @vitejs/plugin-react | ^5.1.1 |
| Test | vitest | ^3.2.4 |
| Lint | eslint | ^9.39.1 |
| Lint | @eslint/js | ^9.39.1 |
| Lint | typescript-eslint | ^8.48.0 |
| Lint | eslint-plugin-react-hooks | ^7.0.1 |
| Lint | eslint-plugin-react-refresh | ^0.4.24 |
| Types | @types/node | ^24.10.1 |
| Types | @types/react | ^19.2.7 |
| Types | @types/react-dom | ^19.2.3 |
| Lint | globals | ^16.5.0 |

**No backend, no auth, no database other than browser IndexedDB.** Hash is custom in-browser SHA-256 (`src/lib/hash/sha256.ts`). RNG is Mulberry32 in `src/lib/utils/seededRandom.ts`.

---

## 10. Gap analysis vs target spec

Target: **50 autonomous agents in a maritime 3D environment, every decision governed through a deterministic policy gate, hash-chained proof bundles per agent, four UI panels (main simulation, agent inspector, governance dashboard, verification panel), four scenarios (routine patrol, threat detection, governance failure demo, adversarial coordination attack), seeded random with seed 42.**

| Requirement | Status | Detail |
|-------------|--------|--------|
| **50 autonomous agents** | **Met for 3 of 4 scenarios** | Routine Patrol, Governance Failure, Adversarial each have 50 agents. Threat Detection has 44. All are “autonomous” in the sense of scripted-by-type behaviour; no learning or planning. |
| **Maritime 3D environment** | **Met** | Ocean, coastline, harbor, no-go zones, 3D R3F rendering. No waves or water simulation; theming is maritime. |
| **Every decision governed through a deterministic policy gate** | **Met** | evaluateGovernance runs for every agent every tick; policy toggles (no-fly, min distance, escalation, battery) are deterministic; same inputs → same allowed/reason. |
| **Hash-chained proof bundles per agent** | **Met** | One proof bundle per agent per tick; prevHash links to previous bundle; hash = SHA-256(canonical); chain verified by verifyProofChain and independent verifier. |
| **Four UI panels** | **Met** | Main simulation (3D view), Agent Inspector, Governance Dashboard, Verification Panel. Plus Operator Control Panel and Governance Explain overlay. |
| **Four scenarios** | **Met** | routine_patrol, threat_detection, governance_failure, adversarial_coordination_attack; all selectable and runnable; stress test passes for all. |
| **Seeded random with seed 42** | **Met** | instantiateScenario(config, 42) used on start and on reset; createSeededRandom(42 + offsets) for spawn and waypoints; determinism test passes. |

**What is missing or weak vs a “full” spec:**

- **Autonomy:** Agents do not reason from sensor data; they follow type-based scripts. Observation/derive/assume/decide/act are fixed strings, not computed from world state (except that governance uses world.agents for distance checks).
- **Battery:** Field exists and governance rule exists but battery is never depleted in the engine; rule will never fire in current run.
- **Event log / run browser:** No UI to list past runs or replay from IndexedDB.
- **Tests:** No worker or coordinator or UI tests; no tests for min distance, battery, or COMPROMISED flow.
- **agentModel.ts:** Unused advance logic and possible dead code; only getAgentColor (and maybe createInitialAgents) are clearly used.

**Honest summary:** The system **meets** the stated target: 50 agents (in 3 scenarios), maritime 3D, deterministic policy gate, hash-chained proofs, four panels, four scenarios, seed 42. What is **real** is the simulation loop, governance, proof bundles, shadow and independent verification, 3D rendering, and panel set. What is **simplified or stubbed** is agent “reasoning” (scripted text), battery consumption, run history UI, and full test coverage. Nothing critical is **broken** for the demo; the main gap is depth of agent autonomy and some unfinished or unused pieces (battery drain, registerGovernanceOutcome, HTTP sink, world state usage).
