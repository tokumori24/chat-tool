import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * チャンネルメンバー取得API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json(
        { error: 'channelId is required' },
        { status: 400 }
      )
    }

    const members = await prisma.channelMember.findMany({
      where: {
        channelId,
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
      orderBy: {
        joinedAt: 'asc',
      },
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching channel members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch channel members' },
      { status: 500 }
    )
  }
}
