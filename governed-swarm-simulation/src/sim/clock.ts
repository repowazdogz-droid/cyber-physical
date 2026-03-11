import { useEffect, useRef, useState } from 'react'

export interface SimulationClockOptions {
  /**
   * Length of a simulation tick in milliseconds.
   * Defaults to 100 ms.
   */
  tickIntervalMs?: number
  /**
   * Whether the clock should start ticking immediately.
   * Defaults to true.
   */
  autoStart?: boolean
  /**
   * When this key changes, the clock tick counter is reset to zero.
   */
  resetKey?: string | number
}

export interface SimulationClockState {
  tick: number
  running: boolean
}

export interface UseSimulationClockResult extends SimulationClockState {
  start: () => void
  stop: () => void
  reset: () => void
  /** Advance by one tick (e.g. for step-through playback). */
  step: () => void
}

export const useSimulationClock = (
  options: SimulationClockOptions = {},
): UseSimulationClockResult => {
  const { tickIntervalMs = 100, autoStart = true, resetKey } = options
  const [tick, setTick] = useState(0)
  const [running, setRunning] = useState(autoStart)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => setTick(0), 0)
    return () => window.clearTimeout(id)
  }, [resetKey])

  useEffect(() => {
    if (!running) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = window.setInterval(() => {
      setTick((prev) => prev + 1)
    }, tickIntervalMs)

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [running, tickIntervalMs])

  const start = () => setRunning(true)
  const stop = () => setRunning(false)
  const reset = () => setTick(0)
  const step = () => setTick((prev) => prev + 1)

  return {
    tick,
    running,
    start,
    stop,
    reset,
    step,
  }
}

