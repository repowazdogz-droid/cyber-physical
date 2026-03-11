import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useSimulationUiStore } from '../store/simulationStore'
import { useShallow } from 'zustand/react/shallow'

const REPLAY_INTERVAL_MS = 200
const REPLAY_SPEEDS = [0.5, 1, 2, 4] as const

export const ReplayPanel: FC = () => {
  const runHistory = useSimulationUiStore(useShallow((s) => s.runHistory))
  const isReplayMode = useSimulationUiStore((s) => s.isReplayMode)
  const replayTick = useSimulationUiStore((s) => s.replayTick)
  const replaySpeed = useSimulationUiStore((s) => s.replaySpeed)
  const setReplayMode = useSimulationUiStore((s) => s.setReplayMode)
  const setReplayTick = useSimulationUiStore((s) => s.setReplayTick)
  const setReplaySpeed = useSimulationUiStore((s) => s.setReplaySpeed)

  const [isPlaying, setIsPlaying] = useState(false)
  const minTick = runHistory.length > 0 ? runHistory[0].tick : 0
  const maxTick = runHistory.length > 0 ? runHistory[runHistory.length - 1].tick : 0

  const pause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const play = useCallback(() => {
    if (runHistory.length === 0 || replayTick >= maxTick) return
    setReplayMode(true)
    setIsPlaying(true)
  }, [runHistory.length, replayTick, maxTick, setReplayMode])

  useEffect(() => {
    if (!isPlaying || !isReplayMode || runHistory.length === 0) return
    const stepMs = REPLAY_INTERVAL_MS / replaySpeed
    const id = setInterval(() => {
      const current = useSimulationUiStore.getState().replayTick
      const next = current + 1
      if (next > maxTick) {
        setIsPlaying(false)
        useSimulationUiStore.getState().setReplayTick(maxTick)
      } else {
        useSimulationUiStore.getState().setReplayTick(next)
      }
    }, stepMs)
    return () => clearInterval(id)
  }, [isPlaying, isReplayMode, replaySpeed, maxTick])

  const returnToLive = () => {
    pause()
    setReplayMode(false)
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tick = Number(e.target.value)
    setReplayTick(tick)
    setReplayMode(true)
  }

  return (
    <div className="panel-body">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Replay</h2>
          <p className="panel-subtitle">
            Scrub through the last 1000 ticks. Red marks on the timeline indicate BLOCKED governance events.
          </p>
        </div>
      </div>

      <div className="replay-controls">
        <div className="replay-row">
          <label className="replay-label">Tick</label>
          <span className="replay-tick-value" aria-live="polite">
            {isReplayMode ? replayTick : maxTick}
          </span>
          {isReplayMode && (
            <span className="replay-badge" aria-hidden>
              Replay
            </span>
          )}
        </div>

        <div className="replay-row">
          <label htmlFor="replay-slider" className="replay-label">
            Scrub
          </label>
          <input
            id="replay-slider"
            type="range"
            min={minTick}
            max={maxTick}
            step={1}
            value={isReplayMode ? replayTick : maxTick}
            onChange={handleSliderChange}
            className="replay-slider"
            aria-label="Scrub through stored ticks"
          />
        </div>

        <div className="replay-row replay-buttons">
          <button
            type="button"
            onClick={isPlaying ? pause : play}
            className="ghost-button"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          {REPLAY_SPEEDS.map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => setReplaySpeed(speed)}
              className={replaySpeed === speed ? 'ghost-button ghost-button--active' : 'ghost-button'}
              aria-pressed={replaySpeed === speed}
            >
              {speed}x
            </button>
          ))}
        </div>

        {isReplayMode && (
          <div className="replay-row">
            <button type="button" onClick={returnToLive} className="ghost-button replay-return">
              Return to live
            </button>
          </div>
        )}
      </div>

      <p className="panel-subtitle" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
        Range: {minTick} – {maxTick} ({runHistory.length} snapshots)
      </p>
    </div>
  )
}
