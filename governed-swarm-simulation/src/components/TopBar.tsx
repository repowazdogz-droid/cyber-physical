import type { FC } from 'react'
import { useRef, useState, useEffect } from 'react'
import { useSimulationUiStore } from '../store/simulationStore'
import type { ScenarioId } from '../types/simulation'
import { useSimulationClockContext } from '../sim/clock/SimulationClockContext'
import { SCENARIO_UI_ENTRIES, getScenarioUiMeta } from '../config/scenarioUi'

const SPEEDS = [0.5, 1, 2] as const

export const TopBar: FC = () => {
  const { running, start, stop } = useSimulationClockContext()
  const currentScenarioId = useSimulationUiStore((s) => s.currentScenarioId)
  const setScenario = useSimulationUiStore((s) => s.setScenario)
  const simulationSpeed = useSimulationUiStore((s) => s.simulationSpeed)
  const setSimulationSpeed = useSimulationUiStore((s) => s.setSimulationSpeed)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  const currentMeta = getScenarioUiMeta(currentScenarioId)

  const handleSelectScenario = (id: ScenarioId) => {
    setScenario(id)
    setDropdownOpen(false)
  }

  return (
    <header className="shell-topbar">
      <div className="shell-topbar-left">
        <span className="shell-topbar-title">SOVEREIGN</span>
        <span className="shell-topbar-subtitle">Verifiable Autonomy</span>
      </div>
      <div className="shell-topbar-center">
        <div className="shell-scenario-dropdown-wrap" ref={dropdownRef}>
          <button
            type="button"
            className="shell-scenario-dropdown-trigger"
            onClick={() => setDropdownOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            aria-label="Select scenario"
          >
            {currentMeta.name}
          </button>
          {dropdownOpen && (
            <div
              className="shell-scenario-dropdown-panel"
              role="listbox"
              aria-label="Scenarios"
            >
              {SCENARIO_UI_ENTRIES.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  role="option"
                  aria-selected={currentScenarioId === entry.id}
                  className={`shell-scenario-option ${currentScenarioId === entry.id ? 'shell-scenario-option--selected' : ''}`}
                  onClick={() => handleSelectScenario(entry.id)}
                >
                  <span className="shell-scenario-option-name">{entry.name}</span>
                  <span className="shell-scenario-option-desc">{entry.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <span
          className={`shell-scenario-pill shell-scenario-pill--${currentMeta.statusPillVariant}`}
          aria-label={`Scenario status: ${currentMeta.statusPillLabel}`}
        >
          {currentMeta.statusPillLabel}
        </span>
      </div>
      <div className="shell-topbar-right">
        <div className="shell-speed-controls">
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              type="button"
              className={`shell-speed-btn ${simulationSpeed === speed ? 'shell-speed-btn--active' : ''}`}
              onClick={() => setSimulationSpeed(speed)}
            >
              {speed}x
            </button>
          ))}
        </div>
        <button
          type="button"
          className="shell-play-btn"
          onClick={running ? stop : start}
          aria-label={running ? 'Pause' : 'Play'}
        >
          {running ? 'Pause' : 'Play'}
        </button>
        {running && (
          <div className="shell-live-pulse">
            <span className="shell-live-dot" aria-hidden />
            LIVE
          </div>
        )}
      </div>
    </header>
  )
}
