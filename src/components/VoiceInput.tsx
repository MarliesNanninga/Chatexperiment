'use client'

import { useState, useEffect, useRef } from 'react'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  isDisabled?: boolean
  className?: string
}

// Add type declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new(): SpeechRecognition
}

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition
  new(): SpeechRecognition
}

export default function VoiceInput({ onTranscript, isDisabled = false, className = '' }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Check if Speech Recognition is supported
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognitionClass) {
        setIsSupported(true)
        recognitionRef.current = new SpeechRecognitionClass()
        const recognition = recognitionRef.current

        if (recognition) {
          // Configure speech recognition
          recognition.continuous = true
          recognition.interimResults = true
          recognition.lang = 'nl-NL' // Dutch language

          recognition.onstart = () => {
            console.log('🎤 Voice recognition started')
            setIsListening(true)
            setError('')
          }

          recognition.onresult = (event) => {
            let finalTranscript = ''
            let interimText = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript
              if (event.results[i].isFinal) {
                finalTranscript += transcript + ' '
              } else {
                interimText += transcript
              }
            }

            if (finalTranscript) {
              setTranscript(prev => prev + finalTranscript)
              onTranscript(finalTranscript.trim())
            }
            
            setInterimTranscript(interimText)
          }

          recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error)
            setError(`Spraakherkenning fout: ${event.error}`)
            setIsListening(false)
            
            // Handle specific errors
            if (event.error === 'not-allowed') {
              setError('Microfoon toegang geweigerd. Sta microfoon toe in je browser.')
            } else if (event.error === 'no-speech') {
              setError('Geen spraak gedetecteerd. Probeer opnieuw.')
            } else if (event.error === 'network') {
              setError('Netwerkfout. Controleer je internetverbinding.')
            }
          }

          recognition.onend = () => {
            console.log('🎤 Voice recognition ended')
            setIsListening(false)
            setInterimTranscript('')
          }
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onTranscript])

  const startListening = () => {
    if (recognitionRef.current && !isListening && !isDisabled) {
      setTranscript('')
      setInterimTranscript('')
      setError('')
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('Failed to start recognition:', error)
        setError('Kon spraakherkenning niet starten')
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const clearTranscript = () => {
    setTranscript('')
    setInterimTranscript('')
    setError('')
  }

  if (!isSupported) {
    return (
      <div className={`flex items-center justify-center p-2 ${className}`}>
        <div className="text-xs text-gray-400 flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <span>Spraakherkenning niet ondersteund</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      {/* Voice Input Button */}
      <button
        onClick={toggleListening}
        disabled={isDisabled}
        className={`p-3 rounded-full transition-all duration-200 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse'
            : 'bg-pink-100 hover:bg-pink-200 text-pink-600'
        } ${
          isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
        }`}
        title={isListening ? 'Stop opnemen' : 'Start spraakherkenning'}
      >
        {isListening ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      {/* Status and Transcript Display */}
      {isListening && (
        <div className="max-w-xs p-3 bg-pink-50 border border-pink-200 rounded-lg text-center">
          <div className="flex items-center justify-center space-x-1 mb-2">
            <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <span className="text-xs text-pink-700 ml-2">Luistert...</span>
          </div>
          
          {(transcript || interimTranscript) && (
            <div className="text-sm text-pink-800">
              <div className="font-medium">{transcript}</div>
              {interimTranscript && (
                <div className="italic text-pink-600">{interimTranscript}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="max-w-xs p-2 bg-red-50 border border-red-200 rounded-lg text-center">
          <div className="text-xs text-red-700">{error}</div>
          <button
            onClick={() => setError('')}
            className="text-xs text-red-500 hover:text-red-700 mt-1"
          >
            Sluiten
          </button>
        </div>
      )}

      {/* Instructions */}
      {!isListening && !error && (
        <div className="text-xs text-gray-500 text-center max-w-xs">
          {transcript ? (
            <div className="space-y-1">
              <div>Klik opnieuw om verder te spreken</div>
              <button
                onClick={clearTranscript}
                className="text-pink-500 hover:text-pink-700"
              >
                Wis transcript
              </button>
            </div>
          ) : (
            'Klik op de microfoon om je antwoord in te spreken'
          )}
        </div>
      )}

      {/* Final Transcript Display (when not listening) */}
      {!isListening && transcript && (
        <div className="max-w-xs p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">Opgenomen tekst:</div>
          <div className="text-sm text-gray-800">{transcript}</div>
        </div>
      )}
    </div>
  )
}