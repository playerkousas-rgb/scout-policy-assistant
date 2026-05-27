import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/embedding'
import { getEmbeddings } from '@/lib/cohere'

// 批量向量化文檔
export async function POST(request: NextRequest) {
  try {
    const { chunks } = await request.json()

    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json(
        { error: '請提供要向量化的內容' },
        { status: 400 }
      )
    }

    // 批次生成向量（最多 96 個一批，Cohere 限制）
    const results = []
    const batchSize = 96
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const texts = batch.map(c => c.text)
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}, ${batch.length} chunks...`)
      
      try {
        const embeddings = await getEmbeddings(texts)
        
        // 存入資料庫
        const insertData = batch.map((chunkItem, idx) => ({
          project: chunkItem.project || 'policy',
          source_folder: chunkItem.folder,
          source_file: chunkItem.file,
          doc_title: chunkItem.title,
          doc_date: chunkItem.date || null,
          chunk_text: chunkItem.text,
          embedding: embeddings[idx]
        }))

        const { data, error } = await supabaseAdmin
          .from('document_chunks')
          .insert(insertData)
          .select('id')

        if (error) {
          console.error('Insert error:', error)
          // 批量插入失敗，回報第一個chunk的資訊
          results.push({ 
            success: false, 
            text: batch[0]?.text?.substring(0, 50) || 'unknown',
            error: error.message 
          })
        } else {
          // 成功，每個chunk都回報
          batch.forEach((chunkItem, idx) => {
            results.push({ 
              success: true, 
              id: data?.[idx]?.id, 
              text: chunkItem.text.substring(0, 50)
            })
          })
        }
      } catch (batchError: unknown) {
        console.error('Batch error:', batchError)
        const errorMsg = batchError instanceof Error ? batchError.message : 'Unknown error'
        batch.forEach(chunkItem => {
          results.push({ 
            success: false, 
            text: chunkItem.text.substring(0, 50),
            error: errorMsg
          })
        })
      }
    }

    const successCount = results.filter(r => r.success).length

    return NextResponse.json({
      success: true,
      total: chunks.length,
      succeeded: successCount,
      failed: chunks.length - successCount,
      results
    })

  } catch (error: unknown) {
    console.error('Embed error:', error)
    const errorMsg = error instanceof Error ? error.message : '向量化失敗'
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
