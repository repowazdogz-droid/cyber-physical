/* eslint-disable react-refresh/only-export-components -- context file exports provider and hook */
import type { FC, ReactNode } from 'react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { AgentRenderState } from '../../types/simulation'
import type { GovernanceStatsSnapshot } from './messages'
import { useSimulationUiStore } from '../../store/simulationStore'
import {
  createRuntimeCoordinator,
  type RuntimeCoordinator,
} from '../runtime/runtimeCoordinator'
import { createIndexedDbAuditSink } from '../audit/indexedDbAuditSink'

interface SimulationWorkerContextValue {
  agents: AgentRenderState[]
  governanceStats: GovernanceStatsSnapshot
}

const SimulationWorkerContext = createContext<SimulationWorkerContextValue | null>(null)

const DEFAULT_SEED = 42

export function useSimulationWorker(): SimulationWorkerContextValue {
  const ctx = useContext(SimulationWorkerContext)
  if (!ctx) throw new Error('useSimulationWorker must be used within SimulationWorkerProvider')
  return ctx
}

interface SimulationWorkerProviderProps {
  tick: number
  children: ReactNode
}

export const SimulationWorkerProvider: FC<SimulationWorkerProviderProps> = ({ tick, children }) => {
  const [agents, setAgents] = useState<AgentRenderState[]>([])
  const [governanceStats, setGovernanceStatsState] = useState<GovernanceStatsSnapshot>({
    total: 0,
    allowed: 0,
    blocked: 0,
    escalationEvents: 0,
  })
  const coordinatorRef = useRef<RuntimeCoordinator | null>(null)
  const scenarioKeyRef = useRef<string | null>(null)

  const currentScenarioId = useSimulationUiStore((s) => s.currentScenarioId)
  const scenarioRunId = useSimulationUiStore((s) => s.scenarioRunId)
  const policy = useSimulationUiStore((s) => s.policy)
  const updateAgentsSnapshot = useSimulationUiStore((s) => s.updateAgentsSnapshot)
  const setGovernanceStats = useSimulationUiStore((s) => s.setGovernanceStats)
  const setRunId = useSimulationUiStore((s) => s.setRunId)
  const appendRunSnapshot = useSimulationUiStore((s) => s.appendRunSnapshot)
  const clearRunHistory = useSimulationUiStore((s) => s.clearRunHistory)

  useEffect(() => {
    const coordinator = createRuntimeCoordinator({
      createWorker: () =>
        new Worker(new URL('./simulationWorker.ts', import.meta.url), { type: 'module' }),
      createAuditSink: () => createIndexedDbAuditSink(),
      generateRunId: () =>
        `run-${useSimulationUiStore.getState().scenarioRunId}-${Date.now()}`,
    })
    coordinatorRef.current = coordinator

    const key = `${currentScenarioId}-${scenarioRunId}`
    scenarioKeyRef.current = key
    clearRunHistory()
    coordinator.startRun(currentScenarioId, DEFAULT_SEED, policy)

    const unsubscribe = coordinator.subscribe((state) => {
      setAgents(state.agents)
      setGovernanceStatsState(state.governanceStats)
      setRunId(state.runId ?? null)
      updateAgentsSnapshot(state.agents)
      setGovernanceStats({
        ...state.governanceStats,
        isolatedCount: state.governanceStats.isolatedCount ?? 0,
        shadowVerification: state.governanceStats.shadowVerification ?? { passed: 0, failed: 0 },
      })
      useSimulationUiStore.getState().setWorkerUnresponsive(state.workerUnresponsive ?? false)
      if (state.runSnapshot) appendRunSnapshot(state.runSnapshot)
    })

    return () => {
      unsubscribe()
      coordinator.destroy()
      coordinatorRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- init once

  useEffect(() => {
    const coordinator = coordinatorRef.current
    if (!coordinator) return
    const key = `${currentScenarioId}-${scenarioRunId}`
    if (scenarioKeyRef.current !== key) {
      scenarioKeyRef.current = key
      clearRunHistory()
      coordinator.resetRun(currentScenarioId, DEFAULT_SEED)
    }
  }, [currentScenarioId, scenarioRunId, clearRunHistory])

  useEffect(() => {
    const coordinator = coordinatorRef.current
    if (!coordinator || tick <= 0) return
    coordinator.sendTick(tick, policy)
  }, [tick, policy])

  const value: SimulationWorkerContextValue = { agents, governanceStats }

  return (
    <SimulationWorkerContext.Provider value={value}>
      {children}
    </SimulationWorkerContext.Provider>
  )
}
