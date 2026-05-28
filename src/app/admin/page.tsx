'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const ADMIN_PASSWORD = '0728'

interface UploadResult {
  success: boolean
  message: string
  stats?: {
    totalPages: number
    totalChunks: number
    stored: number
    storageUrl: string | null
  }
}

// 登入頁面
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('adminLoggedIn', 'true')
      onLogin()
    } else {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#02133E' }}>
      <div className="bg-[#0a1a3a] rounded-2xl border border-[#1e3a5f] p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl">🔒</span>
          </div>
          <h1 className="text-xl font-bold text-white">管理員登入</h1>
          <p className="text-sm text-gray-400">請輸入管理員密碼</p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false) }}
            placeholder="輸入密碼"
            className={`w-full px-4 py-3 border rounded-xl text-center text-lg tracking-widest focus:outline-none focus:ring-2 ${
              error ? 'border-red-500 focus:ring-red-500' : 'border-[#1e3a5f] bg-[#02133E] text-white focus:ring-green-500'
            }`}
            autoFocus
          />
          {error && (
            <p className="text-red-400 text-sm text-center mt-2">密碼錯誤，請重試</p>
          )}
          <button
            type="submit"
            className="w-full mt-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium"
          >
            登入
          </button>
        </form>
      </div>
    </div>
  )
}

// 上傳頁面
function UploadPage({ onLogout }: { onLogout: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [folder, setFolder] = useState('POR')
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const folders = [
    { value: 'POR', label: '📜 政策、組織及規條' },
    { value: 'circulars/policy', label: '📋 通告 - 政策' },
    { value: 'circulars/admin', label: '📋 通告 - 行政' },
    { value: 'circulars/activity', label: '📋 通告 - 活動' },
    { value: 'forms', label: '📝 表格' },
    { value: 'subsidy', label: '💰 資助' },
    { value: 'general', label: '📁 一般' }
  ]

  const handleUpload = async () => {
    if (!file) {
      setError('請選擇檔案')
      return
    }

    setUploading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    formData.append('title', title || file.name.replace(/\.(pdf|docx|md)$/i, ''))

    try {
      const response = await fetch('/admin/api/upload-process', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '上傳失敗')
      } else {
        setResult(data)
        setFile(null)
        setTitle('')
      }
    } catch (err) {
      setError('網絡錯誤，請稍後再試')
    }

    setUploading(false)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#02133E' }}>
      {/* 頂部 */}
      <header className="bg-[#0a1a3a] border-b border-[#1e3a5f]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">⚙️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">管理員介面</h1>
              <p className="text-xs text-gray-400">文件管理</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="px-4 py-2 text-blue-400 hover:bg-[#1e3a5f] rounded-lg transition"
            >
              返回問答
            </Link>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-gray-400 hover:bg-[#1e3a5f] rounded-lg transition"
            >
              登出
            </button>
          </div>
        </div>
      </header>

      {/* 主要內容 */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-[#0a1a3a] rounded-2xl border border-[#1e3a5f] p-8">
          <h2 className="text-xl font-bold text-white mb-2">📤 上傳政策文件</h2>
          <p className="text-gray-400 mb-6">
            上傳 PDF、Word 或 Markdown 檔案，系統會自動處理
          </p>

          <div className="space-y-6">
            {/* 選擇分類 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                文件分類
              </label>
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="w-full px-4 py-3 bg-[#02133E] border border-[#1e3a5f] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {folders.map(f => (
                  <option key={f.value} value={f.value} style={{ background: '#02133E' }}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* 文件標題 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                文件標題（選填）
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：童軍旅財政管理指引"
                className="w-full px-4 py-3 bg-[#02133E] border border-[#1e3a5f] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 選擇檔案 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                選擇檔案（PDF / Word / Markdown）
              </label>
              <div className="border-2 border-dashed border-[#1e3a5f] rounded-xl p-8 text-center hover:border-blue-500 transition">
                <input
                  type="file"
                  accept=".pdf,.docx,.md"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-4xl mb-3">📄</div>
                  {file ? (
                    <div>
                      <p className="font-medium text-blue-400">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">點擊選擇檔案</p>
                  )}
                </label>
              </div>
            </div>

            {/* 上傳按鈕 */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition font-medium text-lg"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  處理中...
                </span>
              ) : (
                '🚀 上傳並處理'
              )}
            </button>

            {uploading && (
              <div className="bg-[#1e3a5f] rounded-xl p-4">
                <h4 className="font-medium text-blue-300 mb-2">處理流程：</h4>
                <ol className="text-sm text-gray-400 space-y-1">
                  <li>1️⃣ 讀取檔案</li>
                  <li>2️⃣ 提取文字內容</li>
                  <li>3️⃣ 分割成段落</li>
                  <li>4️⃣ 向量化</li>
                  <li>5️⃣ 存入資料庫</li>
                </ol>
              </div>
            )}

            {result?.success && (
              <div className="bg-green-900/30 rounded-xl p-6 border border-green-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl">✅</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-400">上傳成功！</h4>
                    <p className="text-sm text-green-300/70">文件已可被搜尋</p>
                  </div>
                </div>
                {result.stats && (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-[#0a1a3a] rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-400">{result.stats.totalPages}</div>
                      <div className="text-xs text-gray-500">頁數</div>
                    </div>
                    <div className="bg-[#0a1a3a] rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-400">{result.stats.totalChunks}</div>
                      <div className="text-xs text-gray-500">段落數</div>
                    </div>
                    <div className="bg-[#0a1a3a] rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-400">{result.stats.stored}</div>
                      <div className="text-xs text-gray-500">已存入</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 rounded-xl p-4 border border-red-700">
                <p className="text-red-400">❌ {error}</p>
              </div>
            )}
          </div>
        </div>

        {/* 提示 */}
        <div className="mt-6 bg-[#0a1a3a] rounded-xl p-4 border border-[#1e3a5f]">
          <h4 className="font-medium text-yellow-400 mb-2">💡 支援格式</h4>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• PDF（文字型 PDF）</li>
            <li>• Word（.docx）</li>
            <li>• Markdown（.md）← 最推薦！處理最穩定</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

// 主元件
export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const loggedIn = sessionStorage.getItem('adminLoggedIn') === 'true'
    setIsLoggedIn(loggedIn)
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem('adminLoggedIn')
    setIsLoggedIn(false)
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />
  }

  return <UploadPage onLogout={handleLogout} />
}