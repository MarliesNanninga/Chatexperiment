import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  try {
    // Check API key with detailed logging
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

    console.log('✅ GEMINI_API_KEY found for streaming, length:', process.env.GEMINI_API_KEY.length)

    // Parse request data
    const body = await request.json()
    console.log('📨 Streaming request received:', { hasMessage: !!body.message, aiModel: body.aiModel })
    
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
    
    console.log('🤖 Using streaming model:', modelName)

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('🚀 Starting content generation stream...')
          
          const model = genAI.getGenerativeModel({ model: modelName })
          const result = await model.generateContentStream({
            contents: [{ role: 'user', parts: [{ text: message }] }]
          })

          console.log('📡 Stream created, processing chunks...')

          // Stream the response token by token
          for await (const chunk of result.stream) {
            const chunkText = chunk.text()
            
            if (chunkText) {
              try {
                const data = JSON.stringify({ 
                  token: chunkText,
                  timestamp: new Date().toISOString()
                })
                
                controller.enqueue(
                  new TextEncoder().encode(`data: ${data}\n\n`)
                )
              } catch (error) {
                console.log('⚠️ Controller already closed, stopping stream')
                break
              }
            }
          }

          // Send completion signal
          try {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ done: true })}\n\n`)
            )
            controller.close()
            console.log('✅ Stream completed successfully')
          } catch (error) {
            console.log('⚠️ Controller already closed during completion')
          }

        } catch (error: any) {
          console.error('💥 Streaming error:', error)
          
          // Handle specific Gemini errors
          let errorMessage = 'Streaming error occurred'
          if (error.message?.includes('API_KEY_INVALID')) {
            errorMessage = 'Ongeldige API key. Controleer je GEMINI_API_KEY.'
          } else if (error.message?.includes('quota')) {
            errorMessage = 'API quota overschreden. Probeer later opnieuw.'
          } else if (error instanceof Error) {
            errorMessage = error.message
          }
          
          const errorData = JSON.stringify({
            error: true,
            message: errorMessage,
            details: error instanceof Error ? error.stack : undefined
          })
          
          try {
            controller.enqueue(
              new TextEncoder().encode(`data: ${errorData}\n\n`)
            )
            controller.close()
          } catch (controllerError) {
            console.log('⚠️ Could not send error to closed controller')
          }
        }
      }
    })

    // Return streaming response with proper headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...corsHeaders
      },
    })

  } catch (error: any) {
    console.error('💥 Streaming API error:', error)
    
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