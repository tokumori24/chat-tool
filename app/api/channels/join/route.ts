import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// チャンネルに参加
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channelId, userId } = body

    if (!channelId || !userId) {
      return NextResponse.json(
        { error: 'channelId and userId are required' },
        { status: 400 }
      )
    }

    // すでに参加しているか確認
    const existing = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { message: 'Already a member' },
        { status: 200 }
      )
    }

    // チャンネルに参加
    const member = await prisma.channelMember.create({
      data: {
        channelId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        channel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error joining channel:', error)
    return NextResponse.json(
      { error: 'Failed to join channel' },
      { status: 500 }
    )
  }
}
