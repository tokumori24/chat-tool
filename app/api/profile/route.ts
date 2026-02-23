import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * プロフィール更新API
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, name, avatarUrl } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    })

    // WebSocketで全クライアントにプロフィール更新を通知
    if (global.wss) {
      global.wss.clients.forEach((client: any) => {
        if (client.readyState === 1) { // OPEN
          client.send(JSON.stringify({
            type: 'profile_updated',
            data: updatedUser
          }))
        }
      })
    }

    return NextResponse.json(updatedUser, { status: 200 })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

/**
 * プロフィール取得API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user, { status: 200 })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
