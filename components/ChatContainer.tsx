'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'

interface Reaction {
  id: string
  chatId: string
  userId: string
  emoji: string
  user: {
    id: string
    email: string
    name: string | null
  }
}

interface Message {
  id: string
  userId: string
  message: string
  imageUrl?: string | null
  createdAt: string
  user: {
    id: string
    email: string
    name: string | null
    avatarUrl?: string | null
  }
  reactions?: Reaction[]
}

interface ChatContainerProps {
  channelId: string
  userId: string
}

export function ChatContainer({ channelId, userId }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // チャンネルが変更されたらメッセージを再取得
    fetchMessages()
  }, [channelId])

  useEffect(() => {
    // WebSocket接続（/wsパスを使用）
    const ws = new WebSocket('ws://localhost:3000/ws')
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'new_message') {
        // 現在のチャンネルのメッセージのみ追加
        if (data.data.channelId === channelId) {
          setMessages((prev) => [...prev, data.data])
        }
      } else if (data.type === 'reaction_added') {
        // リアクション追加: ローカルstateを更新（スクロール位置を保持）
        setMessages((prev) => prev.map(msg =>
          msg.id === data.data.chatId
            ? { ...msg, reactions: [...(msg.reactions || []), data.data] }
            : msg
        ))
      } else if (data.type === 'reaction_removed') {
        // リアクション削除: ローカルstateを更新（スクロール位置を保持）
        setMessages((prev) => prev.map(msg =>
          msg.id === data.data.chatId
            ? {
                ...msg,
                reactions: (msg.reactions || []).filter(
                  r => !(r.userId === data.data.userId && r.emoji === data.data.emoji)
                )
              }
            : msg
        ))
      } else if (data.type === 'profile_updated') {
        // プロフィール更新: メッセージのユーザー情報を更新
        const updatedUser = data.data
        setMessages((prev) => prev.map(msg =>
          msg.user.id === updatedUser.id
            ? {
                ...msg,
                user: {
                  ...msg.user,
                  name: updatedUser.name,
                  avatarUrl: updatedUser.avatarUrl,
                }
              }
            : msg
        ))
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
    }

    // クリーンアップ
    return () => {
      ws.close()
    }
  }, [channelId])

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/messages?channelId=${channelId}`)
      const data = await res.json()
      setMessages(data.reverse()) // 古い順に表示
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (message: string) => {
    if (!userId || !channelId || !message.trim()) return

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          channelId,
          message: message.trim(),
        }),
      })
      // WebSocketで自動的に更新されるため、fetchMessagesは不要
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleReactionAdd = async (messageId: string, emoji: string) => {
    try {
      await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: messageId,
          userId,
          emoji,
        }),
      })
    } catch (error) {
      console.error('Failed to add reaction:', error)
    }
  }

  const handleReactionRemove = async (messageId: string, emoji: string) => {
    try {
      await fetch(`/api/reactions?chatId=${messageId}&userId=${userId}&emoji=${encodeURIComponent(emoji)}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Failed to remove reaction:', error)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* メッセージ一覧（スクロール可能） */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <MessageList
            messages={messages}
            currentUserId={userId}
            onReactionAdd={handleReactionAdd}
            onReactionRemove={handleReactionRemove}
          />
        )}
      </div>

      {/* メッセージ入力フォーム（下部固定） */}
      <div className="shrink-0">
        <MessageInput onSend={handleSendMessage} disabled={!userId} />
      </div>
    </div>
  )
}
