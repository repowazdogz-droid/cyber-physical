/**
 * Voice Input
 * 
 * Web Speech API wrapper for voice input.
 * Falls back gracefully when not supported.
 * 
 * Version: 0.1
 */

export interface VoiceInputResult {
  isSupported: boolean
  transcript?: string
  error?: string
}

/**
 * Checks if speech recognition is supported.
 */
export function isVoiceSupported(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  )
}

/**
 * Gets the SpeechRecognition instance.
 */
function getSpeechRecognition(): any {
  if (typeof window === 'undefined') {
    return null
  }
  
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
}

/**
 * Starts listening for voice input.
 * Returns a cleanup function to stop listening.
 */
export function startListening(
  onTranscript: (text: string) => void,
  onError?: (error: string) => void,
  onEnd?: () => void
): (() => void) | null {
  if (!isVoiceSupported()) {
    if (onError) {
      onError('Voice input not supported in this browser')
    }
    return null
  }
  
  try {
    const SpeechRecognition = getSpeechRecognition()
    const recognition = new SpeechRecognition()
    
    recognition.continuous = false // Stop after first result
    recognition.interimResults = true // Show interim results
    recognition.lang = 'en-US' // Default to English
    
    recognition.onresult = (event: any) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      onTranscript(transcript)
    }
    
    recognition.onerror = (event: any) => {
      const errorMessage = event.error === 'no-speech' 
        ? 'No speech detected'
        : event.error === 'audio-capture'
        ? 'Microphone not available'
        : event.error === 'not-allowed'
        ? 'Microphone permission denied'
        : `Voice input error: ${event.error}`
      
      if (onError) {
        onError(errorMessage)
      }
    }
    
    recognition.onend = () => {
      if (onEnd) {
        onEnd()
      }
    }
    
    recognition.start()
    
    // Return cleanup function
    return () => {
      try {
        recognition.stop()
      } catch (e) {
        // Already stopped or error
      }
    }
  } catch (error) {
    if (onError) {
      onError(error instanceof Error ? error.message : 'Failed to start voice input')
    }
    return null
  }
}

/**
 * Stops listening for voice input.
 */
export function stopListening(cleanup: (() => void) | null): void {
  if (cleanup) {
    cleanup()
  }
}








































