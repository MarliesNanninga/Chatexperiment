import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  // Add CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  try {
    // Check API key with more detailed logging
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in environment variables')
      console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('GEMINI')))
      return NextResponse.json(
        { 
          error: 'API configuratie ontbreekt. Check Environment Variables.',
          hint: 'Voeg GEMINI_API_KEY toe aan je Netlify environment variables',
          debug: 'GEMINI_API_KEY is not set in environment',
          availableKeys: Object.keys(process.env).filter(key => key.includes('GEMINI'))
        }, 
        { status: 500, headers: corsHeaders }
      )
    }

    console.log('✅ GEMINI_API_KEY found, length:', process.env.GEMINI_API_KEY.length)

    // Parse request data
    const body = await request.json()
    console.log('📨 Received request:', { hasMessage: !!body.message, aiModel: body.aiModel })
    
    const { message, aiModel = 'smart' } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Bericht is vereist' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Input validation
    if (typeof message !== 'string' || message.length > 100000) {
      return NextResponse.json(
        { error: 'Bericht moet een string zijn van maximaal 100.000 karakters' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Select the right model based on aiModel
    const modelName = aiModel === 'pro' ? 'gemini-2.5-pro-preview-06-05' :
                     aiModel === 'smart' ? 'gemini-2.5-flash-preview-05-20' :
                     'gemini-2.0-flash-exp' // internet
    
    console.log('🤖 Using model:', modelName)
    
    try {
      const model = genAI.getGenerativeModel({ model: modelName })

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: message }] }]
      })

      const response = await result.response
      const text = response.text()

      console.log('✅ Generated response length:', text.length)

      return NextResponse.json({ 
        response: text,
        success: true,
        model: modelName
      }, { headers: corsHeaders })

    } catch (geminiError: any) {
      console.error('❌ Gemini API Error:', geminiError)
      
      // Handle specific Gemini errors
      if (geminiError.message?.includes('API_KEY_INVALID')) {
        return NextResponse.json(
          { 
            error: 'Ongeldige API key. Controleer je GEMINI_API_KEY.',
            hint: 'Ga naar https://makersuite.google.com/app/apikey om een nieuwe key aan te maken'
          },
          { status: 401, headers: corsHeaders }
        )
      }
      
      if (geminiError.message?.includes('quota')) {
        return NextResponse.json(
          { 
            error: 'API quota overschreden. Probeer later opnieuw.',
            hint: 'Check je Gemini API usage in Google AI Studio'
          },
          { status: 429, headers: corsHeaders }
        )
      }

      throw geminiError // Re-throw for general error handling
    }

  } catch (error: any) {
    console.error('💥 General API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Er is een fout opgetreden bij het verwerken van je bericht',
        details: errorMessage,
        timestamp: new Date().toISOString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}