'use client'

import { useState } from 'react'

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
  }
  reactions?: Reaction[]
}

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  onReactionAdd: (messageId: string, emoji: string) => void
  onReactionRemove: (messageId: string, emoji: string) => void
}

export function MessageList({ messages, currentUserId, onReactionAdd, onReactionRemove }: MessageListProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)

  const EMOJIS = ['👍', '❤️', '😂', '🎉', '🤔', '👏']

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // リアクションをグループ化（emoji毎にユーザーリストを作成）
  const groupReactions = (reactions?: Reaction[]) => {
    if (!reactions || reactions.length === 0) return {}

    return reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = []
      }
      acc[reaction.emoji].push(reaction)
      return acc
    }, {} as Record<string, Reaction[]>)
  }

  const handleEmojiClick = (messageId: string, emoji: string) => {
    const message = messages.find(m => m.id === messageId)
    const userReaction = message?.reactions?.find(
      r => r.emoji === emoji && r.userId === currentUserId
    )

    if (userReaction) {
      onReactionRemove(messageId, emoji)
    } else {
      onReactionAdd(messageId, emoji)
    }

    setShowEmojiPicker(null)
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">メッセージはありません</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {messages.map((msg) => {
        const groupedReactions = groupReactions(msg.reactions)

        return (
          <div key={msg.id} className="flex gap-3 hover:bg-gray-50 p-2 rounded">
            {/* アバター */}
            <div className="w-9 h-9 rounded bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {msg.user.name?.[0] || 'A'}
            </div>

            {/* メッセージ内容 */}
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-gray-900">
                  {msg.user.name || 'Anonymous'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
              <p className="text-gray-800 mt-1 whitespace-pre-wrap">{msg.message}</p>

              {/* 画像がある場合は表示 */}
              {msg.imageUrl && (
                <div className="mt-2">
                  <img
                    src={msg.imageUrl}
                    alt="Generated illustration"
                    className="max-w-md rounded-lg border border-gray-200 shadow-sm"
                  />
                </div>
              )}

              {/* リアクション表示 */}
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                {Object.entries(groupedReactions).map(([emoji, reactions]) => {
                  const hasUserReacted = reactions.some(r => r.userId === currentUserId)
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiClick(msg.id, emoji)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors ${
                        hasUserReacted
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-gray-100 border border-gray-300 hover:bg-gray-200'
                      }`}
                      title={reactions.map(r => r.user.name || r.user.email).join(', ')}
                    >
                      <span>{emoji}</span>
                      <span className="text-xs font-medium">{reactions.length}</span>
                    </button>
                  )
                })}

                {/* スタンプ追加ボタン */}
                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                    className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm transition-colors"
                  >
                    ➕
                  </button>

                  {/* 絵文字ピッカー */}
                  {showEmojiPicker === msg.id && (
                    <div className="absolute left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2 flex gap-1 z-10">
                      {EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiClick(msg.id, emoji)}
                          className="w-8 h-8 hover:bg-gray-100 rounded flex items-center justify-center text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
