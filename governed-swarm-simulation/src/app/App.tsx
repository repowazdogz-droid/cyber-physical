import type { FC } from 'react'
import { useState, useEffect, useRef } from 'react'
import { TopBar } from '../components/TopBar'
import { LeftSidebar } from '../components/LeftSidebar'
import { RightPanel } from '../components/RightPanel'
import { TimelineBar } from '../components/TimelineBar'
import { MainSimulationView } from '../panels/MainSimulationView'
import { NarrativeLayer } from '../panels/NarrativeLayer'
import { FreezeFrameDetector } from '../panels/FreezeFrameDetector'
import { FreezeFrameCard } from '../panels/FreezeFrameCard'
import { SuspicionProvider } from '../context/SuspicionContext'
import { OnboardingOverlay } from '../components/OnboardingOverlay'
import { VerificationPanel } from '../panels/VerificationPanel'
import { GovernanceExplainPanel } from '../panels/GovernanceExplainPanel'
import { SimulationClockProvider } from '../sim/clock/SimulationClockContext'
import { ScenarioSplashGate } from '../components/ScenarioSplashGate'
import { useSimulationUiStore } from '../store/simulationStore'
import { getScenarioUiMeta } from '../config/scenarioUi'
import type { ScenarioId } from '../types/simulation'

const ONBOARDING_KEY = 'sovereign-onboarding-seen'
const SCENARIO_NOTIFICATION_MS = 4000

interface ScenarioNotification {
  name: string
  description: string
  variant: 'baseline' | 'elevated' | 'degraded' | 'hostile'
}

const App: FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return !sessionStorage.getItem(ONBOARDING_KEY)
    } catch {
      return false
    }
  })
  const [scenarioNotification, setScenarioNotification] = useState<ScenarioNotification | null>(null)
  const currentScenarioId = useSimulationUiStore((s) => s.currentScenarioId)
  const prevScenarioIdRef = useRef<ScenarioId | null>(null)

  useEffect(() => {
    if (prevScenarioIdRef.current !== null && prevScenarioIdRef.current !== currentScenarioId) {
      const meta = getScenarioUiMeta(currentScenarioId)
      setScenarioNotification({
        name: meta.name,
        description: meta.description,
        variant: meta.statusPillVariant,
      })
      const t = setTimeout(() => setScenarioNotification(null), SCENARIO_NOTIFICATION_MS)
      return () => clearTimeout(t)
    }
    prevScenarioIdRef.current = currentScenarioId
  }, [currentScenarioId])

  const selectedAgentId = useSimulationUiStore((s) => s.selectedAgentId)
  const isVerificationOpen = useSimulationUiStore((s) => s.isVerificationOpen)

  return (
    <div className="shell-root">
      {showOnboarding && <OnboardingOverlay onComplete={() => setShowOnboarding(false)} />}
      <SimulationClockProvider>
        <ScenarioSplashGate>
          <TopBar />
          {scenarioNotification && (
          <div
            className={`shell-scenario-notification shell-scenario-notification--${scenarioNotification.variant}`}
            role="status"
            aria-live="polite"
          >
            Scenario changed: {scenarioNotification.name} — {scenarioNotification.description}
          </div>
        )}
        <div className="shell-body">
          <SuspicionProvider>
            <LeftSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((c) => !c)} />
            <div className="shell-main">
            <div className="shell-viewport-wrap">
              <MainSimulationView />
              <NarrativeLayer />
              <FreezeFrameDetector />
              <FreezeFrameCard />
            </div>
            <TimelineBar />
          </div>
          {selectedAgentId && <RightPanel />}
          </SuspicionProvider>
        </div>
        {isVerificationOpen && <VerificationPanel />}
        <GovernanceExplainPanel />
        </ScenarioSplashGate>
      </SimulationClockProvider>
    </div>
  )
}

export default App
