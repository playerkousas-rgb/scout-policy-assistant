'use client'

import { useState } from 'react'

interface EmbedResult {
  success: boolean
  text: string
  id?: string
  error?: string
}

export default function Embed() {
  const [text, setText] = useState('')
  const [folder, setFolder] = useState('POR')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState('')
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<EmbedResult[]>([])
  const [batchMode, setBatchMode] = useState(false)
  const [batchContent, setBatchContent] = useState('')

  const folders = [
    { value: 'POR', label: '政策、組織及規條 (POR)' },
    { value: 'circulars/policy', label: '通告 - 政策' },
    { value: 'circulars/admin', label: '通告 - 行政' },
    { value: 'circulars/activity', label: '通告 - 活動' },
    { value: 'forms', label: '表格' },
    { value: 'subsidy', label: '資助' },
    { value: 'general', label: '一般' }
  ]

  const handleSingleEmbed = async () => {
    if (!text.trim()) {
      alert('請輸入內容')
      return
    }

    setProcessing(true)
    setResults([])

    try {
      const response = await fetch('/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chunks: [{
            text: text.trim(),
            folder,
            file: file || 'manual.txt',
            title: title || '手動輸入',
            project: 'policy'
          }]
        })
      })

      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      setResults([{ success: false, text: text.substring(0, 50), error: '請求失敗' }])
    }

    setProcessing(false)
  }

  const handleBatchEmbed = async () => {
    if (!batchContent.trim()) {
      alert('請輸入要向量化的內容')
      return
    }

    setProcessing(true)
    setResults([])

    // 按段落分割（用空行分開）
    const chunks = batchContent
      .split(/\n\n+/)
      .filter(c => c.trim())
      .map(chunk => ({
        text: chunk.trim(),
        folder,
        file: file || 'batch.txt',
        title: title || '批次輸入',
        project: 'policy'
      }))

    if (chunks.length === 0) {
      alert('找不到有效的文字段落')
      setProcessing(false)
      return
    }

    try {
      // 分批處理（每次 50 個）
      const batchSize = 50
      const allResults: EmbedResult[] = []

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize)
        console.log(`Processing ${i + 1} to ${Math.min(i + batchSize, chunks.length)} of ${chunks.length}...`)

        const response = await fetch('/api/embed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chunks: batch })
        })

        const data = await response.json()
        allResults.push(...(data.results || []))
      }

      setResults(allResults)
    } catch (error) {
      console.error('Batch error:', error)
    }

    setProcessing(false)
  }

  return (
    <div className="space-y-6">
      {/* 說明卡片 */}
      <div className="bg-blue-50 rounded-xl p-4">
        <h3 className="font-semibold text-blue-800 mb-2">🔄 向量化說明</h3>
        <p className="text-sm text-blue-700">
          將文件內容轉換成向量存入資料庫，讓問答功能可以搜尋相關內容。
          您可以手動輸入單段文字，或批量貼上多段文字（用空行分隔）。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側：輸入 */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          {/* 模式切換 */}
          <div className="flex gap-2">
            <button
              onClick={() => { setBatchMode(false); setResults([]); }}
              className={`px-4 py-2 rounded-lg transition ${
                !batchMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              單段輸入
            </button>
            <button
              onClick={() => { setBatchMode(true); setResults([]); }}
              className={`px-4 py-2 rounded-lg transition ${
                batchMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              批量輸入
            </button>
          </div>

          {/* 設定 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分類</label>
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {folders.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">來源檔案</label>
              <input
                type="text"
                value={file}
                onChange={(e) => setFile(e.target.value)}
                placeholder="例如：POR_C_20251114.pdf"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">文件標題</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：政策、組織及規條"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 單段輸入 */}
          {!batchMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">內容</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="輸入要向量化的文字內容..."
                rows={8}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}

          {/* 批量輸入 */}
          {batchMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                內容（用空行分隔多段）
              </label>
              <textarea
                value={batchContent}
                onChange={(e) => setBatchContent(e.target.value)}
                placeholder="第一段內容...

第二段內容...

第三段內容..."
                rows={12}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {batchContent.split(/\n\n+/).filter(c => c.trim()).length} 個段落
              </p>
            </div>
          )}

          {/* 按鈕 */}
          <button
            onClick={batchMode ? handleBatchEmbed : handleSingleEmbed}
            disabled={processing || (!text.trim() && !batchContent.trim())}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                處理中...
              </span>
            ) : batchMode ? '批量向量化' : '向量化'}
          </button>
        </div>

        {/* 右側：結果 */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">📊 結果</h3>
          
          {results.length === 0 && !processing && (
            <div className="text-center text-gray-400 py-8">
              <p>尚無結果</p>
            </div>
          )}

          {processing && (
            <div className="text-center text-gray-400 py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p>處理中...</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{result.success ? '✅' : '❌'}</span>
                    <span className="text-sm truncate">{result.text}...</span>
                  </div>
                  {result.error && (
                    <p className="text-xs mt-1">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span>成功：{results.filter(r => r.success).length}</span>
                <span>失敗：{results.filter(r => !r.success).length}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}