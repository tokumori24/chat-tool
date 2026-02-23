'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'

interface Message {
  id: string
  userId: string
  message: string
  createdAt: string
  user: {
    id: string
    email: string
    name: string | null
  }
}

export function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([])
  const [userId, setUserId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // 初回ロード時にユーザーを作成
    createUser()
    // メッセージ一覧を取得
    fetchMessages()

    // WebSocket接続（/wsパスを使用）
    const ws = new WebSocket('ws://localhost:3000/ws')
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'new_message') {
        // 新しいメッセージを受信したら、リストに追加
        setMessages((prev) => [...prev, data.data])
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
  }, [])

  const createUser = async () => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `user${Date.now()}@example.com`,
          name: 'Anonymous User',
        }),
      })
      const user = await res.json()
      setUserId(user.id)
    } catch (error) {
      console.error('Failed to create user:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/messages')
      const data = await res.json()
      setMessages(data.reverse()) // 古い順に表示
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (message: string) => {
    if (!userId || !message.trim()) return

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: message.trim(),
        }),
      })
      // WebSocketで自動的に更新されるため、fetchMessagesは不要
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <MessageList messages={messages} />
        )}
      </div>

      {/* メッセージ入力フォーム */}
      <MessageInput onSend={handleSendMessage} disabled={!userId} />
    </div>
  )
}
