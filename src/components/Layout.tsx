'use client'

import { useState } from 'react'
import Link from 'next/link'
import Chat from './Chat'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 頂部 */}
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
          
          <Link 
            href="/admin"
            className="text-sm text-gray-500 hover:text-gray-700 transition flex items-center gap-1"
          >
            <span>⚙️</span>
            管理
          </Link>
        </div>
      </header>

      {/* 主要內容 */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg h-[600px] overflow-hidden">
          <Chat />
        </div>
      </main>

      {/* 底部 */}
      <footer className="mt-8 py-4 text-center text-sm text-gray-400">
        <p>香港童軍總會政策助理 | 2026</p>
        <p className="text-xs mt-1">Powered by Supabase + Groq + Cohere</p>
      </footer>
    </div>
  )
}