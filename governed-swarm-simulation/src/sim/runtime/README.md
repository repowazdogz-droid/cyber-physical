# Runtime Coordinator & Architecture

## 1. Runtime architecture summary

- **Main thread (React)**  
  Owns the simulation clock, scenario selection, and policy toggles. It does **not** run any simulation logic (no `advanceAgents`, no `createScenarioAgents` in UI). It creates one **RuntimeCoordinator** inside `SimulationWorkerProvider` and wires it to the store and context.

- **RuntimeCoordinator** (`runtimeCoordinator.ts`)  
  Single place that:
  - Creates and holds the **worker** and **audit sink** (injected via options).
  - Generates **runId** and **startedAt** when a run starts (init or reset).
  - Sends **INIT_SCENARIO**, **RESET**, and **TICK** to the worker.
  - Handles worker messages: on **RUN_INITIALIZED** / **STATE_UPDATE** / **STATE_SNAPSHOT** updates internal state (agents, governanceStats), calls **audit sink** (initRun or append proof batch), and notifies **listeners**.
  - Batches proof records and flushes to the sink every `AUDIT_BATCH_TICKS` (4) via `requestIdleCallback`; on **destroy** flushes remaining buffer synchronously.
  - Exposes **subscribe(listener)** so the React layer can push state into the store and context.

- **Worker**  
  Owns all simulation state and logic (scenario instantiation, advance step, governance, proof bundles, hash chain). Receives only messages (no direct store or DOM access). Sends back state and proof deltas.

- **Store (Zustand)**  
  Holds UI state (selectedAgentId, scenarioId, policy, etc.) and a **mirror** of worker output: `agentsById`, `governanceStats`, `integrityOk`, `integrityIssues`, `threatLevel`. The coordinator’s listener calls `updateAgentsSnapshot(agents)` and `setGovernanceStats(governanceStats)` so the store stays in sync. Integrity and threat level are derived in the store from that data.

- **UI components**  
  **MainSimulationView**: clock + provider; **AgentLayer**: `useSimulationWorker().agents` (and store for selection); **GovernanceDashboard**: store only; **VerificationPanel**: store `agentsById` and `verifyProofChain`. No component runs simulation.

---

## 2. Worker message flow

**Main → Worker**

| Message          | When                    | Payload                          |
|------------------|-------------------------|----------------------------------|
| INIT_SCENARIO    | First run (provider mount) | scenarioId, seed, policy         |
| RESET            | User changed scenario   | scenarioId, seed                 |
| TICK             | Every clock tick (tick > 0) | tick, policy                     |
| REQUEST_STATE    | Optional (e.g. snapshot) | (none)                           |

**Worker → Main**

| Message         | When                    | Payload |
|-----------------|-------------------------|---------|
| RUN_INITIALIZED | After INIT_SCENARIO or RESET | agents  |
| STATE_UPDATE    | After each TICK         | tick, agents, governanceStats, proofBundlesDelta |
| STATE_SNAPSHOT  | After REQUEST_STATE     | agents, governanceStats |

Worker processes messages sequentially (no races). Main thread sends TICK on a fixed interval; RESET is sent when scenario/scenarioRunId changes. Clock resets when scenarioRunId changes, so tick goes back to 0 and TICK(0) is not sent.

---

## 3. Audit pipeline flow

1. **Run start**  
   When the coordinator sends INIT_SCENARIO or RESET, it sets `runId = generateRunId()` and `startedAt = Date.now()`. When the worker replies with **RUN_INITIALIZED**, the coordinator calls `auditSink.initRun(metadata)` with `runId`, `scenarioId`, `seed`, `policySnapshot`, `startedAt`.

2. **Proof archiving**  
   On each **STATE_UPDATE**, the coordinator maps `proofBundlesDelta` to **ProofRecord** (runId, scenarioId, tick, agentId, bundle) and pushes into an in-memory buffer. Every **AUDIT_BATCH_TICKS** (4) ticks it schedules a flush via `requestIdleCallback`; the flush calls `auditSink.appendProofBatch(buffer)` and clears the buffer. Writes are async and do not block the UI.

3. **Teardown**  
   On **destroy()**, the coordinator flushes any remaining buffer synchronously (so no proofs are lost), then terminates the worker and clears refs.

4. **IndexedDB**  
   Sink uses DB `GovernedSwarmAudit`: object store **runs** (keyPath `runId`) for run metadata; object store **proofRecords** (keyPath `id`, autoIncrement) with indexes **runId** and **agentId** for querying by run or agent.

---

## 4. Scenario lifecycle

1. **App load / first view**  
   Provider mounts → coordinator is created (worker + sink) → `startRun(currentScenarioId, seed, policy)` → worker receives INIT_SCENARIO → worker loads config via `getScenarioConfig(scenarioId)`, runs `instantiateScenario(config, seed)` → worker sends RUN_INITIALIZED → coordinator stores runId/startedAt, calls `initRun(metadata)`, updates state and notifies listeners → store and context get initial agents.

2. **Tick loop**  
   Clock advances → provider effect runs → `coordinator.sendTick(tick, policy)` → worker receives TICK → worker runs `advanceAgentsPure`, sends STATE_UPDATE → coordinator updates agents/governanceStats, appends proof records to buffer, maybe flushes, notifies → store and context update; UI re-renders from store/context.

3. **Scenario change**  
   User selects another scenario → store `setScenario(id)` → scenarioRunId increments, clock resets → provider effect runs → `coordinator.resetRun(currentScenarioId, seed)` → worker receives RESET → worker re-instantiates scenario, sends RUN_INITIALIZED → coordinator generates new runId/startedAt, calls `initRun`, notifies → state and store show new run.

4. **Unmount**  
   Provider unmounts → cleanup runs → `coordinator.destroy()` → flush buffer, terminate worker, clear refs.

---

## 5. Remaining limitations

- **No archive UI**  
  Proof bundles are persisted (IndexedDB and optional HTTP sink), but there is no UI to load a past run by `runId` or to inspect archived proofs. `auditSink.getRun(runId)` exists for that purpose.

- **Script phases unused**  
  Scenario configs can define `scriptPhases` (e.g. spawnHostiles, policyChange, compromiseAgent), but the worker does not yet apply them during the tick loop; only initial state (e.g. compromiseHostileIndex) is used.

- **Single worker**  
  One worker per coordinator; no pooling or multiple concurrent runs. Unmounting the provider terminates the worker.

- **Policy only on main thread**  
  Policy is sent with every TICK from the store; the worker does not persist or replay policy changes mid-run beyond what is in the run metadata.

- **Verification panel scope**  
  Verification panel shows in-memory `recentProofBundles` (last 10 per agent) and verifies their chain. It does not yet load or verify full run history from the audit sink.

---

## 6. Recommended next engineering step

**Add an archive / run-inspector UI** that:

1. Calls `auditSink.getRun(runId)` (and optionally lists runIds, e.g. from an index or a separate “runs” query).
2. Displays run metadata (scenarioId, seed, startedAt, policySnapshot) and a paginated or virtualized list of proof records for that run.
3. Reuses the existing verification panel’s chain verification and bundle detail view on the loaded records.

This would validate the audit pipeline end-to-end, confirm IndexedDB schema and query patterns, and give a path to “replay” or audit past runs without adding new runtime features.
