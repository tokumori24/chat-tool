import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, channelId, message } = body

    if (!userId || !channelId || !message) {
      return NextResponse.json(
        { error: 'userId, channelId and message are required' },
        { status: 400 }
      )
    }

    const chat = await prisma.chat.create({
      data: {
        userId,
        channelId,
        message,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    })

    // WebSocketで全クライアントに通知
    if (global.wss) {
      global.wss.clients.forEach((client: any) => {
        if (client.readyState === 1) { // OPEN
          client.send(JSON.stringify({ type: 'new_message', data: chat }))
        }
      })
    }

    return NextResponse.json(chat, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const channelId = searchParams.get('channelId')
    const limit = searchParams.get('limit')
    const startTime = searchParams.get('startTime') // ISO 8601形式の日時
    const endTime = searchParams.get('endTime') // ISO 8601形式の日時

    const messages = await prisma.chat.findMany({
      where: {
        ...(userId && { userId }),
        ...(channelId && { channelId }),
        ...(startTime && { createdAt: { gte: new Date(startTime) } }),
        ...(endTime && { createdAt: { lte: new Date(endTime) } }),
        // startTimeとendTimeの両方が指定された場合
        ...(startTime && endTime && {
          createdAt: {
            gte: new Date(startTime),
            lte: new Date(endTime),
          },
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit ? parseInt(limit) : undefined,
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
