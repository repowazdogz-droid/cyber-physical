/* eslint-disable react-refresh/only-export-components -- context file exports provider and hook */
import type { FC, ReactNode } from 'react'
import { createContext, useContext } from 'react'
import { useSimulationClock } from '../clock'
import { useSimulationUiStore } from '../../store/simulationStore'

const BASE_TICK_MS = 250

export interface SimulationClockContextValue {
  tick: number
  running: boolean
  start: () => void
  stop: () => void
  step: () => void
  reset: () => void
}

const SimulationClockContext = createContext<SimulationClockContextValue | null>(null)

export function useSimulationClockContext(): SimulationClockContextValue {
  const ctx = useContext(SimulationClockContext)
  if (!ctx) throw new Error('useSimulationClockContext must be used within SimulationClockProvider')
  return ctx
}

const FREEZE_FRAME_SPEED = 0.1

export const SimulationClockProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const scenarioRunId = useSimulationUiStore((s) => s.scenarioRunId)
  const simulationSpeed = useSimulationUiStore((s) => s.simulationSpeed)
  const freezeFramePayload = useSimulationUiStore((s) => s.freezeFramePayload)
  const effectiveSpeed = freezeFramePayload ? FREEZE_FRAME_SPEED : simulationSpeed
  const tickIntervalMs = Math.round(BASE_TICK_MS / effectiveSpeed)
  const clock = useSimulationClock({
    tickIntervalMs,
    autoStart: false,
    resetKey: scenarioRunId,
  })

  const value: SimulationClockContextValue = {
    tick: clock.tick,
    running: clock.running,
    start: clock.start,
    stop: clock.stop,
    step: clock.step,
    reset: clock.reset,
  }

  return (
    <SimulationClockContext.Provider value={value}>
      {children}
    </SimulationClockContext.Provider>
  )
}
