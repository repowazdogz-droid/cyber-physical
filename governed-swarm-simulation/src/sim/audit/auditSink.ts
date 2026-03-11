/**
 * Audit sink: persist proof bundles per run without blocking the simulation.
 * UI continues to use in-memory recent bundles only.
 */

import type { ProofBundle } from '../../types/simulation'
import type { ScenarioId } from '../../types/simulation'

/** Policy snapshot at run start (structured-clone-safe). */
export interface PolicySnapshot {
  noFlyZone: boolean
  minSafeDistance: boolean
  escalationProtocol: boolean
  batteryReserve: boolean
}

export interface RunMetadata {
  runId: string
  scenarioId: ScenarioId
  seed: number
  policySnapshot: PolicySnapshot
  startedAt: number
}

export interface ProofRecord {
  runId: string
  scenarioId: ScenarioId
  tick: number
  agentId: string
  bundle: ProofBundle
}

export interface AuditSink {
  /** Start a new run; call once per run (e.g. on INIT_SCENARIO / RUN_INITIALIZED). */
  initRun(meta: RunMetadata): void | Promise<void>

  /** Append a single proof record. Sinks may batch internally. */
  appendProof(record: ProofRecord): void | Promise<void>

  /** Optional: append a batch in one go (e.g. one IndexedDB transaction). */
  appendProofBatch?(records: ProofRecord[]): void | Promise<void>

  /** Load run metadata and optionally proof records for a run. For archive UI later. */
  getRun(runId: string): Promise<{ meta: RunMetadata; records?: ProofRecord[] }> | { meta: RunMetadata; records?: ProofRecord[] }
}
