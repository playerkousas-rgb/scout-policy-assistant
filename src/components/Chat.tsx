'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: { title: string; folder: string; similarity?: number }[]
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input })
      })

      const data = await response.json()

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `錯誤：${data.error}`
        }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.answer,
          sources: data.sources
        }])
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，發生錯誤，請稍後再試。'
      }])
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 訊息列表 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
            <div className="text-5xl mb-4">🏕️</div>
            <p className="text-lg font-medium text-white">童軍政策助理</p>
            <p className="text-sm mt-2 text-gray-500">
              請輸入關於政策、指引、表格或資助的問題
            </p>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                message.role === 'user'
                  ? 'bg-[#2563eb] text-white'
                  : 'bg-[#1e3a5f] text-gray-100'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              
              {message.sources && message.sources.length > 0 && (
                <div className={`mt-4 pt-3 border-t ${
                  message.role === 'user' ? 'border-blue-400/30' : 'border-gray-600'
                }`}>
                  <p className="text-xs opacity-60 mb-2">📚 資料來源：</p>
                  {message.sources.map((source, i) => (
                    <div key={i} className="text-xs opacity-60">
                      • {source.title}
                      {source.folder && ` (${source.folder})`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1e3a5f] rounded-2xl px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-400">思考中...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 輸入框 */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-[#1e3a5f] bg-[#0a1a3a]">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="輸入您的問題..."
            className="flex-1 px-5 py-3 bg-[#02133E] border border-[#1e3a5f] rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-8 py-3 bg-[#2563eb] text-white rounded-full hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed transition font-medium shadow-lg shadow-blue-900/30"
          >
            送出
          </button>
        </div>
      </form>
    </div>
  )
}