'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChatContainer } from '@/components/ChatContainer'
import { ChannelList } from '@/components/ChannelList'

interface Channel {
  id: string
  name: string
  createdById: string
  createdAt: string
  _count?: {
    members: number
    chats: number
  }
}

interface User {
  id: string
  email: string
  name: string | null
}

export default function Home() {
  const router = useRouter()
  const [channels, setChannels] = useState<Channel[]>([])
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // ログイン状態を確認
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }

    try {
      const user: User = JSON.parse(userStr)
      setUserId(user.id)
      setIsAuthenticated(true)

      // generalチャンネルを確保（なければ作成、あれば参加）
      ensureGeneralChannel(user.id)

      // チャンネル一覧を取得
      fetchChannels(user.id)
    } catch (error) {
      console.error('Failed to parse user data:', error)
      router.push('/login')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ensureGeneralChannel = async (uid: string) => {
    try {
      // generalチャンネルを検索
      const res = await fetch('/api/channels')
      const allChannels = await res.json()
      let generalChannel = allChannels.find((ch: Channel) => ch.name === 'general')

      // generalチャンネルがなければ作成
      if (!generalChannel) {
        const createRes = await fetch('/api/channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'general',
            createdById: uid,
          }),
        })
        generalChannel = await createRes.json()
      } else {
        // すでにあるgeneralチャンネルに参加
        await fetch('/api/channels/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId: generalChannel.id,
            userId: uid,
          }),
        })
      }
    } catch (error) {
      console.error('Failed to ensure general channel:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  const fetchChannels = async (uid?: string) => {
    try {
      const url = uid ? `/api/channels?userId=${uid}` : '/api/channels'
      const res = await fetch(url)
      const data = await res.json()
      setChannels(data)

      // チャンネルがあれば最初のチャンネルを選択
      if (data.length > 0 && !currentChannelId) {
        setCurrentChannelId(data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error)
    }
  }

  const handleCreateChannel = async (name: string) => {
    if (!userId) return

    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          createdById: userId,
        }),
      })

      if (res.ok) {
        const newChannel = await res.json()
        setChannels([...channels, newChannel])
        setCurrentChannelId(newChannel.id)
      }
    } catch (error) {
      console.error('Failed to create channel:', error)
    }
  }

  const currentChannel = channels.find((ch) => ch.id === currentChannelId) || null

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[#1a1d21]">
      {/* サイドバー（Slack風） */}
      <div className="w-64 bg-[#3f0e40] text-white flex flex-col">
        <div className="p-4 border-b border-[#522653]">
          <h1 className="text-xl font-bold">Chat App</h1>
        </div>
        <ChannelList
          channels={channels}
          currentChannelId={currentChannelId}
          onSelectChannel={setCurrentChannelId}
          onCreateChannel={handleCreateChannel}
        />
      </div>

      {/* メインチャットエリア */}
      <div className="flex-1 flex flex-col">
        {/* ヘッダー */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <h2 className="text-lg font-bold text-gray-900">
            # {currentChannel?.name || '...'}
          </h2>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
          >
            ログアウト
          </button>
        </div>

        {/* チャットコンテナ */}
        {currentChannelId && userId ? (
          <ChatContainer channelId={currentChannelId} userId={userId} />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <p className="text-gray-500">Loading...</p>
          </div>
        )}
      </div>
    </div>
  )
}
