import type { FC } from 'react'
import { useEffect, useState } from 'react'

const SESSION_KEY = 'sovereign-onboarding-seen'
const HASH_CHARS = '0123456789abcdef'
const LINES = ['INTEGRITY VERIFIED', 'HASH-CHAIN SECURED', 'GOVERNANCE ACTIVE']

export const OnboardingOverlay: FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'stream' | 'lines' | 'out'>('stream')
  const [streamLines, setStreamLines] = useState<string[]>([])
  const [visibleLineIndex, setVisibleLineIndex] = useState(-1)

  useEffect(() => {
    if (phase !== 'stream') return
    const lineCount = 20
    const charsPerLine = 80
    const interval = setInterval(() => {
      setStreamLines((prev) => {
        const next = [...prev]
        const newLine = Array.from({ length: charsPerLine }, () =>
          HASH_CHARS[Math.floor(Math.random() * HASH_CHARS.length)],
        ).join('')
        next.push(newLine)
        if (next.length > lineCount) next.shift()
        return next
      })
    }, 40)
    const done = setTimeout(() => {
      clearInterval(interval)
      setPhase('lines')
    }, 1500)
    return () => {
      clearInterval(interval)
      clearTimeout(done)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'lines') return
    if (visibleLineIndex < LINES.length - 1) {
      const t = setTimeout(() => setVisibleLineIndex((i) => i + 1), 300)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setPhase('out'), 1000)
    return () => clearTimeout(t)
  }, [phase, visibleLineIndex])

  useEffect(() => {
    if (phase !== 'out') return
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem(SESSION_KEY, '1')
      } catch {
        /* ignore */
      }
      onComplete()
    }, 500)
    return () => clearTimeout(t)
  }, [phase, onComplete])

  return (
    <div
      className="shell-onboarding"
      role="presentation"
      aria-hidden="true"
      style={{
        opacity: phase === 'out' ? 0 : 1,
        transition: 'opacity 500ms ease-out',
      }}
    >
      {phase === 'stream' && (
        <div className="shell-onboarding-stream">
          {streamLines.map((line, i) => (
            <div key={i} className="shell-onboarding-stream-line">
              {line}
            </div>
          ))}
        </div>
      )}
      {(phase === 'lines' || phase === 'out') && (
        <div className="shell-onboarding-message">
          {LINES.map((text, i) => (
            <div
              key={text}
              className="shell-onboarding-line"
              style={{
                opacity: visibleLineIndex >= i ? 1 : 0,
                transition: 'opacity 300ms ease-in',
              }}
            >
              {text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
