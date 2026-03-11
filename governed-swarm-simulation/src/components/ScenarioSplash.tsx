import type { FC } from 'react'
import { useState, useEffect, useCallback } from 'react'
import { getScenarioSplashMeta } from '../config/scenarioUi'
import type { ScenarioId } from '../types/simulation'

const SPLASH_DURATION_MS = 3000
const FADE_IN_MS = 300
const FADE_OUT_MS = 500
const COUNTDOWN_INTERVAL_MS = 1000

interface ScenarioSplashProps {
  scenarioId: ScenarioId
  onComplete: () => void
}

export const ScenarioSplash: FC<ScenarioSplashProps> = ({ scenarioId, onComplete }) => {
  const [phase, setPhase] = useState<'fade-in' | 'show' | 'fade-out'>('fade-in')
  const [countdown, setCountdown] = useState(3)
  const [opacity, setOpacity] = useState(0)

  const meta = getScenarioSplashMeta(scenarioId)

  const finish = useCallback(() => {
    setPhase('fade-out')
    setOpacity(0)
    const t = setTimeout(() => {
      onComplete()
    }, FADE_OUT_MS)
    return () => clearTimeout(t)
  }, [onComplete])

  useEffect(() => {
    const t1 = setTimeout(() => {
      setOpacity(1)
      setPhase('show')
    }, FADE_IN_MS)
    return () => clearTimeout(t1)
  }, [])

  useEffect(() => {
    if (phase !== 'show') return
    const t = setTimeout(() => finish(), SPLASH_DURATION_MS)
    return () => clearTimeout(t)
  }, [phase, finish])

  useEffect(() => {
    if (phase !== 'show') return
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) return 0
        return c - 1
      })
    }, COUNTDOWN_INTERVAL_MS)
    return () => clearInterval(id)
  }, [phase])

  return (
    <div
      className="scenario-splash"
      style={{
        backgroundColor: meta.background,
        opacity: phase === 'fade-out' ? 0 : opacity,
        transition: phase === 'fade-in' ? `opacity ${FADE_IN_MS}ms ease-out` : phase === 'fade-out' ? `opacity ${FADE_OUT_MS}ms ease-in` : 'none',
      }}
      role="dialog"
      aria-label={`Scenario: ${meta.title}`}
    >
      <div className="scenario-splash-content">
        <h1 className="scenario-splash-title">
          {meta.showWarningIcon && <span className="scenario-splash-warning" aria-hidden>⚠ </span>}
          {meta.title}
        </h1>
        <p className="scenario-splash-subtitle">{meta.subtitle}</p>
        <p className="scenario-splash-body">{meta.body}</p>
        <span className={`scenario-splash-pill scenario-splash-pill--${meta.pillVariant}`}>
          {meta.pillLabel}
        </span>
      </div>
      <button
        type="button"
        className="scenario-splash-skip"
        onClick={finish}
        aria-label="Skip intro"
      >
        Skip intro
      </button>
      <div className="scenario-splash-countdown" aria-live="polite">
        {countdown > 0 ? `Starting in ${countdown}...` : 'Starting...'}
      </div>
    </div>
  )
}
