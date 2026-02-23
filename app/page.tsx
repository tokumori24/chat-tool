'use client'

import { ChatContainer } from '@/components/ChatContainer'

export default function Home() {
  return (
    <div className="h-screen flex overflow-hidden bg-[#1a1d21]">
      {/* サイドバー（Slack風） */}
      <div className="w-64 bg-[#3f0e40] text-white flex flex-col">
        <div className="p-4 border-b border-[#522653]">
          <h1 className="text-xl font-bold">Chat App</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="px-3 py-2 text-sm font-semibold text-gray-300">
              Channels
            </div>
            <button className="w-full px-3 py-1.5 text-left text-sm hover:bg-[#522653] rounded">
              # general
            </button>
          </div>
        </div>
      </div>

      {/* メインチャットエリア */}
      <div className="flex-1 flex flex-col">
        {/* ヘッダー */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center px-4">
          <h2 className="text-lg font-bold text-gray-900"># general</h2>
        </div>

        {/* チャットコンテナ */}
        <ChatContainer />
      </div>
    </div>
  )
}
