import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 5分おきに実行されるエンドポイント
 * generalチャンネルの直近5分間のメッセージを取得し、イラスト生成の準備を行う
 *
 * 実行タイミング: 毎時 00分, 05分, 10分, 15分... (5分刻み)
 *
 * 実行方法:
 * - 外部cronサービス（GitHub Actions, Vercel Cron等）から定期的にこのエンドポイントを呼び出す
 * - または、curlコマンドで手動実行: curl -H "Authorization: Bearer development-secret" http://localhost:3000/api/cron/hourly-illustration
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック（本番環境ではAPIキーなどで保護すること）
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET || 'development-secret'

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // generalチャンネルを取得
    const generalChannel = await prisma.channel.findFirst({
      where: { name: 'general' },
    })

    if (!generalChannel) {
      return NextResponse.json(
        { error: 'General channel not found', created: false },
        { status: 404 }
      )
    }

    // 現在時刻と5分前の時刻を計算
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    // 直近5分間のメッセージを取得
    const messages = await prisma.chat.findMany({
      where: {
        channelId: generalChannel.id,
        createdAt: {
          gte: fiveMinutesAgo,
          lte: now,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // メッセージが0件の場合はスキップ
    if (messages.length === 0) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'No messages in the last 5 minutes',
        timeRange: { start: fiveMinutesAgo, end: now },
      })
    }

    // メッセージをテキスト形式に整形
    const summaryText = messages
      .map((msg) => `${msg.user.name || msg.user.email}: ${msg.message}`)
      .join('\n')

    console.log('=== 5-Minute Illustration Summary ===')
    console.log(`Time Range: ${fiveMinutesAgo.toISOString()} - ${now.toISOString()}`)
    console.log(`Message Count: ${messages.length}`)
    console.log('Summary Text:')
    console.log(summaryText)
    console.log('======================================')

    // TODO: ここでOllamaにリクエストを送信してイラスト生成
    // 現在はログ出力のみ

    return NextResponse.json({
      success: true,
      timeRange: {
        start: fiveMinutesAgo,
        end: now,
      },
      messageCount: messages.length,
      summaryText,
      // TODO: 将来的にはイラストのURLを返す
      // illustrationUrl: '...'
    })
  } catch (error) {
    console.error('Error in hourly illustration cron:', error)
    return NextResponse.json(
      { error: 'Failed to process hourly illustration' },
      { status: 500 }
    )
  }
}
