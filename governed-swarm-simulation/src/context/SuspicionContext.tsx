import type { FC, ReactNode } from 'react'
import { createContext, useContext, useMemo, useRef, useEffect, useState } from 'react'
import { useSimulationUiStore } from '../store/simulationStore'
import { useSimulationClockContext } from '../sim/clock/SimulationClockContext'

export type SuspicionScores = Record<string, number>

const SuspicionContext = createContext<SuspicionScores>({})

export function useSuspicionScores(): SuspicionScores {
  return useContext(SuspicionContext)
}

function distance3d(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

const SUSPICION_MAX = 100
const BLOCK_BASE = 10
const BLOCK_HOSTILE_BONUS = 20
const PROXIMITY_PER_TICK = 5
const DECAY_PER_TICK = 1
const PROXIMITY_METERS = 100

export const SuspicionProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const agentsById = useSimulationUiStore((s) => s.agentsById)
  const currentScenarioId = useSimulationUiStore((s) => s.currentScenarioId)
  const { tick } = useSimulationClockContext()

  const [scores, setScores] = useState<SuspicionScores>({})
  const scoresRef = useRef<SuspicionScores>({})
  const lastBundleCountByAgent = useRef<Record<string, number>>({})

  const agents = useMemo(() => Object.values(agentsById), [agentsById])
  const isAdversarial = currentScenarioId === 'adversarial_coordination_attack'

  useEffect(() => {
    if (!isAdversarial) {
      setScores({})
      scoresRef.current = {}
      return
    }

    const next: SuspicionScores = {}

    for (const agent of agents) {
      next[agent.id] = Math.max(0, (scoresRef.current[agent.id] ?? 0) - DECAY_PER_TICK)
    }

    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const d = distance3d(agents[i].position, agents[j].position)
        if (d <= PROXIMITY_METERS) {
          next[agents[i].id] = Math.min(SUSPICION_MAX, (next[agents[i].id] ?? 0) + PROXIMITY_PER_TICK)
          next[agents[j].id] = Math.min(SUSPICION_MAX, (next[agents[j].id] ?? 0) + PROXIMITY_PER_TICK)
        }
      }
    }

    for (const agent of agents) {
      const bundles = agent.recentProofBundles ?? []
      const count = bundles.length
      const prevCount = lastBundleCountByAgent.current[agent.id] ?? 0
      lastBundleCountByAgent.current[agent.id] = count

      if (count > prevCount) {
        const lastBundle = bundles[bundles.length - 1]
        if (lastBundle && !lastBundle.allowed) {
          let add = BLOCK_BASE
          const reason = (lastBundle.reason ?? '').toUpperCase()
          if (reason.includes('HOSTILE') || reason.includes('ADVERSARIAL')) add += BLOCK_HOSTILE_BONUS
          next[agent.id] = Math.min(SUSPICION_MAX, (next[agent.id] ?? 0) + add)
        }
      }
    }

    for (const id of Object.keys(next)) {
      next[id] = Math.min(SUSPICION_MAX, Math.max(0, next[id] ?? 0))
    }

    scoresRef.current = next
    setScores(next)
  }, [agents, isAdversarial, tick])

  const value = isAdversarial ? scores : {}

  return (
    <SuspicionContext.Provider value={value}>
      {children}
    </SuspicionContext.Provider>
  )
}
