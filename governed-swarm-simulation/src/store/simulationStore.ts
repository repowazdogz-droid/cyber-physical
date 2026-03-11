import { create } from 'zustand'
import type { Agent, PolicyRuleId, ProofBundle, RunSnapshot, ScenarioId } from '../types/simulation'

export interface FreezeFramePayload {
  agentId: string
  agentRole: string
  actionDescription: string
  policyReason: string
  bundle: ProofBundle
}
import { verifyProofChain } from '../sim/governance/governance'

const RUN_HISTORY_MAX_TICKS = 1000

interface PolicyToggleState {
  noFlyZone: boolean
  minSafeDistance: boolean
  escalationProtocol: boolean
  batteryReserve: boolean
}

interface ShadowVerificationState {
  passed: number
  failed: number
}

interface GovernanceStatsState {
  total: number
  allowed: number
  blocked: number
  escalationEvents: number
  isolatedCount: number
  shadowVerification: ShadowVerificationState
}

type ThreatLevel = 'LOW' | 'ELEVATED' | 'HIGH'

export type SimulationSpeed = 0.5 | 1 | 2

interface SimulationUiState {
  selectedAgentId: string | null
  currentScenarioId: ScenarioId
  scenarioRunId: number
  runId: string | null
  isVerificationOpen: boolean
  agentsById: Record<string, Agent>
  followSelectedAgent: boolean
  policy: PolicyToggleState
  governanceStats: GovernanceStatsState
  integrityOk: boolean
  integrityIssues: number
  threatLevel: ThreatLevel
  simulationSpeed: SimulationSpeed
  selectedProofBundle: ProofBundle | null
  /** Result of last "Run Independent Verification"; null = not run yet. */
  independentVerificationResult: boolean | null
  /** Worker did not respond within timeout; operator should reset. */
  workerUnresponsive: boolean
  /** Rolling window of tick snapshots for replay (max 1000). */
  runHistory: RunSnapshot[]
  isReplayMode: boolean
  replayTick: number
  /** 0.5, 1, 2, 4 */
  replaySpeed: number
  /** Active freeze-frame overlay; when set, clock runs at 0.1x. */
  freezeFramePayload: FreezeFramePayload | null
  /** When set, RightPanel opens proof record for this agent. */
  openProofRecordForAgentId: string | null
}

interface SimulationUiActions {
  selectAgent: (agentId: string | null) => void
  setScenario: (scenario: ScenarioId) => void
  setRunId: (runId: string | null) => void
  resetDemo: () => void
  openVerification: () => void
  closeVerification: () => void
  updateAgentsSnapshot: (agents: Agent[]) => void
  setGovernanceStats: (stats: {
    total: number
    allowed: number
    blocked: number
    escalationEvents: number
    isolatedCount?: number
    shadowVerification?: ShadowVerificationState
  }) => void
  togglePolicy: (key: keyof PolicyToggleState) => void
  setSimulationSpeed: (speed: SimulationSpeed) => void
  setSelectedProofBundle: (bundle: ProofBundle | null) => void
  setIndependentVerificationResult: (result: boolean | null) => void
  setWorkerUnresponsive: (value: boolean) => void
  registerGovernanceOutcome: (input: {
    agentId: string
    tick: number
    allowed: boolean
    constraintsTriggered: PolicyRuleId[]
  }) => void
  setFollowSelectedAgent: (value: boolean) => void
  appendRunSnapshot: (snapshot: RunSnapshot) => void
  clearRunHistory: () => void
  setReplayMode: (value: boolean) => void
  setReplayTick: (tick: number) => void
  setReplaySpeed: (speed: 0.5 | 1 | 2 | 4) => void
  getSnapshotAt: (tick: number) => RunSnapshot | undefined
  setFreezeFrame: (payload: FreezeFramePayload | null) => void
  setOpenProofRecordForAgentId: (agentId: string | null) => void
}

type SimulationUiStore = SimulationUiState & SimulationUiActions

export const useSimulationUiStore = create<SimulationUiStore>((set, get) => ({
  selectedAgentId: null,
  currentScenarioId: 'routine_patrol',
  scenarioRunId: 0,
  runId: null,
  isVerificationOpen: false,
  agentsById: {},
  followSelectedAgent: false,
  policy: {
    noFlyZone: true,
    minSafeDistance: true,
    escalationProtocol: true,
    batteryReserve: true,
  },
  governanceStats: {
    total: 0,
    allowed: 0,
    blocked: 0,
    escalationEvents: 0,
    isolatedCount: 0,
    shadowVerification: { passed: 0, failed: 0 },
  },
  integrityOk: true,
  integrityIssues: 0,
  threatLevel: 'LOW',
  simulationSpeed: 1,
  selectedProofBundle: null,
  independentVerificationResult: null,
  workerUnresponsive: false,
  runHistory: [],
  isReplayMode: false,
  replayTick: 0,
  replaySpeed: 1,
  freezeFramePayload: null,
  openProofRecordForAgentId: null,
  selectAgent: (agentId) => set({ selectedAgentId: agentId }),
  setScenario: (scenario) =>
    set((state) => ({
      currentScenarioId: scenario,
      scenarioRunId: state.scenarioRunId + 1,
      selectedAgentId: null,
      followSelectedAgent: false,
      agentsById: {},
      selectedProofBundle: null,
      governanceStats: {
        total: 0,
        allowed: 0,
        blocked: 0,
        escalationEvents: 0,
        isolatedCount: 0,
        shadowVerification: { passed: 0, failed: 0 },
      },
      integrityOk: true,
      integrityIssues: 0,
      independentVerificationResult: null,
      runHistory: [],
      isReplayMode: false,
      replayTick: 0,
      freezeFramePayload: null,
      openProofRecordForAgentId: null,
    })),
  setRunId: (runId) => set({ runId }),
  resetDemo: () => {
    const state = get()
    set({
      currentScenarioId: state.currentScenarioId,
      scenarioRunId: state.scenarioRunId + 1,
      selectedAgentId: null,
      followSelectedAgent: false,
      governanceStats: {
        total: 0,
        allowed: 0,
        blocked: 0,
        escalationEvents: 0,
        isolatedCount: 0,
        shadowVerification: { passed: 0, failed: 0 },
      },
      integrityOk: true,
      integrityIssues: 0,
      independentVerificationResult: null,
      runHistory: [],
      isReplayMode: false,
      replayTick: 0,
    })
  },
  appendRunSnapshot: (snapshot) =>
    set((state) => {
      const next = [...state.runHistory, snapshot]
      if (next.length > RUN_HISTORY_MAX_TICKS) {
        next.splice(0, next.length - RUN_HISTORY_MAX_TICKS)
      }
      return { runHistory: next }
    }),
  clearRunHistory: () => set({ runHistory: [], isReplayMode: false, replayTick: 0 }),
  setReplayMode: (value) => set({ isReplayMode: value }),
  setReplayTick: (tick) => set({ replayTick: tick }),
  setReplaySpeed: (speed) => set({ replaySpeed: speed }),
  getSnapshotAt: (tick) => {
    const history = get().runHistory
    const idx = history.findIndex((s) => s.tick === tick)
    return idx === -1 ? undefined : history[idx]
  },
  setFreezeFrame: (payload) => set({ freezeFramePayload: payload }),
  setOpenProofRecordForAgentId: (agentId) => set({ openProofRecordForAgentId: agentId }),
  openVerification: () => set({ isVerificationOpen: true }),
  closeVerification: () => set({ isVerificationOpen: false }),
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),
  setSelectedProofBundle: (bundle) => set({ selectedProofBundle: bundle }),
  setIndependentVerificationResult: (result) => set({ independentVerificationResult: result }),
  setWorkerUnresponsive: (value) => set({ workerUnresponsive: value }),
  updateAgentsSnapshot: (agents) =>
    set(() => {
      const next: Record<string, Agent> = {}
      agents.forEach((agent) => {
        next[agent.id] = agent
      })

      let integrityOk = true
      let integrityIssues = 0
      for (const agent of Object.values(next)) {
        const bundles = agent.recentProofBundles
        if (bundles.length < 2) continue
        let chainOk = true
        for (let i = 1; i < bundles.length; i++) {
          if (bundles[i].prevHash !== bundles[i - 1].hash) {
            chainOk = false
            break
          }
        }
        if (!chainOk) {
          integrityOk = false
          integrityIssues += 1
        }
      }

      return { agentsById: next, integrityOk, integrityIssues }
    }),
  setGovernanceStats: (stats) =>
    set((state) => {
      const total = stats.total
      const escalationRatio = total > 0 ? stats.escalationEvents / total : 0
      const blockedRatio = total > 0 ? stats.blocked / total : 0
      let threatLevel: ThreatLevel = 'LOW'
      if (escalationRatio > 0.6 || blockedRatio > 0.4) threatLevel = 'HIGH'
      else if (escalationRatio > 0.2 || blockedRatio > 0.2) threatLevel = 'ELEVATED'
      const shadowVerification =
        stats.shadowVerification ?? state.governanceStats.shadowVerification ?? { passed: 0, failed: 0 }
      return {
        governanceStats: {
          total: stats.total,
          allowed: stats.allowed,
          blocked: stats.blocked,
          escalationEvents: stats.escalationEvents,
          isolatedCount: stats.isolatedCount ?? 0,
          shadowVerification,
        },
        threatLevel,
      }
    }),
  togglePolicy: (key) =>
    set((state) => ({
      policy: {
        ...state.policy,
        [key]: !state.policy[key],
      },
    })),
  registerGovernanceOutcome: ({ allowed, constraintsTriggered }) =>
    set((state) => {
      const total = state.governanceStats.total + 1
      const allowedCount = state.governanceStats.allowed + (allowed ? 1 : 0)
      const blocked = state.governanceStats.blocked + (allowed ? 0 : 1)
      const hasEscalation = constraintsTriggered.some(
        (c) => c === 'ESCALATION_PROTOCOL' || c === 'RULES_OF_ENGAGEMENT',
      )
      const escalationEvents =
        state.governanceStats.escalationEvents + (hasEscalation ? 1 : 0)

      let threatLevel: ThreatLevel = state.threatLevel
      const escalationRatio = total > 0 ? escalationEvents / total : 0
      if (escalationRatio > 0.6 || blocked / Math.max(1, total) > 0.4) {
        threatLevel = 'HIGH'
      } else if (escalationRatio > 0.2 || blocked / Math.max(1, total) > 0.2) {
        threatLevel = 'ELEVATED'
      } else {
        threatLevel = 'LOW'
      }

      return {
        governanceStats: {
          total,
          allowed: allowedCount,
          blocked,
          escalationEvents,
          isolatedCount: state.governanceStats.isolatedCount,
          shadowVerification: state.governanceStats.shadowVerification,
        },
        threatLevel,
      }
    }),
  setFollowSelectedAgent: (value) => set({ followSelectedAgent: value }),
}))

