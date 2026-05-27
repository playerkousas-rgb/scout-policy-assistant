'use client'

import { useState } from 'react'
import Link from 'next/link'

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

export default function AdminPage() {
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
      setError('請選擇 PDF 檔案')
      return
    }

    setUploading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    formData.append('title', title || file.name.replace('.pdf', ''))

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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 頂部 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">⚙️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">管理員介面</h1>
              <p className="text-xs text-gray-500">文件管理</p>
            </div>
          </div>
          
          <Link 
            href="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            返回問答頁面
          </Link>
        </div>
      </header>

      {/* 主要內容 */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-2">📤 上傳政策文件</h2>
          <p className="text-gray-500 mb-6">
            上傳 PDF 檔案，系統會自動提取內容、向量化並存入資料庫
          </p>

          <div className="space-y-6">
            {/* 選擇分類 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文件分類
              </label>
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {folders.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* 文件標題 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                文件標題（選填）
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：童軍旅財政管理指引"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">
                如不填寫，會使用檔案名稱
              </p>
            </div>

            {/* 選擇檔案 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選擇 PDF 檔案
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-4xl mb-3">📄</div>
                  {file ? (
                    <div>
                      <p className="font-medium text-blue-600">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">點擊選擇 PDF 檔案</p>
                  )}
                </label>
              </div>
            </div>

            {/* 上傳按鈕 */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-lg"
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  處理中，請稍候...
                </span>
              ) : (
                '🚀 上傳並處理'
              )}
            </button>

            {/* 進度說明 */}
            {uploading && (
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-medium text-blue-800 mb-2">處理流程：</h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li>1️⃣ 讀取 PDF 檔案</li>
                  <li>2️⃣ 提取文字內容</li>
                  <li>3️⃣ 分割成小段落</li>
                  <li>4️⃣ 轉換為向量（向量化）</li>
                  <li>5️⃣ 存入資料庫</li>
                </ol>
              </div>
            )}

            {/* 成功結果 */}
            {result?.success && (
              <div className="bg-green-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl">✅</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-green-800">上傳成功！</h4>
                    <p className="text-sm text-green-600">文件已可被搜尋</p>
                  </div>
                </div>
                {result.stats && (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-700">{result.stats.totalPages}</div>
                      <div className="text-xs text-gray-500">頁數</div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-700">{result.stats.totalChunks}</div>
                      <div className="text-xs text-gray-500">段落數</div>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-700">{result.stats.stored}</div>
                      <div className="text-xs text-gray-500">已存入</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 錯誤 */}
            {error && (
              <div className="bg-red-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">❌</span>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 提示 */}
        <div className="mt-6 bg-yellow-50 rounded-xl p-4">
          <h4 className="font-medium text-yellow-800 mb-2">💡 提示</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 只支援 PDF 格式（文字型 PDF，掃描檔可能無法處理）</li>
            <li>• 上傳新版本時，會新增記錄而不覆蓋舊記錄</li>
            <li>• 如要更新內容，建議先在問答頁面測試是否正確</li>
          </ul>
        </div>
      </main>
    </div>
  )
}