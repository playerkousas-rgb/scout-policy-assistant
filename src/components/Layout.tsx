'use client'

import { useState } from 'react'
import Chat from './Chat'
import Upload from './Upload'
import Embed from './Embed'

type Tab = 'chat' | 'upload' | 'embed'

export default function Layout() {
  const [activeTab, setActiveTab] = useState<Tab>('chat')

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 頂部標題 */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">🏕️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">童軍政策助理</h1>
              <p className="text-xs text-gray-500">Scout Policy Assistant</p>
            </div>
          </div>
          
          {/* 狀態指示 */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>系統正常</span>
          </div>
        </div>
      </header>

      {/* 分頁導航 */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-5 py-4 font-medium transition border-b-2 ${
                activeTab === 'chat'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              💬 問答
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-5 py-4 font-medium transition border-b-2 ${
                activeTab === 'upload'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              📤 上傳文件
            </button>
            <button
              onClick={() => setActiveTab('embed')}
              className={`px-5 py-4 font-medium transition border-b-2 ${
                activeTab === 'embed'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              🔄 向量化
            </button>
          </nav>
        </div>
      </div>

      {/* 主要內容 */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'chat' && (
          <div className="bg-white rounded-2xl shadow-lg h-[600px] overflow-hidden">
            <Chat />
          </div>
        )}
        
        {activeTab === 'upload' && <Upload />}
        
        {activeTab === 'embed' && <Embed />}
      </main>

      {/* 底部 */}
      <footer className="mt-8 py-4 text-center text-sm text-gray-400">
        <p>香港童軍總會政策助理 | 2026</p>
        <p className="text-xs mt-1">Powered by Supabase + Groq + Cohere</p>
      </footer>
    </div>
  )
}