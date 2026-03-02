import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        background: '#fafafa',
        surface: '#ffffff',
        foreground: '#111827',
        muted: '#9ca3af',
        border: 'rgba(0,0,0,0.06)',
        'border-strong': 'rgba(0,0,0,0.12)',
        band: {
          low: {
            bg: 'rgba(239,68,68,0.08)',
            text: '#dc2626',
            dot: '#ef4444',
          },
          moderate: {
            bg: 'rgba(245,158,11,0.08)',
            text: '#d97706',
            dot: '#f59e0b',
          },
          high: {
            bg: 'rgba(16,185,129,0.08)',
            text: '#059669',
            dot: '#10b981',
          },
          'very-high': {
            bg: 'rgba(99,102,241,0.08)',
            text: '#4f46e5',
            dot: '#6366f1',
          },
        },
        convergence: '#10b981',
        divergence: '#ef4444',
        'evidence-gap': '#f59e0b',
      },
    },
  },
  plugins: [],
}
export default config
