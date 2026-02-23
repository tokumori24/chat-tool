import { NextRequest, NextResponse } from 'next/server'

/**
 * 5分間のチャット内容から画像生成用プロンプトを作成するAPI
 * Ollama llama3:8b モデルを使用
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { summaryText } = body

    if (!summaryText) {
      return NextResponse.json(
        { error: 'summaryText is required' },
        { status: 400 }
      )
    }

    const HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434'
    const TEXT_MODEL = 'llama3:8b'

    // プロンプト生成用の指示
    const systemPrompt = `あなたは会話内容を分析し、その雰囲気や内容を視覚的に表現するイラストのプロンプトを作成する専門家です。

以下のルールに従ってプロンプトを作成してください：
1. 会話の主なテーマや雰囲気を抽出する
2. 会話に登場する人物や物事を特定する
3. 会話の感情（楽しい、真剣、和やか など）を捉える
4. **必ず「青い髪のショートカットの可愛らしい女性キャラクター」を主人公として含める**
5. このキャラクターが会話の内容を表現する行動やポーズを取っている様子を描写する
6. 150文字以内の簡潔な日本語のプロンプトを作成する
7. イラストとして表現可能な具体的な情景を描写する
8. 出力は日本語のプロンプトのみ（説明不要）
9. **プロンプトには必ず「女性」「女の子」などの性別を明示する単語を含める**

例：
会話: "今日は天気がいいですね" "公園に行きましょう" "ピクニックがいいですね"
プロンプト: 青い髪のショートカットの可愛らしい女性が晴れた公園でピクニックを楽しんでいる、明るい表情、鮮やかな色彩、アニメイラスト風、かわいい

会話: "今日の会議は大変だった" "お疲れ様です"
プロンプト: 青い髪のショートカットの可愛らしい女性が仕事の後で疲れた様子、机に座っている、優しい笑顔、温かい照明、アニメイラスト風、かわいい

それでは以下の会話からプロンプトを作成してください：

${summaryText}`

    // Ollama APIにリクエストを送信
    const payload = {
      model: TEXT_MODEL,
      prompt: systemPrompt,
      stream: false,
      options: {
        temperature: 0.7,
        max_tokens: 150,
      }
    }

    console.log('[Prompt Creator] Sending request to Ollama...')
    console.log('[Prompt Creator] Summary Text:', summaryText)

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

    // 生成されたプロンプトを取得
    const generatedPrompt = data.response?.trim() || ''

    if (!generatedPrompt) {
      console.error('[Prompt Creator] No response from Ollama')
      console.error('[Prompt Creator] Response data:', data)
      return NextResponse.json(
        {
          error: 'Failed to generate prompt',
          details: 'Ollama did not return a response'
        },
        { status: 500 }
      )
    }

    console.log('[Prompt Creator] Generated prompt:', generatedPrompt)

    return NextResponse.json({
      prompt: generatedPrompt,
      model: TEXT_MODEL,
      originalSummary: summaryText,
    }, { status: 200 })

  } catch (error) {
    console.error('[Prompt Creator] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to create prompt',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
