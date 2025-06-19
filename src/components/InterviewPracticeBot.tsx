'use client'

import { useState, useRef, useEffect } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import ResponseActions from './ResponseActions'
import VoiceInput from './VoiceInput'

interface InterviewSession {
  jobTitle: string
  company: string
  experience: string
  industry: string
  sessionType: 'general' | 'behavioral' | 'technical' | 'situational'
  interviewerName: string
  intervieweeName: string
}

interface Message {
  id: string
  type: 'user' | 'interviewer'
  content: string
  timestamp: Date
}

const SESSION_TYPES = [
  { 
    id: 'general', 
    name: 'Algemene Vragen', 
    description: 'Standaard sollicitatievragen zoals "Vertel over jezelf"',
    icon: '💬'
  },
  { 
    id: 'behavioral', 
    name: 'Gedragsvragen', 
    description: 'STAR-methode vragen over je ervaring en gedrag',
    icon: '🎭'
  },
  { 
    id: 'technical', 
    name: 'Technische Vragen', 
    description: 'Vakspecifieke en technische competenties',
    icon: '⚙️'
  },
  { 
    id: 'situational', 
    name: 'Situationele Vragen', 
    description: 'Hypothetische scenario\'s en probleemoplossing',
    icon: '🤔'
  }
]

export default function InterviewPracticeBot() {
  const [currentStep, setCurrentStep] = useState<'setup' | 'interview' | 'feedback'>('setup')
  const [session, setSession] = useState<InterviewSession>({
    jobTitle: '',
    company: '',
    experience: '',
    industry: '',
    sessionType: 'general',
    interviewerName: '',
    intervieweeName: ''
  })
  const [messages, setMessages] = useState<Message[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingResponse, setStreamingResponse] = useState('')
  const [questionCount, setQuestionCount] = useState(0)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text')
  const [autoPlayTTS, setAutoPlayTTS] = useState(true) // Auto-play interviewer messages
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingResponse])

  const generateInterviewQuestion = async (isFirstQuestion = false) => {
    setIsLoading(true)
    setIsStreaming(false)
    setStreamingResponse('')

    // Create abort controller for this request
    abortControllerRef.current = new AbortController()

    try {
      let prompt = ''
      
      if (isFirstQuestion) {
        prompt = `Je bent een professionele HR-interviewer${session.interviewerName ? ` genaamd ${session.interviewerName}` : ''} die een sollicitatiegesprek voert. 

KANDIDAAT PROFIEL:
- Naam: ${session.intervieweeName || 'de kandidaat'}
- Functie: ${session.jobTitle}
- Bedrijf: ${session.company}
- Ervaring: ${session.experience}
- Sector: ${session.industry}
- Gesprektype: ${SESSION_TYPES.find(t => t.id === session.sessionType)?.name}

INSTRUCTIES:
1. Begin het gesprek op een vriendelijke, professionele manier
2. Stel jezelf kort voor als interviewer${session.interviewerName ? ` (gebruik je naam ${session.interviewerName})` : ''}
3. Spreek de kandidaat aan met${session.intervieweeName ? ` hun naam (${session.intervieweeName})` : ' hun naam als je die weet'}
4. Stel de eerste vraag passend bij het gekozen gesprektype
5. Houd de vraag realistisch en relevant voor de functie
6. Gebruik een natuurlijke, menselijke toon

Begin nu het sollicitatiegesprek.`
      } else {
        const conversationHistory = messages.slice(-4).map(msg => 
          `${msg.type === 'user' ? (session.intervieweeName || 'Kandidaat') : (session.interviewerName || 'Interviewer')}: ${msg.content}`
        ).join('\n')

        prompt = `Je bent een professionele HR-interviewer${session.interviewerName ? ` genaamd ${session.interviewerName}` : ''} die een sollicitatiegesprek voortzet.

KANDIDAAT PROFIEL:
- Naam: ${session.intervieweeName || 'de kandidaat'}
- Functie: ${session.jobTitle}
- Ervaring: ${session.experience}
- Gesprektype: ${SESSION_TYPES.find(t => t.id === session.sessionType)?.name}

RECENTE CONVERSATIE:
${conversationHistory}

INSTRUCTIES:
1. Reageer kort en professioneel op het laatste antwoord van ${session.intervieweeName || 'de kandidaat'}
2. Stel een nieuwe, relevante vervolgvraag
3. Varieer tussen verschillende vraagtypen binnen het gekozen gesprektype
4. Houd vragen realistisch en passend bij de functie
5. Na 5-7 vragen, begin af te ronden
6. Spreek de kandidaat aan met hun naam waar gepast

${questionCount >= 6 ? `BELANGRIJK: Dit is een van de laatste vragen. Begin het gesprek af te ronden en bedank ${session.intervieweeName || 'de kandidaat'}.` : ''}

Stel nu je volgende vraag.`
      }

      const response = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          aiModel: 'smart'
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Process streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No readable stream available')
      }

      setIsLoading(false)
      setIsStreaming(true)
      let fullResponse = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.error) {
                throw new Error(data.message || 'Streaming error')
              }
              
              if (data.done) {
                setIsStreaming(false)
                // Add interviewer message
                const newMessage: Message = {
                  id: Date.now().toString(),
                  type: 'interviewer',
                  content: fullResponse,
                  timestamp: new Date()
                }
                setMessages(prev => [...prev, newMessage])
                setStreamingResponse('')
                setQuestionCount(prev => prev + 1)
                return
              }
              
              if (data.token) {
                fullResponse += data.token
                setStreamingResponse(fullResponse)
              }
            } catch (parseError) {
              console.error('Error parsing streaming data:', parseError)
            }
          }
        }
      }

    } catch (error: any) {
      console.error('Interview question generation error:', error)
      setIsLoading(false)
      setIsStreaming(false)
      
      if (error.name !== 'AbortError') {
        const errorMessage: Message = {
          id: Date.now().toString(),
          type: 'interviewer',
          content: `Sorry, er ging iets mis. Laten we het gesprek voortzetten. ${session.intervieweeName ? session.intervieweeName + ', k' : 'K'}un je me vertellen wat je motivatie is voor deze functie?`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    }
  }

  const startInterview = async () => {
    if (!session.jobTitle.trim()) {
      alert('Vul alsjeblieft de functietitel in om te beginnen.')
      return
    }

    setCurrentStep('interview')
    setSessionStarted(true)
    setMessages([])
    setQuestionCount(0)
    
    // Generate first question
    await generateInterviewQuestion(true)
  }

  const submitAnswer = async () => {
    if (!currentMessage.trim() || isLoading || isStreaming) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage.trim(),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setCurrentMessage('')

    // Generate next question or end interview
    if (questionCount >= 7) {
      // End interview and show feedback
      setTimeout(() => {
        setCurrentStep('feedback')
      }, 2000)
    } else {
      await generateInterviewQuestion(false)
    }
  }

  const handleVoiceTranscript = (transcript: string) => {
    // Add the transcript to the current message
    setCurrentMessage(prev => prev + (prev ? ' ' : '') + transcript)
  }

  const generateFeedback = async () => {
    setIsLoading(true)
    
    try {
      const conversationHistory = messages.map(msg => 
        `${msg.type === 'user' ? (session.intervieweeName || 'Kandidaat') : (session.interviewerName || 'Interviewer')}: ${msg.content}`
      ).join('\n\n')

      const prompt = `Analyseer dit sollicitatiegesprek en geef constructieve feedback.

GESPREK DETAILS:
- Kandidaat: ${session.intervieweeName || 'Onbekend'}
- Interviewer: ${session.interviewerName || 'Onbekend'}
- Functie: ${session.jobTitle}
- Gesprektype: ${SESSION_TYPES.find(t => t.id === session.sessionType)?.name}

VOLLEDIGE CONVERSATIE:
${conversationHistory}

Geef feedback in deze structuur:

## 🎯 Algemene Indruk
[Korte samenvatting van de prestatie van ${session.intervieweeName || 'de kandidaat'}]

## ✅ Sterke Punten
[3-4 specifieke dingen die goed gingen]

## 🔧 Verbeterpunten
[3-4 concrete suggesties voor verbetering]

## 💡 Tips voor Volgende Keer
[Praktische adviezen voor toekomstige gesprekken]

## 📊 Score: X/10
[Cijfer met korte uitleg]

Houd de feedback constructief, specifiek en motiverend. Spreek ${session.intervieweeName ? session.intervieweeName : 'de kandidaat'} direct aan waar gepast.`

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          aiModel: 'smart'
        })
      })

      if (!response.ok) {
        throw new Error('Feedback generation failed')
      }

      const data = await response.json()
      
      const feedbackMessage: Message = {
        id: Date.now().toString(),
        type: 'interviewer',
        content: data.response,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, feedbackMessage])
    } catch (error) {
      console.error('Feedback generation error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetSession = () => {
    setCurrentStep('setup')
    setSession({
      jobTitle: '',
      company: '',
      experience: '',
      industry: '',
      sessionType: 'general',
      interviewerName: '',
      intervieweeName: ''
    })
    setMessages([])
    setCurrentMessage('')
    setQuestionCount(0)
    setSessionStarted(false)
    setInputMode('text')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitAnswer()
    }
  }

  // Setup Phase
  if (currentStep === 'setup') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Gesprek Instellen
          </h2>
          <div className="text-sm text-gray-500">
            Stap 1 van 3
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Personal Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              👥 Persoonlijke Gegevens
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jouw Naam
                </label>
                <input
                  type="text"
                  value={session.intervieweeName}
                  onChange={(e) => setSession(prev => ({ ...prev, intervieweeName: e.target.value }))}
                  placeholder="bijv. Marije"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">De interviewer zal je bij deze naam aanspreken</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interviewer Naam
                </label>
                <input
                  type="text"
                  value={session.interviewerName}
                  onChange={(e) => setSession(prev => ({ ...prev, interviewerName: e.target.value }))}
                  placeholder="bijv. Bert"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">Naam van de AI interviewer (optioneel)</p>
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Functietitel *
              </label>
              <input
                type="text"
                value={session.jobTitle}
                onChange={(e) => setSession(prev => ({ ...prev, jobTitle: e.target.value }))}
                placeholder="bijv. Marketing Manager"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedrijf
              </label>
              <input
                type="text"
                value={session.company}
                onChange={(e) => setSession(prev => ({ ...prev, company: e.target.value }))}
                placeholder="bijv. TechCorp BV"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Je Ervaring
              </label>
              <select
                value={session.experience}
                onChange={(e) => setSession(prev => ({ ...prev, experience: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">Selecteer ervaring</option>
                <option value="starter">Starter (0-2 jaar)</option>
                <option value="junior">Junior (2-5 jaar)</option>
                <option value="medior">Medior (5-10 jaar)</option>
                <option value="senior">Senior (10+ jaar)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sector
              </label>
              <input
                type="text"
                value={session.industry}
                onChange={(e) => setSession(prev => ({ ...prev, industry: e.target.value }))}
                placeholder="bijv. IT, Marketing, Finance"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Session Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type Gesprek
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SESSION_TYPES.map((type) => (
                <div
                  key={type.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    session.sessionType === type.id
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                  onClick={() => setSession(prev => ({ ...prev, sessionType: type.id as any }))}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">{type.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TTS Settings */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              🔊 Audio Instellingen
            </h3>
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPlayTTS}
                  onChange={(e) => setAutoPlayTTS(e.target.checked)}
                  className="rounded text-pink-600 focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700">
                  Interviewer vragen automatisch uitspreken
                </span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Voor een realistischere gesprekservaring wordt elke vraag van de interviewer voorgelezen.
            </p>
          </div>

          {/* Start Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={startInterview}
              disabled={!session.jobTitle.trim()}
              className="px-8 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              🚀 Start Sollicitatiegesprek
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Interview Phase
  if (currentStep === 'interview') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Sollicitatiegesprek</h2>
              <p className="text-pink-100">
                Uitgever bij {session.company || 'Noordhoff'}
              </p>
              {(session.intervieweeName || session.interviewerName) && (
                <p className="text-pink-200 text-sm mt-1">
                  Kandidaat: {session.intervieweeName || 'Marije'} • Interviewer: {session.interviewerName || 'Bert'}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-pink-100">Vraag</div>
              <div className="text-2xl font-bold">{questionCount}/7</div>
            </div>
          </div>
          
          {/* Audio Settings Toggle */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPlayTTS}
                  onChange={(e) => setAutoPlayTTS(e.target.checked)}
                  className="rounded text-pink-300 focus:ring-pink-400"
                />
                <span className="text-sm text-pink-100">
                  🔊 Auto-play interviewer vragen
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl p-4 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-pink-50 text-pink-900 border border-pink-200'
                    : 'bg-gray-50 text-gray-900 border border-gray-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">
                    {message.type === 'user' ? '👤' : '👔'}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">
                      {message.type === 'user' 
                        ? (session.intervieweeName || 'Jij') 
                        : (session.interviewerName || 'Interviewer')
                      }
                    </div>
                    <MarkdownRenderer content={message.content} />
                    
                    {/* TTS for interviewer messages */}
                    {message.type === 'interviewer' && (
                      <div className="mt-3">
                        <ResponseActions 
                          content={message.content}
                          isMarkdown={true}
                          isStreaming={false}
                          autoPlay={autoPlayTTS}
                          className="justify-start"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Streaming Response */}
          {isStreaming && streamingResponse && (
            <div className="flex justify-start">
              <div className="max-w-3xl p-4 rounded-lg bg-gray-50 text-gray-900 border border-gray-200">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">👔</div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">
                      {session.interviewerName || 'Interviewer'}
                    </div>
                    <MarkdownRenderer content={streamingResponse} />
                    <span className="inline-block w-2 h-4 bg-pink-600 animate-pulse ml-1"></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-3xl p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">👔</div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-gray-600 text-sm">
                    {session.interviewerName || 'Interviewer'} denkt na...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-6">
          {/* Input Mode Toggle */}
          <div className="flex justify-center mb-4">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => setInputMode('text')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  inputMode === 'text'
                    ? 'bg-white text-pink-600 shadow-sm'
                    : 'text-gray-600 hover:text-pink-600'
                }`}
              >
                ⌨️ Typen
              </button>
              <button
                onClick={() => setInputMode('voice')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  inputMode === 'voice'
                    ? 'bg-white text-pink-600 shadow-sm'
                    : 'text-gray-600 hover:text-pink-600'
                }`}
              >
                🎤 Spreken
              </button>
            </div>
          </div>

          {inputMode === 'text' ? (
            /* Text Input Mode */
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Typ je antwoord hier... (Enter om te verzenden)"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                  rows={3}
                  disabled={isLoading || isStreaming}
                />
              </div>
              <button
                onClick={submitAnswer}
                disabled={!currentMessage.trim() || isLoading || isStreaming}
                className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading || isStreaming ? '⏳' : '📤'}
              </button>
            </div>
          ) : (
            /* Voice Input Mode */
            <div className="space-y-4">
              <div className="flex justify-center">
                <VoiceInput
                  onTranscript={handleVoiceTranscript}
                  isDisabled={isLoading || isStreaming}
                  className="w-full max-w-md"
                />
              </div>
              
              {/* Voice Transcript Display */}
              {currentMessage && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">Je antwoord:</div>
                  <div className="text-gray-800">{currentMessage}</div>
                  <div className="flex justify-between items-center mt-3">
                    <button
                      onClick={() => setCurrentMessage('')}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      🗑️ Wissen
                    </button>
                    <button
                      onClick={submitAnswer}
                      disabled={!currentMessage.trim() || isLoading || isStreaming}
                      className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      📤 Verstuur Antwoord
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={resetSession}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Terug naar instellingen
            </button>
            <div className="text-sm text-gray-500">
              {questionCount >= 6 ? 'Laatste vragen - gesprek wordt afgerond' : `Nog ${7 - questionCount} vragen te gaan`}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Feedback Phase
  if (currentStep === 'feedback') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Gesprek Voltooid!
          </h2>
          <p className="text-gray-600">
            {session.intervieweeName ? `Goed gedaan, ${session.intervieweeName}!` : 'Goed gedaan!'} Hier is je persoonlijke feedback.
          </p>
        </div>

        {/* Generate Feedback Button */}
        {messages.length === 0 || messages[messages.length - 1].type === 'user' ? (
          <div className="text-center mb-8">
            <button
              onClick={generateFeedback}
              disabled={isLoading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {isLoading ? '⏳ Feedback wordt gegenereerd...' : '📊 Genereer Feedback'}
            </button>
          </div>
        ) : (
          /* Feedback Display */
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <MarkdownRenderer content={messages[messages.length - 1].content} />
              
              <ResponseActions 
                content={messages[messages.length - 1].content}
                isMarkdown={true}
                isStreaming={false}
                className="mt-4"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          <button
            onClick={resetSession}
            className="px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-colors"
          >
            🔄 Nieuw Gesprek
          </button>
          <button
            onClick={() => {
              setCurrentStep('interview')
              setMessages([])
              setQuestionCount(0)
              generateInterviewQuestion(true)
            }}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            🔁 Zelfde Instellingen
          </button>
        </div>
      </div>
    )
  }

  return null
}