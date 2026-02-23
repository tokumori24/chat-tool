import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * リアクション追加API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { chatId, userId, emoji } = body

    if (!chatId || !userId || !emoji) {
      return NextResponse.json(
        { error: 'chatId, userId, and emoji are required' },
        { status: 400 }
      )
    }

    // 既存のリアクションがあるかチェック
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        chatId_userId_emoji: {
          chatId,
          userId,
          emoji,
        },
      },
    })

    if (existingReaction) {
      return NextResponse.json(
        { error: 'Reaction already exists' },
        { status: 409 }
      )
    }

    // リアクションを作成
    const reaction = await prisma.reaction.create({
      data: {
        chatId,
        userId,
        emoji,
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
    })

    // WebSocketで全クライアントに通知
    if (global.wss) {
      global.wss.clients.forEach((client: any) => {
        if (client.readyState === 1) { // OPEN
          client.send(JSON.stringify({ type: 'reaction_added', data: reaction }))
        }
      })
    }

    return NextResponse.json(reaction, { status: 201 })
  } catch (error) {
    console.error('Error creating reaction:', error)
    return NextResponse.json(
      { error: 'Failed to create reaction' },
      { status: 500 }
    )
  }
}

/**
 * リアクション削除API
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chatId')
    const userId = searchParams.get('userId')
    const emoji = searchParams.get('emoji')

    if (!chatId || !userId || !emoji) {
      return NextResponse.json(
        { error: 'chatId, userId, and emoji are required' },
        { status: 400 }
      )
    }

    // リアクションを削除
    const deleted = await prisma.reaction.delete({
      where: {
        chatId_userId_emoji: {
          chatId,
          userId,
          emoji,
        },
      },
    })

    // WebSocketで全クライアントに通知
    if (global.wss) {
      global.wss.clients.forEach((client: any) => {
        if (client.readyState === 1) { // OPEN
          client.send(JSON.stringify({
            type: 'reaction_removed',
            data: { chatId, userId, emoji }
          }))
        }
      })
    }

    return NextResponse.json({ message: 'Reaction deleted' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting reaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete reaction' },
      { status: 500 }
    )
  }
}
