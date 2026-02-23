'use client'

import { useState, useRef } from 'react'

interface User {
  id: string
  email: string
  name: string | null
  avatarUrl?: string | null
}

interface ProfileEditModalProps {
  user: User
  onClose: () => void
  onUpdate: (updatedUser: User) => void
}

export function ProfileEditModal({ user, onClose, onUpdate }: ProfileEditModalProps) {
  const [name, setName] = useState(user.name || '')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください')
      return
    }

    // 画像ファイルかチェック
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください')
      return
    }

    // Base64に変換
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: name.trim() || null,
          avatarUrl: avatarPreview,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to update profile')
      }

      const updatedUser = await res.json()

      // localStorageも更新
      localStorage.setItem('user', JSON.stringify(updatedUser))

      onUpdate(updatedUser)
      onClose()
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('プロフィールの更新に失敗しました')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">プロフィール編集</h2>

        <form onSubmit={handleSubmit}>
          {/* アバター */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              アバター画像
            </label>
            <div className="flex items-center gap-4">
              {/* プレビュー */}
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-gray-500">
                    {name?.[0] || user.email[0].toUpperCase()}
                  </span>
                )}
              </div>

              {/* ボタン */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  画像を選択
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                  >
                    削除
                  </button>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-2">
              推奨: 正方形、5MB以下
            </p>
          </div>

          {/* 名前 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              表示名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="名前を入力"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              maxLength={50}
            />
          </div>

          {/* メールアドレス（読み取り専用） */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              type="text"
              value={user.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
            />
          </div>

          {/* ボタン */}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              disabled={isUploading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              disabled={isUploading}
            >
              {isUploading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
