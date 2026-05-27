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
        const insertData = batch.map((chunk, idx) => ({
          project: chunk.project || 'policy',
          source_folder: chunk.folder,
          source_file: chunk.file,
          doc_title: chunk.title,
          doc_date: chunk.date || null,
          chunk_text: chunk.text,
          embedding: embeddings[idx]
        }))

        const { data, error } = await supabaseAdmin
          .from('document_chunks')
          .insert(insertData)
          .select('id')

        if (error) {
          console.error('Insert error:', error)
          results.push({ 
            success: false, 
            text: chunk.text.substring(0, 50), 
            error: error.message 
          })
        } else {
          results.push({ 
            success: true, 
            id: data?.[0]?.id, 
            text: chunk.text.substring(0, 50) 
          })
        }
      } catch (batchError: any) {
        console.error('Batch error:', batchError)
        batch.forEach(chunk => {
          results.push({ 
            success: false, 
            text: chunk.text.substring(0, 50), 
            error: batchError.message 
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

  } catch (error: any) {
    console.error('Embed error:', error)
    return NextResponse.json(
      { error: error.message || '向量化失敗' },
      { status: 500 }
    )
  }
}