'use client'

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

interface MessageListProps {
  messages: Message[]
}

export function MessageList({ messages }: MessageListProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    })
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
      {messages.map((msg) => (
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
            <p className="text-gray-800 mt-1">{msg.message}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
