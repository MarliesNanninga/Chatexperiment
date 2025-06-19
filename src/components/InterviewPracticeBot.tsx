'use client'

import { useState, useRef, useEffect } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import ResponseActions from './ResponseActions'

interface InterviewSession {
  jobTitle: string
  company: string
  experience: string
  industry: string
  sessionType: 'general' | 'behavioral' | 'technical' | 'situational'
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
    sessionType: 'general'
  })
  const [messages, setMessages] = useState<Message[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingResponse, setStreamingResponse] = useState('')
  const [questionCount, setQuestionCount] = useState(0)
  const [sessionStarted, setSessionStarted] = useState(false)
  
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
        prompt = `Je bent een professionele HR-interviewer die een sollicitatiegesprek voert. 

KANDIDAAT PROFIEL:
- Functie: ${session.jobTitle}
- Bedrijf: ${session.company}
- Ervaring: ${session.experience}
- Sector: ${session.industry}
- Gesprektype: ${SESSION_TYPES.find(t => t.id === session.sessionType)?.name}

INSTRUCTIES:
1. Begin het gesprek op een vriendelijke, professionele manier
2. Stel jezelf kort voor als interviewer
3. Stel de eerste vraag passend bij het gekozen gesprektype
4. Houd de vraag realistisch en relevant voor de functie
5. Gebruik een natuurlijke, menselijke toon

Begin nu het sollicitatiegesprek.`
      } else {
        const conversationHistory = messages.slice(-4).map(msg => 
          `${msg.type === 'user' ? 'Kandidaat' : 'Interviewer'}: ${msg.content}`
        ).join('\n')

        prompt = `Je bent een professionele HR-interviewer die een sollicitatiegesprek voortzet.

KANDIDAAT PROFIEL:
- Functie: ${session.jobTitle}
- Ervaring: ${session.experience}
- Gesprektype: ${SESSION_TYPES.find(t => t.id === session.sessionType)?.name}

RECENTE CONVERSATIE:
${conversationHistory}

INSTRUCTIES:
1. Reageer kort en professioneel op het laatste antwoord van de kandidaat
2. Stel een nieuwe, relevante vervolgvraag
3. Varieer tussen verschillende vraagtypen binnen het gekozen gesprektype
4. Houd vragen realistisch en passend bij de functie
5. Na 5-7 vragen, begin af te ronden

${questionCount >= 6 ? 'BELANGRIJK: Dit is een van de laatste vragen. Begin het gesprek af te ronden en bedank de kandidaat.' : ''}

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
          content: 'Sorry, er ging iets mis. Laten we het gesprek voortzetten. Kun je me vertellen wat je motivatie is voor deze functie?',
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

  const generateFeedback = async () => {
    setIsLoading(true)
    
    try {
      const conversationHistory = messages.map(msg => 
        `${msg.type === 'user' ? 'Kandidaat' : 'Interviewer'}: ${msg.content}`
      ).join('\n\n')

      const prompt = `Analyseer dit sollicitatiegesprek en geef constructieve feedback.

GESPREK DETAILS:
- Functie: ${session.jobTitle}
- Gesprektype: ${SESSION_TYPES.find(t => t.id === session.sessionType)?.name}

VOLLEDIGE CONVERSATIE:
${conversationHistory}

Geef feedback in deze structuur:

## 🎯 Algemene Indruk
[Korte samenvatting van de prestatie]

## ✅ Sterke Punten
[3-4 specifieke dingen die goed gingen]

## 🔧 Verbeterpunten
[3-4 concrete suggesties voor verbetering]

## 💡 Tips voor Volgende Keer
[Praktische adviezen voor toekomstige gesprekken]

## 📊 Score: X/10
[Cijfer met korte uitleg]

Houd de feedback constructief, specifiek en motiverend.`

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
      sessionType: 'general'
    })
    setMessages([])
    setCurrentMessage('')
    setQuestionCount(0)
    setSessionStarted(false)
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
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-blue-800 mb-6 flex items-center">
          <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
            ⚙️
          </span>
          Gesprek Instellen
        </h2>
        
        <div className="space-y-6">
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
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

          {/* Start Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={startInterview}
              disabled={!session.jobTitle.trim()}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Sollicitatiegesprek</h2>
              <p className="text-blue-100">
                {session.jobTitle} {session.company && `bij ${session.company}`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">Vraag</div>
              <div className="text-2xl font-bold">{questionCount}/7</div>
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
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">
                    {message.type === 'user' ? '👤' : '👔'}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">
                      {message.type === 'user' ? 'Jij' : 'Interviewer'}
                    </div>
                    <MarkdownRenderer content={message.content} />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Streaming Response */}
          {isStreaming && streamingResponse && (
            <div className="flex justify-start">
              <div className="max-w-3xl p-4 rounded-lg bg-gray-100 text-gray-900">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">👔</div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">Interviewer</div>
                    <MarkdownRenderer content={streamingResponse} />
                    <span className="inline-block w-2 h-4 bg-blue-600 animate-pulse ml-1"></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-3xl p-4 rounded-lg bg-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">👔</div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-gray-600 text-sm">Interviewer denkt na...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Typ je antwoord hier... (Enter om te verzenden)"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={isLoading || isStreaming}
              />
            </div>
            <button
              onClick={submitAnswer}
              disabled={!currentMessage.trim() || isLoading || isStreaming}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading || isStreaming ? '⏳' : '📤'}
            </button>
          </div>
          
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
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">
            Gesprek Voltooid!
          </h2>
          <p className="text-gray-600">
            Goed gedaan! Hier is je persoonlijke feedback.
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
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
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