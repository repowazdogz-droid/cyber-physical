import type { FC } from 'react'
import { useMemo } from 'react'
import { useSimulationUiStore } from '../store/simulationStore'
import { useShallow } from 'zustand/react/shallow'
import { useSimulationClockContext } from '../sim/clock/SimulationClockContext'

export const TimelineBar: FC = () => {
  const runHistory = useSimulationUiStore(useShallow((s) => s.runHistory))
  const isReplayMode = useSimulationUiStore((s) => s.isReplayMode)
  const replayTick = useSimulationUiStore((s) => s.replayTick)
  const setReplayTick = useSimulationUiStore((s) => s.setReplayTick)
  const setReplayMode = useSimulationUiStore((s) => s.setReplayMode)
  const getSnapshotAt = useSimulationUiStore((s) => s.getSnapshotAt)
  const selectAgent = useSimulationUiStore((s) => s.selectAgent)
  const { tick, stop } = useSimulationClockContext()

  const blockedTicks = useMemo(
    () =>
      new Set(
        runHistory
          .filter((s) => s.agentStates.some((a) => a.governanceResult === 'BLOCKED'))
          .map((s) => s.tick),
      ),
    [runHistory],
  )
  const minTick = runHistory.length > 0 ? runHistory[0].tick : 0
  const maxTick = runHistory.length > 0 ? runHistory[runHistory.length - 1].tick : 0
  const currentTick = isReplayMode ? replayTick : tick

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    if (width <= 0) return
    const t = minTick + (x / width) * (maxTick - minTick + 1)
    const tickNum = Math.max(minTick, Math.min(maxTick, Math.floor(t)))
    setReplayTick(tickNum)
    setReplayMode(true)
    stop()
    const snapshot = getSnapshotAt(tickNum)
    if (snapshot && blockedTicks.has(tickNum)) {
      const blocked = snapshot.agentStates.find((a) => a.governanceResult === 'BLOCKED')
      if (blocked) selectAgent(blocked.id)
    }
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tickNum = Number(e.target.value)
    setReplayTick(tickNum)
    setReplayMode(true)
  }

  if (runHistory.length === 0) return null

  return (
    <div className="shell-timeline">
      <span className="shell-timeline-label">Replay</span>
      <div
        className="shell-timeline-bar"
        onClick={handleBarClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleBarClick(e as unknown as React.MouseEvent<HTMLDivElement>)
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Timeline: click to scrub, red marks are blocked events"
      >
        {runHistory.map((s) => (
          <span
            key={s.tick}
            className={`shell-timeline-segment ${blockedTicks.has(s.tick) ? 'shell-timeline-segment--blocked' : ''}`}
            style={{
              left: `${((s.tick - minTick) / Math.max(maxTick - minTick, 1)) * 100}%`,
            }}
          />
        ))}
      </div>
      <input
        type="range"
        className="shell-timeline-slider"
        min={minTick}
        max={maxTick}
        step={1}
        value={currentTick}
        onChange={handleSliderChange}
        aria-label="Scrub timeline"
      />
      <span className="shell-timeline-range">
        {minTick} – {maxTick}
      </span>
    </div>
  )
}
