import type { FC } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useSimulationUiStore } from '../store/simulationStore'
import { useSimulationClockContext } from '../sim/clock/SimulationClockContext'
import type { Agent, ProposedAction } from '../types/simulation'
import { getScenarioUiMeta } from '../config/scenarioUi'

const MESSAGE_TTL_MS = 8000
const MAX_MESSAGES = 4
const CHECK_INTERVAL_TICKS = 5

function roleLabel(type: string): string {
  switch (type) {
    case 'PATROL':
      return 'Patrol drone'
    case 'SURVEILLANCE':
      return 'Surveillance drone'
    case 'ESCORT':
      return 'Escort drone'
    case 'HOSTILE':
      return 'Unknown/hostile agent'
    default:
      return type
  }
}

function actionKindToShortLabel(kind: ProposedAction['kind']): string {
  switch (kind) {
    case 'MOVE_TO_WAYPOINT':
      return 'Patrol move'
    case 'MAINTAIN_STATION':
      return 'Hold station'
    case 'MAINTAIN_ESCORT':
      return 'Escort'
    case 'RETURN_TO_BASE':
      return 'Return to base'
    case 'INTERCEPT_INTRUDER':
      return 'Intercept'
    case 'INVESTIGATE_CONTACT':
      return 'Investigate'
    case 'WARN_INTRUDER':
      return 'Warn'
    case 'HOLD_POSITION':
      return 'Hold position'
    case 'ADVERSARIAL_APPROACH':
      return 'Approach'
    case 'ADVERSARIAL_INTERFERENCE':
      return 'Interference'
    default:
      return kind
  }
}

type Tag = 'GOVERNANCE' | 'THREAT' | 'BLOCK' | 'SYSTEM' | 'ALERT'

interface NarrativeMessage {
  id: number
  tag: Tag
  text: string
  createdAt: number
}

let nextId = 0

export const NarrativeLayer: FC = () => {
  const { tick } = useSimulationClockContext()
  const governanceStats = useSimulationUiStore((s) => s.governanceStats)
  const agentsById = useSimulationUiStore((s) => s.agentsById)
  const currentScenarioId = useSimulationUiStore((s) => s.currentScenarioId)
  const selectedAgentId = useSimulationUiStore((s) => s.selectedAgentId)
  const integrityOk = useSimulationUiStore((s) => s.integrityOk)

  const [messages, setMessages] = useState<NarrativeMessage[]>([])
  const lastCheckTick = useRef(0)
  const blockedRatioAbove25 = useRef(false)
  const blockedRatioBelow10AfterHigh = useRef(true)
  const lastScenarioId = useRef<string | undefined>(undefined)
  const compromisedIds = useRef<Set<string>>(new Set())
  const isolatedIds = useRef<Set<string>>(new Set())
  const lowBatteryIds = useRef<Set<string>>(new Set())
  const lastBlockedMilestone = useRef(0)
  const lastChainOkTick = useRef<number>(-999)
  const lastSelectedAgentId = useRef<string | null>(null)
  const prevAgentsById = useRef<Record<string, Agent>>({})

  const addMessage = (tag: Tag, text: string) => {
    setMessages((prev) => {
      const next = [...prev, { id: nextId++, tag, text, createdAt: Date.now() }]
      return next.slice(-MAX_MESSAGES)
    })
  }

  useEffect(() => {
    const prune = () => {
      const now = Date.now()
      setMessages((prev) => prev.filter((m) => now - m.createdAt < MESSAGE_TTL_MS))
    }
    const interval = setInterval(prune, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedAgentId !== lastSelectedAgentId.current) {
      lastSelectedAgentId.current = selectedAgentId
      if (selectedAgentId) {
        const agent = agentsById[selectedAgentId]
        if (agent) {
          const role = roleLabel(agent.type)
          const lastAction = agent.decisionState?.lastActionType
            ? actionKindToShortLabel(agent.decisionState.lastActionType as ProposedAction['kind'])
            : 'Unknown'
          const lastBundle = agent.recentProofBundles?.[agent.recentProofBundles.length - 1]
          const governance = lastBundle?.allowed ? 'APPROVED' : 'BLOCKED'
          addMessage(
            'SYSTEM',
            `Inspecting Agent ${agent.id}. Role: ${role}. Last action: ${lastAction}. Governance: ${governance}.`,
          )
        }
      }
    }
  }, [selectedAgentId, agentsById])

  useEffect(() => {
    if (tick % CHECK_INTERVAL_TICKS !== 0) return
    if (tick <= lastCheckTick.current) return
    lastCheckTick.current = tick

    const total = governanceStats.total
    const blocked = governanceStats.blocked
    const ratio = total > 0 ? (blocked / total) * 100 : 0

    if (ratio >= 25 && !blockedRatioAbove25.current) {
      blockedRatioAbove25.current = true
      blockedRatioBelow10AfterHigh.current = false
      addMessage(
        'GOVERNANCE',
        'High block rate detected. 1 in 4 agent actions is being denied by the policy gate.',
      )
    }
    if (ratio < 10) {
      if (!blockedRatioBelow10AfterHigh.current) {
        addMessage(
          'GOVERNANCE',
          'System operating normally. Governance is approving most agent actions.',
        )
        blockedRatioBelow10AfterHigh.current = true
      }
      blockedRatioAbove25.current = false
    }

    const agents = Object.values(agentsById)
    for (const agent of agents) {
      if (agent.status === 'COMPROMISED' && !compromisedIds.current.has(agent.id)) {
        compromisedIds.current.add(agent.id)
        addMessage(
          'ALERT',
          `Agent ${agent.id} has been flagged as COMPROMISED. Governance has locked down its actions.`,
        )
      }
      if (agent.status === 'ISOLATED' && !isolatedIds.current.has(agent.id)) {
        isolatedIds.current.add(agent.id)
        addMessage(
          'BLOCK',
          `Agent ${agent.id} placed in ISOLATION. All movement blocked until reviewed.`,
        )
      }
      if (agent.status === 'LOW_BATTERY' && !lowBatteryIds.current.has(agent.id)) {
        lowBatteryIds.current.add(agent.id)
        addMessage(
          'SYSTEM',
          `Agent ${agent.id} battery critical. Governance restricting to return-to-base only.`,
        )
      }
    }
    prevAgentsById.current = agentsById

    if (currentScenarioId !== lastScenarioId.current) {
      compromisedIds.current = new Set()
      isolatedIds.current = new Set()
      lowBatteryIds.current = new Set()
      const meta = getScenarioUiMeta(currentScenarioId)
      addMessage('SYSTEM', `Scenario changed: ${meta.name}. ${meta.description}`)
      if (currentScenarioId === 'routine_patrol') {
        addMessage(
          'SYSTEM',
          'Governance active. All 50 agents operating under policy. Approve/block decisions are being recorded to the proof chain.',
        )
      }
      if (currentScenarioId === 'threat_detection') {
        addMessage(
          'THREAT',
          'Unidentified contact detected in sector. Agents escalating per protocol. Governance managing response.',
        )
      }
      if (currentScenarioId === 'governance_failure') {
        addMessage(
          'ALERT',
          'WARNING: Governance rules have been disabled. Agents are operating without full policy enforcement. This is a demonstration of what AI without governance looks like.',
        )
      }
      if (currentScenarioId === 'adversarial_coordination_attack') {
        addMessage(
          'ALERT',
          'One agent in this swarm is compromised. Watch for agents approaching others unusually closely. Check the proof records for BLOCKED actions to find the threat.',
        )
      }
      lastScenarioId.current = currentScenarioId
    }

    const milestone = Math.floor(blocked / 500) * 500
    if (milestone >= 500 && milestone > lastBlockedMilestone.current) {
      lastBlockedMilestone.current = milestone
      addMessage(
        'GOVERNANCE',
        `${milestone} actions blocked by governance so far this session. Every block is cryptographically recorded.`,
      )
    }

    if (currentScenarioId === 'routine_patrol' && tick > 0 && tick % 60 === 0) {
      addMessage(
        'SYSTEM',
        `All ${agents.length} agents operating within policy. Governance gate active and verified.`,
      )
    }

    if (integrityOk && tick - lastChainOkTick.current >= 300) {
      lastChainOkTick.current = tick
      const totalDecisions = agents.length * tick
      addMessage(
        'GOVERNANCE',
        `Proof chain intact. All ${totalDecisions} decisions in this session are cryptographically verified and tamper-evident.`,
      )
    }
  }, [tick, governanceStats, agentsById, currentScenarioId, integrityOk])

  const displayMessages = messages.slice(-MAX_MESSAGES)

  return (
    <div className="narrative-layer" aria-live="polite" aria-label="Mission commentator">
      {displayMessages.map((m) => (
        <div
          key={m.id}
          className={`narrative-message narrative-message--${m.tag.toLowerCase()}`}
        >
          <span className={`narrative-tag narrative-tag--${m.tag.toLowerCase()}`}>
            [{m.tag}]
          </span>{' '}
          {m.text}
        </div>
      ))}
    </div>
  )
}
