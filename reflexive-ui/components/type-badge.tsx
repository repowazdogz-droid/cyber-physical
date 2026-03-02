'use client'

interface TypeBadgeProps {
  type: 'decision' | 'question' | 'scenario' | 'assessment_request'
  className?: string
  variant?: 'light' | 'dark'
}

const TYPE_CONFIG = {
  decision: {
    icon: '⚖',
    bg: 'bg-indigo-500/8',
    text: 'text-indigo-600',
  },
  question: {
    icon: '?',
    bg: 'bg-sky-500/8',
    text: 'text-sky-500',
  },
  scenario: {
    icon: '◈',
    bg: 'bg-purple-500/8',
    text: 'text-purple-500',
  },
  assessment_request: {
    icon: '◉',
    bg: 'bg-amber-500/8',
    text: 'text-amber-500',
  },
}

// For white text on dark backgrounds
const TYPE_CONFIG_DARK = {
  decision: {
    icon: '⚖',
    bg: 'bg-indigo-500/20',
    text: 'text-white/90',
  },
  question: {
    icon: '?',
    bg: 'bg-sky-500/20',
    text: 'text-white/90',
  },
  scenario: {
    icon: '◈',
    bg: 'bg-purple-500/20',
    text: 'text-white/90',
  },
  assessment_request: {
    icon: '◉',
    bg: 'bg-amber-500/20',
    text: 'text-white/90',
  },
}

export function TypeBadge({
  type,
  className = '',
  variant = 'light',
}: TypeBadgeProps) {
  const config =
    variant === 'dark' ? TYPE_CONFIG_DARK[type] : TYPE_CONFIG[type]

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[11px] font-medium font-mono tracking-wide ${config.bg} ${config.text} ${className}`}
    >
      <span>{config.icon}</span>
      <span>{type}</span>
    </span>
  )
}
