'use client'

import { useState } from 'react'

interface UploadResult {
  success: boolean
  message: string
  url?: string
  note?: string
}

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [folder, setFolder] = useState('general')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)

  const folders = [
    { value: 'POR', label: '政策、組織及規條' },
    { value: 'circulars/policy', label: '通告 - 政策' },
    { value: 'circulars/admin', label: '通告 - 行政' },
    { value: 'circulars/activity', label: '通告 - 活動' },
    { value: 'forms', label: '表格' },
    { value: 'subsidy', label: '資助' },
    { value: 'general', label: '一般' }
  ]

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    formData.append('title', file.name)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: '上傳失敗，請稍後再試'
      })
    }

    setUploading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">📤 上傳政策文件</h3>
      
      <div className="space-y-4">
        {/* 選擇資料夾 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            選擇分類
          </label>
          <select
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {folders.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* 選擇檔案 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            選擇 PDF 檔案
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* 上傳按鈕 */}
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {uploading ? '上傳中...' : '上傳'}
        </button>

        {/* 結果 */}
        {result && (
          <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <p className="font-medium">{result.message}</p>
            {result.url && (
              <p className="text-sm mt-1">檔案連結：{result.url}</p>
            )}
            {result.note && (
              <p className="text-sm mt-1 text-gray-600">ℹ️ {result.note}</p>
            )}
          </div>
        )}
      </div>

      {/* 說明 */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2">📝 使用說明</h4>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>上傳 PDF 檔案到 Storage</li>
          <li>使用 embed API 將檔案內容向量化</li>
          <li>向量化後即可在聊天中使用</li>
        </ol>
      </div>
    </div>
  )
}