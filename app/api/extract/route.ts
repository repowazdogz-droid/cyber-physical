import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

async function callModel(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return JSON.stringify({
      status: 'refused',
      refusal_reason: 'OPENAI_API_KEY environment variable is not set',
    })
  }

  const openai = new OpenAI({ apiKey })

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return JSON.stringify({
        status: 'refused',
        refusal_reason: 'Model returned empty response',
      })
    }

    // Strip ```json fences if present
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    return cleaned
  } catch (error) {
    return JSON.stringify({
      status: 'refused',
      refusal_reason: error instanceof Error ? error.message : 'Model API call failed',
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { systemPrompt, userPrompt, modeId } = body

    if (!systemPrompt || !userPrompt || !modeId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Single model call as per requirements
    const modelResponse = await callModel(systemPrompt, userPrompt)

    // Parse JSON response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(modelResponse)
    } catch (parseError) {
      return NextResponse.json(
        {
          status: 'refused',
          refusal_reason: 'Model response is not valid JSON',
        },
        { status: 200 }
      )
    }

    // Ensure mode is set
    if (parsedResponse.status === 'complete' && !parsedResponse.mode) {
      parsedResponse.mode = modeId
    }

    return NextResponse.json(parsedResponse)
  } catch (error) {
    return NextResponse.json(
      {
        status: 'refused',
        refusal_reason: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    )
  }
}
