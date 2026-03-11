/**
 * Runtime coordinator: single place for worker lifecycle, audit sink, run metadata,
 * tick forwarding, state updates, and proof archiving. No React dependency.
 */

import type { AgentRenderState, AgentStateSnapshot, RunSnapshot } from '../../types/simulation'
import type { ScenarioId } from '../../types/simulation'
import type { GovernancePolicyConfig } from '../governance/governance'
import type { AuditSink, ProofRecord, RunMetadata } from '../audit/auditSink'
import type { GovernanceStatsSnapshot } from '../worker/messages'
import type { WorkerToMainMessage } from '../worker/messages'
import { checkAndTrim } from '../../dev/memoryGuard'

const AUDIT_BATCH_TICKS = 4
const WORKER_RESPONSE_MS = 2000

export interface RuntimeState {
  agents: AgentRenderState[]
  governanceStats: GovernanceStatsSnapshot
  runId: string | null
  workerUnresponsive?: boolean
  runSnapshot?: RunSnapshot
}

export type StateListener = (state: RuntimeState) => void

export interface RuntimeCoordinatorOptions {
  createWorker: () => Worker
  createAuditSink: () => AuditSink
  /** Generate a unique run id (e.g. run-{scenarioRunId}-{timestamp}). */
  generateRunId: () => string
}

export interface RuntimeCoordinator {
  /** Start a new run (e.g. app mount). Sends INIT_SCENARIO; runId/startedAt set; initRun called on RUN_INITIALIZED. */
  startRun(scenarioId: ScenarioId, seed: number, policy: GovernancePolicyConfig): void
  /** Reset to a new run (scenario change). Sends RESET; new runId/startedAt; initRun on RUN_INITIALIZED. */
  resetRun(scenarioId: ScenarioId, seed: number): void
  /** Forward tick to worker. No-op if tick <= 0. */
  sendTick(tick: number, policy: GovernancePolicyConfig): void
  /** Subscribe to state updates (agents, governanceStats). Called after each RUN_INITIALIZED / STATE_UPDATE / STATE_SNAPSHOT. */
  subscribe(listener: StateListener): () => void
  /** Terminate worker and flush audit buffer. Call on unmount. */
  destroy(): void
  /** Flush audit buffer and start a new run with same scenario/seed (deterministic demo reset). */
  resetDemo(scenarioId: ScenarioId, seed: number): void
}

export function createRuntimeCoordinator(
  options: RuntimeCoordinatorOptions,
): RuntimeCoordinator {
  const { createWorker, createAuditSink, generateRunId } = options

  let worker: Worker | null = null
  let sink: AuditSink | null = null
  let runId: string | null = null
  let startedAt = 0
  let currentSeed = 0
  let currentScenarioId: ScenarioId = 'routine_patrol'
  let currentPolicy: GovernancePolicyConfig = {
    noFlyZone: true,
    minSafeDistance: true,
    escalationProtocol: true,
    batteryReserve: true,
  }

  let agents: AgentRenderState[] = []
  let governanceStats: GovernanceStatsSnapshot = {
    total: 0,
    allowed: 0,
    blocked: 0,
    escalationEvents: 0,
    isolatedCount: 0,
    shadowVerification: { passed: 0, failed: 0 },
  }
  let workerUnresponsive = false
  let workerResponseTimeoutId: ReturnType<typeof setTimeout> | null = null

  const listeners = new Set<StateListener>()
  const auditBuffer: ProofRecord[] = []
  let flushScheduled = false

  function clearWorkerResponseTimeout(): void {
    if (workerResponseTimeoutId !== null) {
      clearTimeout(workerResponseTimeoutId)
      workerResponseTimeoutId = null
    }
  }

  function scheduleWorkerResponseTimeout(): void {
    clearWorkerResponseTimeout()
    workerResponseTimeoutId = setTimeout(() => {
      workerResponseTimeoutId = null
      if (!worker) return
      workerUnresponsive = true
      console.error('[RuntimeCoordinator] Worker did not respond within 2s; demo may be unresponsive. Use Reset demo to recover.')
      notify()
    }, WORKER_RESPONSE_MS)
  }

  function buildRunSnapshot(
    agentsList: AgentRenderState[],
    proofBundlesDelta: { agentId: string; proposedAction: { kind: string }; act: string; allowed: boolean; reason: string; targetAgentId?: string; distanceAtBlock?: number }[],
    tick: number,
  ): RunSnapshot {
    const agentStates: AgentStateSnapshot[] = agentsList.map((agent) => {
      const bundle = proofBundlesDelta.find((b) => b.agentId === agent.id)
      const governanceResult: 'ALLOWED' | 'BLOCKED' = bundle?.allowed ? 'ALLOWED' : 'BLOCKED'
      const out: AgentStateSnapshot = {
        id: agent.id,
        position: [agent.position.x, agent.position.y, agent.position.z],
        status: agent.status,
        battery: agent.batteryPercent,
        action: bundle?.proposedAction?.kind ?? 'HOLD_POSITION',
        decisionText: bundle?.act ?? '',
        governanceResult,
      }
      if (bundle && !bundle.allowed && bundle.reason) out.blockReason = bundle.reason
      if (bundle?.targetAgentId !== undefined) out.targetAgentId = bundle.targetAgentId
      if (bundle?.distanceAtBlock !== undefined) out.distance = bundle.distanceAtBlock
      return out
    })
    return { tick, agentStates, timestamp: Date.now() }
  }

  function notify(): void {
    const state: RuntimeState = { agents, governanceStats, runId, workerUnresponsive }
    listeners.forEach((fn) => fn(state))
  }

  function scheduleAuditFlush(): void {
    if (flushScheduled || !sink || auditBuffer.length === 0) return
    flushScheduled = true
    const run = (): void => {
      flushScheduled = false
      if (!sink) return
      const batch = [...auditBuffer]
      auditBuffer.length = 0
      if (sink.appendProofBatch) {
        sink.appendProofBatch(batch)
      } else {
        batch.forEach((r) => sink!.appendProof(r))
      }
    }
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(run, { timeout: 200 })
    } else {
      setTimeout(run, 0)
    }
  }

  function handleMessage(event: MessageEvent<WorkerToMainMessage>): void {
    clearWorkerResponseTimeout()
    workerUnresponsive = false
    const msg = event.data
    switch (msg.type) {
      case 'RUN_INITIALIZED': {
        const guard = checkAndTrim(msg.agents)
        agents = guard.agents
        governanceStats = {
          total: 0,
          allowed: 0,
          blocked: 0,
          escalationEvents: 0,
          isolatedCount: 0,
          shadowVerification: { passed: 0, failed: 0 },
        }
        if (runId && sink) {
          const meta: RunMetadata = {
            runId,
            scenarioId: currentScenarioId,
            seed: currentSeed,
            policySnapshot: currentPolicy,
            startedAt,
          }
          sink.initRun(meta)
        }
        notify()
        break
      }
      case 'STATE_UPDATE': {
        const guard = checkAndTrim(msg.agents)
        agents = guard.agents
        governanceStats = msg.governanceStats
        if (runId && msg.proofBundlesDelta?.length && sink) {
          const rid = runId
          const scenarioId = currentScenarioId
          msg.proofBundlesDelta.forEach((bundle) => {
            auditBuffer.push({
              runId: rid,
              scenarioId,
              tick: msg.tick,
              agentId: bundle.agentId,
              bundle,
            })
          })
          if (msg.tick % AUDIT_BATCH_TICKS === 0) {
            scheduleAuditFlush()
          }
        }
        const runSnapshot =
          msg.proofBundlesDelta?.length > 0
            ? buildRunSnapshot(guard.agents, msg.proofBundlesDelta, msg.tick)
            : undefined
        const state: RuntimeState = {
          agents,
          governanceStats,
          runId,
          workerUnresponsive,
          ...(runSnapshot && { runSnapshot }),
        }
        listeners.forEach((fn) => fn(state))
        break
      }
      case 'STATE_SNAPSHOT': {
        const guard = checkAndTrim(msg.agents)
        agents = guard.agents
        governanceStats = msg.governanceStats
        notify()
        break
      }
      default:
        break
    }
  }

  function ensureStarted(): void {
    if (worker) return
    worker = createWorker()
    sink = createAuditSink()
    worker.onmessage = handleMessage
  }

  function startRun(scenarioId: ScenarioId, seed: number, policy: GovernancePolicyConfig): void {
    ensureStarted()
    runId = generateRunId()
    startedAt = Date.now()
    currentSeed = seed
    currentScenarioId = scenarioId
    currentPolicy = policy
    worker!.postMessage({ type: 'INIT_SCENARIO', scenarioId, seed, policy })
    scheduleWorkerResponseTimeout()
  }

  function resetRun(scenarioId: ScenarioId, seed: number): void {
    if (!worker) return
    clearWorkerResponseTimeout()
    workerUnresponsive = false
    agents = []
    governanceStats = {
      total: 0,
      allowed: 0,
      blocked: 0,
      escalationEvents: 0,
      isolatedCount: 0,
      shadowVerification: { passed: 0, failed: 0 },
    }
    notify()
    flushScheduled = true
    if (sink && auditBuffer.length > 0) {
      const batch = [...auditBuffer]
      auditBuffer.length = 0
      if (sink.appendProofBatch) sink.appendProofBatch(batch)
      else batch.forEach((r) => sink!.appendProof(r))
    }
    runId = generateRunId()
    startedAt = Date.now()
    currentSeed = seed
    currentScenarioId = scenarioId
    worker.postMessage({ type: 'RESET', scenarioId, seed })
    scheduleWorkerResponseTimeout()
  }

  function resetDemo(scenarioId: ScenarioId, seed: number): void {
    resetRun(scenarioId, seed)
  }

  function sendTick(tick: number, policy: GovernancePolicyConfig): void {
    if (!worker || tick <= 0) return
    currentPolicy = policy
    worker.postMessage({ type: 'TICK', tick, policy })
    scheduleWorkerResponseTimeout()
  }

  function subscribe(listener: StateListener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function destroy(): void {
    clearWorkerResponseTimeout()
    flushScheduled = true
    if (sink && auditBuffer.length > 0) {
      const batch = [...auditBuffer]
      auditBuffer.length = 0
      if (sink.appendProofBatch) {
        sink.appendProofBatch(batch)
      } else {
        batch.forEach((r) => sink!.appendProof(r))
      }
    }
    if (worker) {
      worker.terminate()
      worker = null
    }
    sink = null
    runId = null
    listeners.clear()
    auditBuffer.length = 0
  }

  return {
    startRun,
    resetRun,
    sendTick,
    subscribe,
    destroy,
    resetDemo,
  }
}
