import type { FC, ReactNode } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useSimulationUiStore } from '../store/simulationStore'
import { useSimulationClockContext } from '../sim/clock/SimulationClockContext'
import { ScenarioSplash } from './ScenarioSplash'

interface ScenarioSplashGateProps {
  children: ReactNode
}

export const ScenarioSplashGate: FC<ScenarioSplashGateProps> = ({ children }) => {
  const currentScenarioId = useSimulationUiStore((s) => s.currentScenarioId)
  const scenarioRunId = useSimulationUiStore((s) => s.scenarioRunId)
  const { start, stop } = useSimulationClockContext()

  const [showSplash, setShowSplash] = useState(true)
  const [splashScenarioId, setSplashScenarioId] = useState(currentScenarioId)
  const previousKeyRef = useRef<string | null>(null)

  const scenarioKey = `${currentScenarioId}-${scenarioRunId}`

  useEffect(() => {
    if (previousKeyRef.current !== null && previousKeyRef.current !== scenarioKey) {
      stop()
      setSplashScenarioId(currentScenarioId)
      setShowSplash(true)
    } else if (previousKeyRef.current === null) {
      setSplashScenarioId(currentScenarioId)
      setShowSplash(true)
    }
    previousKeyRef.current = scenarioKey
  }, [scenarioKey, currentScenarioId, stop])

  const handleSplashComplete = () => {
    setShowSplash(false)
    start()
  }

  return (
    <>
      {showSplash ? (
        <ScenarioSplash scenarioId={splashScenarioId} onComplete={handleSplashComplete} />
      ) : null}
      {children}
    </>
  )
}
