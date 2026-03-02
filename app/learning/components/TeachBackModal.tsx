'use client'

import { useState, useEffect } from 'react'
import { isVoiceSupported, startListening, stopListening } from '../input/VoiceInput'

interface TeachBackModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (text: string) => void
  topic: string
  microTopic?: string
  calmMode?: boolean
}

export default function TeachBackModal({
  isOpen,
  onClose,
  onSubmit,
  topic,
  microTopic,
  calmMode = false
}: TeachBackModalProps) {
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [voiceCleanup, setVoiceCleanup] = useState<(() => void) | null>(null)
  const [voiceSupported, setVoiceSupported] = useState(false)

  useEffect(() => {
    setVoiceSupported(isVoiceSupported())
  }, [])

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setInput('')
      setTranscript('')
      setIsListening(false)
      if (voiceCleanup) {
        stopListening(voiceCleanup)
        setVoiceCleanup(null)
      }
    }
  }, [isOpen, voiceCleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (voiceCleanup) {
        stopListening(voiceCleanup)
      }
    }
  }, [voiceCleanup])

  const handleVoiceToggle = () => {
    if (isListening) {
      // Stop listening
      if (voiceCleanup) {
        stopListening(voiceCleanup)
        setVoiceCleanup(null)
        setIsListening(false)
        
        // Use transcript if available
        if (transcript.trim()) {
          setInput(transcript.trim())
          setTranscript('')
        }
      }
    } else {
      // Start listening
      setTranscript('')
      const cleanup = startListening(
        (text) => {
          setTranscript(text)
        },
        (error) => {
          console.error('Voice input error:', error)
          setIsListening(false)
          setVoiceCleanup(null)
        },
        () => {
          setIsListening(false)
          setVoiceCleanup(null)
          // Auto-use transcript on end
          if (transcript.trim()) {
            setInput(transcript.trim())
            setTranscript('')
          }
        }
      )
      
      if (cleanup) {
        setVoiceCleanup(cleanup)
        setIsListening(true)
      }
    }
  }

  const handleSubmit = () => {
    const text = input.trim() || transcript.trim()
    if (text) {
      onSubmit(text)
      setInput('')
      setTranscript('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          padding: calmMode ? '1.25rem' : '1.5rem',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: calmMode ? '1.1rem' : '1.25rem', fontWeight: 'bold', margin: 0 }}>
            Teach it back
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '1.5rem',
              lineHeight: '1',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#666' }}>
          Explain <strong>{topic}</strong>
          {microTopic && ` → ${microTopic}`} in your own words.
        </p>

        {/* Voice input button */}
        {voiceSupported && (
          <div style={{ marginBottom: '0.75rem' }}>
            <button
              onClick={handleVoiceToggle}
              style={{
                padding: '0.75rem 1rem',
                border: '2px solid #0066cc',
                background: isListening ? '#0066cc' : '#fff',
                color: isListening ? '#fff' : '#0066cc',
                cursor: 'pointer',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                width: '100%',
                justifyContent: 'center'
              }}
            >
              🎤 {isListening ? 'Listening...' : 'Speak'}
            </button>
            {isListening && transcript && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '6px',
                fontSize: '0.85rem',
                color: '#856404'
              }}>
                {transcript}
              </div>
            )}
          </div>
        )}

        {/* Text input */}
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say it or type it…"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSubmit()
              }
            }}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontFamily: 'inherit',
              fontSize: '1rem',
              boxSizing: 'border-box'
            }}
            autoFocus
          />
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!input.trim() && !transcript.trim()}
          style={{
            width: '100%',
            padding: '0.875rem 1.5rem',
            background: (!input.trim() && !transcript.trim()) ? '#ccc' : '#000',
            color: '#fff',
            border: 'none',
            cursor: (!input.trim() && !transcript.trim()) ? 'not-allowed' : 'pointer',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}








































