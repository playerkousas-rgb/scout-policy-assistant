'use client'

import Link from 'next/link'
import Chat from './Chat'

export default function Layout() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#02133E' }}>
      {/* 頂部 */}
      <header className="bg-[#0a1a3a] border-b border-[#1e3a5f]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#2563eb] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">🏕️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">童軍政策助理</h1>
              <p className="text-xs text-gray-400">Scout Policy Assistant</p>
            </div>
          </div>
          
          <Link 
            href="/admin"
            className="text-sm text-gray-400 hover:text-white transition flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-[#1e3a5f]"
          >
            <span>⚙️</span>
            管理
          </Link>
        </div>
      </header>

      {/* 主要內容 */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-[#0a1a3a] rounded-2xl border border-[#1e3a5f] overflow-hidden" style={{ height: '600px' }}>
          <Chat />
        </div>
      </main>

      {/* 底部 */}
      <footer className="py-4 text-center text-sm text-gray-500">
        <p>香港童軍總會政策助理 | 2026</p>
        <p className="text-xs mt-1 opacity-50">Powered by Supabase + Groq + Cohere</p>
      </footer>
    </div>
  )
}