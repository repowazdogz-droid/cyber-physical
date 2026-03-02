'use client'

interface ConfidenceRingProps {
  score: number
  size?: number
  className?: string
}

export function ConfidenceRing({
  score,
  size = 44,
  className = '',
}: ConfidenceRingProps) {
  const radius = (size - 6) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score * circumference)

  const getBandColor = (s: number): string => {
    if (s < 0.25) return '#ef4444' // low
    if (s < 0.5) return '#f59e0b' // moderate
    if (s < 0.75) return '#10b981' // high
    return '#6366f1' // very-high
  }

  const getBandTextColor = (s: number): string => {
    if (s < 0.25) return '#dc2626'
    if (s < 0.5) return '#d97706'
    if (s < 0.75) return '#059669'
    return '#4f46e5'
  }

  const color = getBandColor(score)
  const textColor = getBandTextColor(score)
  const percentage = Math.round(score * 100)

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ color: textColor }}
      >
        <span className="font-mono text-[10px] font-semibold">{percentage}</span>
      </div>
    </div>
  )
}
