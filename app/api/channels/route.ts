import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// チャンネル作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, createdById } = body

    if (!name || !createdById) {
      return NextResponse.json(
        { error: 'name and createdById are required' },
        { status: 400 }
      )
    }

    const channel = await prisma.channel.create({
      data: {
        name,
        createdById,
        members: {
          create: {
            userId: createdById, // 作成者を自動的にメンバーに追加
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(channel, { status: 201 })
  } catch (error) {
    console.error('Error creating channel:', error)
    return NextResponse.json(
      { error: 'Failed to create channel' },
      { status: 500 }
    )
  }
}

// チャンネル一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const channels = await prisma.channel.findMany({
      where: userId
        ? {
            members: {
              some: {
                userId,
              },
            },
          }
        : undefined,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            chats: true,
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json(channels)
  } catch (error) {
    console.error('Error fetching channels:', error)
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    )
  }
}
