'use client'

import { useState, KeyboardEvent } from 'react'

interface MessageInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isComposing, setIsComposing] = useState(false)

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message)
      setMessage('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // 日本語入力中（変換中）は送信しない
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-gray-200 p-4">
      <div className="flex gap-2">
        <div className="flex-1 border border-gray-300 rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            disabled={disabled}
            placeholder="メッセージを # general に送信"
            className="w-full p-3 resize-none outline-none rounded-lg disabled:bg-gray-100"
            rows={3}
          />
          <div className="px-3 pb-2 flex justify-between items-center">
            <div className="flex gap-2">
              {/* Slack風のアイコンボタン（今回は省略） */}
              <span className="text-xs text-gray-400">
                Enterで送信、Shift+Enterで改行
              </span>
            </div>
            <button
              onClick={handleSend}
              disabled={!message.trim() || disabled}
              className="px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-semibold"
            >
              送信
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
