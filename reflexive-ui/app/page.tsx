'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { api, type CreateAnalysisRequest } from '@/lib/api'
import { TypeBadge } from '@/components/type-badge'

const DEMO_EXAMPLES = [
  {
    id: 'st-001',
    icon: '◈',
    title: 'HelioTech Acquisition',
    description: 'Should we acquire HelioTech for $500M?',
    text: 'Should we acquire HelioTech for $500M? They have $200M annual revenue growing 15% YoY, a strong engineering team of 150, but significant technical debt in their legacy platform. Our board wants a decision by end of Q2.',
    type: 'decision' as const,
  },
  {
    id: 'st-002',
    icon: '◇',
    title: 'SE Asia Market Entry',
    description: 'Enter Southeast Asian SaaS market?',
    text: 'We are considering entering the Southeast Asian market for our SaaS product. Current ARR is $50M, primarily US and EU. Singapore and Indonesia are primary targets. Competitors have 18-month head start. Our product requires localization for Bahasa and Thai.',
    type: 'decision' as const,
  },
  {
    id: 'st-003',
    icon: '○',
    title: 'ML Fraud Detection Pilot',
    description: 'Launch fraud detection to 10% of transactions?',
    text: 'Our ML-powered fraud detection system has achieved 94% precision and 87% recall in testing. Engineering recommends launching to 10% of transactions as a shadow mode pilot. The compliance team has concerns about explainability requirements under the EU AI Act.',
    type: 'scenario' as const,
  },
]

export default function Home() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [type, setType] = useState<
    'decision' | 'question' | 'scenario' | 'assessment_request'
  >('decision')
  // Debug: log when component renders
  useEffect(() => {
    console.log('Home component mounted/rendered')
  }, [])

  const createMutation = useMutation({
    mutationFn: api.createAnalysis,
    onSuccess: (data) => {
      // Store stimulus in sessionStorage for processing state display
      sessionStorage.setItem(
        `analysis_${data.analysis_id}_stimulus`,
        JSON.stringify({ text, type })
      )
      router.push(`/analyses/${data.analysis_id}`)
    },
    onError: (error: any) => {
      console.error('Analysis creation failed:', error)
      const errorMessage = error?.message || 'Failed to create analysis'
      const errorCode = error?.code || 'UNKNOWN_ERROR'
      // Show user-friendly error
      alert(`Failed to create analysis:\n\n${errorMessage}\n\nError code: ${errorCode}\n\nCheck the browser console for details.`)
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log('Form submitted, text:', text.trim())
    if (!text.trim()) {
      console.log('Text is empty, returning')
      return
    }

    console.log('Calling createMutation.mutate')
    createMutation.mutate({
      stimulus: {
        text: text.trim(),
        type,
      },
      options: {
        dry_run: false,
        save: true,
      },
    })
  }

  const handleDemoClick = (example: typeof DEMO_EXAMPLES[0]) => {
    console.log('Demo clicked:', example.id)
    setText(example.text)
    setType(example.type)
  }

  const handleTypeClick = (t: typeof type) => {
    console.log('handleTypeClick called with:', t)
    setType(t)
    console.log('setType called, type should be:', t)
  }

  // Debug: log state changes
  useEffect(() => {
    console.log('State changed - text:', text, 'type:', type)
  }, [text, type])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-16 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0,0,0) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />
      
      <div className="w-full max-w-2xl px-8 relative z-10">
        <div className="text-center mb-12 animate-fade-slide-in">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-3">
            REFLEXIVE
          </h1>
          <p className="text-base text-muted">
            Multi-lens institutional reasoning
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-slide-in" style={{ animationDelay: '0.1s' }}>
          {/* Textarea with submit button inside */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10 pointer-events-none"></div>
            <textarea
              value={text}
              onChange={(e) => {
                console.log('Textarea changed:', e.target.value)
                setText(e.target.value)
              }}
              placeholder="Describe the decision, question, or scenario you need analyzed..."
              className="w-full p-6 rounded-2xl border border-black/[0.1] min-h-[160px] text-[15px] leading-relaxed resize-none text-foreground bg-white shadow-sm focus:border-black/25 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all relative z-10"
              disabled={createMutation.isPending}
              required
            />
            <button
              type="submit"
              disabled={!text.trim() || createMutation.isPending}
              onClick={(e) => {
                console.log('Submit button clicked, text:', text)
                // Let form handle submission
              }}
              className="absolute bottom-5 right-5 bg-gray-900 text-white rounded-xl px-6 py-3 text-[13px] font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl disabled:shadow-none z-20"
              style={{ pointerEvents: 'auto' }}
            >
              {createMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-pulse">Analyzing...</span>
                </span>
              ) : (
                'Analyze →'
              )}
            </button>
          </div>

          {/* Type pills */}
          <div className="flex gap-2 justify-center">
            {(['decision', 'question', 'scenario'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Type button clicked:', t, 'Current type:', type)
                  handleTypeClick(t)
                }}
                onMouseDown={(e) => {
                  console.log('Type button mousedown:', t)
                }}
                disabled={createMutation.isPending}
                className={`px-5 py-2.5 rounded-full text-[12px] font-semibold font-mono transition-all disabled:opacity-50 cursor-pointer ${
                  type === t
                    ? 'bg-gray-900 text-white border border-gray-900 shadow-md'
                    : 'bg-white text-muted border border-black/[0.1] hover:border-black/20 hover:bg-gray-50 shadow-sm'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-black/[0.06] to-transparent"></div>
            <span className="text-[11px] text-muted font-mono uppercase tracking-wider">
              or try a demo
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-black/[0.06] to-transparent"></div>
          </div>

          {/* Demo cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {DEMO_EXAMPLES.map((example, idx) => (
              <button
                key={example.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Demo button clicked:', example.id)
                  handleDemoClick(example)
                }}
                onMouseDown={(e) => {
                  console.log('Demo button mousedown:', example.id)
                }}
                disabled={createMutation.isPending}
                className="group border border-black/[0.08] rounded-xl p-5 cursor-pointer hover:border-black/20 hover:bg-white hover:shadow-md transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed bg-white backdrop-blur-sm relative z-10"
                style={{ pointerEvents: 'auto' }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-[18px] opacity-80 group-hover:opacity-100 transition-opacity">{example.icon}</span>
                  <span className="text-[13px] font-semibold text-foreground">
                    {example.title}
                  </span>
                </div>
                <p className="text-[12px] text-muted leading-relaxed line-clamp-2">
                  {example.description}
                </p>
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  )
}
