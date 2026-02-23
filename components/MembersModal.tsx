'use client'

import { useState, useEffect } from 'react'

interface Member {
  id: string
  userId: string
  channelId: string
  joinedAt: string
  user: {
    id: string
    email: string
    name: string | null
    avatarUrl?: string | null
  }
}

interface MembersModalProps {
  channelId: string
  onClose: () => void
}

export function MembersModal({ channelId, onClose }: MembersModalProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMembers()
  }, [channelId])

  const fetchMembers = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/channels/members?channelId=${channelId}`)
      const data = await res.json()
      setMembers(data)
    } catch (error) {
      console.error('Failed to fetch members:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">参加者</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* メンバーリスト */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-500">メンバーがいません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                >
                  {/* アバター */}
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                    {member.user.avatarUrl ? (
                      <img
                        src={member.user.avatarUrl}
                        alt={`${member.user.name || 'User'}'s avatar`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{member.user.name?.[0] || member.user.email[0].toUpperCase()}</span>
                    )}
                  </div>

                  {/* 名前 */}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {member.user.name || 'Anonymous'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
