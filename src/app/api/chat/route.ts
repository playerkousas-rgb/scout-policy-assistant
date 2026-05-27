import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/embedding'
import { getEmbeddings } from '@/lib/cohere'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const chunks: Array<{
      text: string
      folder: string
      file: string
      title: string
      date?: string
      project?: string
    }> = body.chunks

    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json({ error: '請提供要向量化的內容' }, { status: 400 })
    }

    const results: Array<{ success: boolean; text: string; id?: string; error?: string }> = []
    const batchSize = 96

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const texts = batch.map(c => c.text)

      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}, ${batch.length} chunks...`)

      try {
        const embeddings = await getEmbeddings(texts)

        const insertData = batch.map((item: typeof batch[0], idx: number) => ({
          project: item.project || 'policy',
          source_folder: item.folder,
          source_file: item.file,
          doc_title: item.title,
          doc_date: item.date || null,
          chunk_text: item.text,
          embedding: embeddings[idx]
        }))

        const { data, error } = await supabaseAdmin
          .from('document_chunks')
          .insert(insertData)
          .select('id')

        if (error) {
          console.error('Insert error:', error)
          results.push({ success: false, text: batch[0].text.substring(0, 50), error: error.message })
        } else {
          batch.forEach((item: typeof batch[0], idx: number) => {
            results.push({ success: true, id: data?.[idx]?.id, text: item.text.substring(0, 50) })
          })
        }
      } catch (batchError) {
        const msg = batchError instanceof Error ? batchError.message : 'Unknown error'
        console.error('Batch error:', batchError)
        batch.forEach((item: typeof batch[0]) => {
          results.push({ success: false, text: item.text.substring(0, 50), error: msg })
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
  } catch (error) {
    const msg = error instanceof Error ? error.message : '向量化失敗'
    console.error('Embed error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
