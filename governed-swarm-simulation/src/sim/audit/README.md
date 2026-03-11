# Persistent Audit Sink

## How proof bundles are persisted

1. **Source**  
   The simulation worker sends `STATE_UPDATE` messages that include `proofBundlesDelta`: an array of `ProofBundle` (one per agent per tick). The main thread does not run the simulation; it only receives these deltas.

2. **Conversion**  
   On each `STATE_UPDATE`, the main thread turns every item in `proofBundlesDelta` into a **ProofRecord**:
   - `runId` – current run (set when the run starts)
   - `scenarioId` – from the store at message time
   - `tick` – from the message
   - `agentId` – from the bundle
   - `bundle` – the full `ProofBundle`

3. **Buffering**  
   Records are pushed onto an in-memory buffer. The main thread does **not** call the sink on every tick; it batches.

4. **Batched writes**  
   Every **AUDIT_BATCH_TICKS** (e.g. 4) ticks, a flush is scheduled. The flush runs in `requestIdleCallback` (or `setTimeout(0)` if unavailable) so it does not block the UI. The sink’s `appendProofBatch(records)` is called once per flush with all buffered records; the buffer is then cleared. On provider unmount, a final flush is scheduled so no records are dropped.

5. **Sink implementations**  
   - **IndexedDB** (`indexedDbAuditSink.ts`): appends records to an object store with `runId` and `agentId` indexes. Writes are async and non-blocking.  
   - **HTTP** (`httpAuditSink.ts`): POSTs batches to `/proofs`. Backend is not implemented; failures are ignored so the simulation is unaffected.

The **Verification panel** and the rest of the UI still use **in-memory** data only (e.g. `agentsById` and each agent’s `recentProofBundles`). Persistence is for audit/archive; loading from the archive is optional and can be added later.

---

## Run metadata structure

Each run is described by **RunMetadata** when the run starts (on `RUN_INITIALIZED`, after `INIT_SCENARIO` or `RESET`):

- **runId** – Unique id for this run (e.g. `run-{scenarioRunId}-{timestamp}`).
- **scenarioId** – Scenario preset (e.g. `routine_patrol`, `threat_detection`).
- **seed** – Numeric seed used for deterministic scenario creation.
- **policySnapshot** – Policy at run start:  
  `{ noFlyZone, minSafeDistance, escalationProtocol, batteryReserve }` (all booleans).
- **startedAt** – `Date.now()` when the run started.

This is passed to `auditSink.initRun(meta)` once per run. The IndexedDB sink stores it in the `runs` store keyed by `runId`. Proof records reference the same `runId` so they can be queried by run (and by `agentId` via index).

---

## How persistence is decoupled from simulation

- **Worker**  
  The simulation worker only computes state and sends `STATE_UPDATE` with `proofBundlesDelta`. It has no notion of audit, IndexedDB, or HTTP. It does not block on I/O.

- **Main thread**  
  When the main thread receives `STATE_UPDATE`, it:
  1. Updates React state and the UI store (agents, governance stats) so the UI stays responsive.
  2. Converts `proofBundlesDelta` to `ProofRecord[]` and appends to a buffer.
  3. Every few ticks, schedules a flush (e.g. via `requestIdleCallback`). The actual write runs later, off the critical path.

- **No blocking**  
  `appendProof` / `appendProofBatch` are never called synchronously in the message handler. Flush runs in an idle callback or timer, so the simulation loop (worker) and the UI thread are not blocked by persistence.

- **Failure isolation**  
  Sink errors (e.g. IndexedDB unavailable, HTTP 404) are caught and ignored so they do not affect rendering or the simulation.

- **UI unchanged**  
  The Verification panel and other features still read from the in-memory store and agent `recentProofBundles`. Archive loading (e.g. `auditSink.getRun(runId)`) is optional and not required for current UI behaviour.
