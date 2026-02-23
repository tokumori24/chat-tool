'use client'

import { useState } from 'react'

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

interface ChannelListProps {
  channels: Channel[]
  currentChannelId: string | null
  onSelectChannel: (channelId: string) => void
  onCreateChannel: (name: string) => void
}

export function ChannelList({
  channels,
  currentChannelId,
  onSelectChannel,
  onCreateChannel,
}: ChannelListProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')

  const handleCreate = () => {
    if (newChannelName.trim()) {
      onCreateChannel(newChannelName.trim())
      setNewChannelName('')
      setIsCreating(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* チャンネル一覧 */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="px-3 py-2 text-xs font-semibold text-gray-300">
          Channels
        </div>

        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => onSelectChannel(channel.id)}
            className={`w-full px-3 py-1.5 text-left text-sm rounded transition-colors ${
              currentChannelId === channel.id
                ? 'bg-[#1164a3] text-white'
                : 'hover:bg-[#522653] text-white'
            }`}
          >
            # {channel.name}
          </button>
        ))}
      </div>

      {/* チャンネル作成ボタン（下部固定） */}
      <div className="p-2 border-t border-[#522653]">
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-[#522653] rounded text-gray-300"
          >
            + チャンネルを追加
          </button>
        )}

        {/* チャンネル作成フォーム */}
        {isCreating && (
          <div className="px-3 py-2 bg-[#522653] rounded">
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreate()
                } else if (e.key === 'Escape') {
                  setIsCreating(false)
                  setNewChannelName('')
                }
              }}
              placeholder="チャンネル名"
              className="w-full px-2 py-1 text-sm bg-white text-black rounded outline-none"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCreate}
                className="px-3 py-1 text-xs bg-[#1164a3] text-white rounded hover:bg-[#0d4f82]"
              >
                作成
              </button>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setNewChannelName('')
                }}
                className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
