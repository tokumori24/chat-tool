import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // generalチャンネルを取得
    const generalChannel = await prisma.channel.findFirst({
      where: { name: 'general' },
    })

    if (!generalChannel) {
      return NextResponse.json(
        { error: 'General channel not found' },
        { status: 404 }
      )
    }

    // 現在時刻と1時間前の時刻を計算
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // 直近1時間のメッセージを取得
    const messages = await prisma.chat.findMany({
      where: {
        channelId: generalChannel.id,
        createdAt: {
          gte: oneHourAgo,
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

    // メッセージをテキスト形式に整形
    const formattedMessages = messages.map((msg) => ({
      timestamp: msg.createdAt,
      user: msg.user.name || msg.user.email,
      message: msg.message,
    }))

    // 全メッセージを1つのテキストにまとめる
    const summaryText = formattedMessages
      .map((msg) => `${msg.user}: ${msg.message}`)
      .join('\n')

    return NextResponse.json({
      channelId: generalChannel.id,
      channelName: 'general',
      timeRange: {
        start: oneHourAgo,
        end: now,
      },
      messageCount: messages.length,
      messages: formattedMessages,
      summaryText,
    })
  } catch (error) {
    console.error('Error fetching general channel summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch summary' },
      { status: 500 }
    )
  }
}
