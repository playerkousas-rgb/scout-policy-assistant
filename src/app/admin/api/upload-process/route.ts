import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/embedding'
import { getEmbeddings } from '@/lib/cohere'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'general'
    const title = formData.get('title') as string || file.name.replace('.pdf', '')

    if (!file) {
      return NextResponse.json({ error: '請選擇檔案' }, { status: 400 })
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: '請上傳 PDF 檔案' }, { status: 400 })
    }

    // 1. 讀取 PDF 並提取文字
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    const pdfjsLib = await import('pdfjs-dist')
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
    
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise
    let fullText = ''
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .filter((item: any) => item.str)
        .map((item: any) => item.str)
        .join(' ')
      fullText += pageText + '\n\n'
    }

    if (!fullText.trim()) {
      return NextResponse.json({ 
        error: '無法從 PDF 提取文字內容，可能是掃描檔或其他格式' 
      }, { status: 400 })
    }

    console.log(`Extracted ${fullText.length} characters from PDF`)

    // 2. 分段處理
    const chunks = splitIntoChunks(fullText)
    console.log(`Split into ${chunks.length} chunks`)

    // 3. 上傳 PDF 到 Storage
    const fileName = `${folder}/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('policy-docs')
      .upload(fileName, uint8Array, {
        contentType: 'application/pdf',
        upsert: true
      })

    let storageUrl: string | null = null
    if (!uploadError) {
      const { data: urlData } = supabaseAdmin
        .storage
        .from('policy-docs')
        .getPublicUrl(fileName)
      storageUrl = urlData.publicUrl
    }

    // 4. 向量化並存入資料庫
    const results: { success: boolean; error?: string }[] = []
    const batchSize = 50

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}...`)

      try {
        const texts = batch.map(c => c.text)
        const embeddings = await getEmbeddings(texts)

        const insertData = batch.map((chunkItem, idx) => ({
          project: 'policy',
          source_folder: folder,
          source_file: file.name,
          doc_title: title,
          doc_date: new Date().toISOString().split('T')[0],
          chunk_text: chunkItem.text,
          embedding: embeddings[idx]
        }))

        const { error: insertError } = await supabaseAdmin
          .from('document_chunks')
          .insert(insertData)
          .select('id')

        if (insertError) {
          console.error('Insert error:', insertError)
          results.push({ success: false, error: insertError.message })
        } else {
          batch.forEach(() => {
            results.push({ success: true })
          })
        }
      } catch (batchError) {
        const msg = batchError instanceof Error ? batchError.message : 'Unknown error'
        console.error('Batch error:', batchError)
        batch.forEach(() => {
          results.push({ success: false, error: msg })
        })
      }
    }

    const successCount = results.filter(r => r.success).length

    return NextResponse.json({
      success: true,
      message: '成功處理！',
      stats: {
        totalPages: pdf.numPages,
        totalChunks: chunks.length,
        stored: successCount,
        storageUrl
      }
    })

  } catch (error) {
    const msg = error instanceof Error ? error.message : '處理失敗'
    console.error('Upload process error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function splitIntoChunks(text: string): Array<{ text: string }> {
  const chunks: Array<{ text: string }> = []
  const paragraphs = text.split(/\n\n+/)
  let currentChunk = ''
  
  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim()
    if (!trimmed) continue

    if (trimmed.length > 800) {
      if (currentChunk.trim()) {
        chunks.push({ text: currentChunk.trim() })
        currentChunk = ''
      }
      const sentences = trimmed.split(/(?<=[。！？])/)
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > 600) {
          if (currentChunk.trim()) {
            chunks.push({ text: currentChunk.trim() })
          }
          currentChunk = sentence
        } else {
          currentChunk += sentence
        }
      }
    } else if (currentChunk.length + trimmed.length > 600) {
      chunks.push({ text: currentChunk.trim() })
      currentChunk = trimmed
    } else {
      currentChunk += '\n\n' + trimmed
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push({ text: currentChunk.trim() })
  }
  
  return chunks
}