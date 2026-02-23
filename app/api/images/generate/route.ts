import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      )
    }

    const HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434'
    const MODEL = process.env.OLLAMA_IMAGE_MODEL || 'x/flux2-klein:latest'

    // Ollama APIに画像生成リクエストを送信
    const payload = {
      model: MODEL,
      prompt: prompt,
      stream: false,
    }

    const response = await fetch(`${HOST}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // 画像データの取得（単数形 "image" または複数形 "images" に対応）
    const imageData = data.image || (data.images && data.images[0])

    if (!imageData) {
      console.error('No image returned from Ollama')
      console.error('Response keys:', Object.keys(data))
      console.error('done_reason:', data.done_reason)
      return NextResponse.json(
        {
          error: 'No image generated',
          details: 'Ollama did not return image data. Check if the model supports image generation.',
          responseKeys: Object.keys(data)
        },
        { status: 500 }
      )
    }

    // base64画像データを返す
    return NextResponse.json({
      image: imageData,
      model: data.model,
      prompt: prompt,
    }, { status: 200 })

  } catch (error) {
    console.error('Error generating image:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
