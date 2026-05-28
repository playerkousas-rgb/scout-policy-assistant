import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/embedding'
import { getEmbeddings } from '@/lib/cohere'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'general'
    const title = formData.get('title') as string || file.name.replace(/\.(pdf|docx|md)$/i, '')

    if (!file) {
      return NextResponse.json({ error: '請選擇檔案' }, { status: 400 })
    }

    const fileName = file.name.toLowerCase()
    const isPdf = fileName.endsWith('.pdf')
    const isDocx = fileName.endsWith('.docx')
    const isMarkdown = fileName.endsWith('.md')

    if (!isPdf && !isDocx && !isMarkdown) {
      return NextResponse.json({ error: '請上傳 PDF、Word 或 Markdown 檔案' }, { status: 400 })
    }

    // 1. 讀取並提取文字
    const arrayBuffer = await file.arrayBuffer()
    let fullText = ''
    let pageCount = 1

    if (isPdf) {
      // PDF 處理
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
      
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise
      pageCount = pdf.numPages
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .filter((item: any) => item.str)
          .map((item: any) => item.str)
          .join(' ')
        fullText += pageText + '\n\n'
      }
    } else if (isDocx) {
      // Word 處理
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ arrayBuffer })
      fullText = result.value
      pageCount = Math.ceil(fullText.length / 500)
    } else {
      // Markdown 處理 - 最簡單
      const decoder = new TextDecoder('utf-8')
      fullText = decoder.decode(arrayBuffer)
      // Markdown 的 # 標題自然分段
      const sections = fullText.split(/^#+ /m)
      fullText = sections.join('\n\n')
      pageCount = Math.ceil(fullText.length / 500)
    }

    if (!fullText.trim()) {
      return NextResponse.json({ error: '無法從檔案提取文字內容' }, { status: 400 })
    }

    console.log(`Extracted ${fullText.length} characters from ${isPdf ? 'PDF' : isDocx ? 'Word' : 'Markdown'}`)

    // 2. 分段處理
    const chunks = splitIntoChunks(fullText)
    console.log(`Split into ${chunks.length} chunks`)

    // 3. 上傳原始檔案到 Storage
    const storageFileName = `${folder}/${Date.now()}_${file.name}`
    let contentType = 'application/pdf'
    if (isDocx) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    if (isMarkdown) contentType = 'text/markdown'

    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('policy-docs')
      .upload(storageFileName, arrayBuffer, {
        contentType,
        upsert: true
      })

    let storageUrl: string | null = null
    if (!uploadError) {
      const { data: urlData } = supabaseAdmin
        .storage
        .from('policy-docs')
        .getPublicUrl(storageFileName)
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
          results.push({ success: false, error: insertError.message })
        } else {
          batch.forEach(() => results.push({ success: true }))
        }
      } catch (batchError) {
        const msg = batchError instanceof Error ? batchError.message : 'Unknown error'
        batch.forEach(() => results.push({ success: false, error: msg }))
      }
    }

    const successCount = results.filter(r => r.success).length

    return NextResponse.json({
      success: true,
      message: '成功處理！',
      stats: {
        totalPages: pageCount,
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
  
  // 先嘗試按 Markdown 標題分段
  const sections = text.split(/(?=^#{1,6}\s)/m)
  
  if (sections.length > 1 && sections[0].trim() === '') {
    sections.shift() // 移除開頭空段
  }
  
  let currentChunk = ''
  
  for (const section of sections) {
    const trimmed = section.trim()
    if (!trimmed) continue

    // Markdown 標題單獨一個 chunk
    if (/^#{1,6}\s/.test(trimmed)) {
      if (currentChunk.trim()) {
        chunks.push({ text: currentChunk.trim() })
        currentChunk = ''
      }
      // 如果標題內容太長，也分段
      if (trimmed.length > 600) {
        chunks.push({ text: trimmed })
      } else {
        currentChunk = trimmed
      }
    } else if (currentChunk.length + trimmed.length > 600) {
      chunks.push({ text: currentChunk.trim() })
      currentChunk = trimmed
    } else {
      currentChunk += '\n\n' + trimmed
    }
  }
  
  if (currentChunk.trim()) chunks.push({ text: currentChunk.trim() })
  
  // 如果分段太少，按段落再分一次
  if (chunks.length < 3) {
    const paragraphs = text.split(/\n\n+/)
    const newChunks: Array<{ text: string }> = []
    let buffer = ''
    
    for (const p of paragraphs) {
      const trimmed = p.trim()
      if (!trimmed) continue
      
      if (buffer.length + trimmed.length > 600) {
        if (buffer.trim()) newChunks.push({ text: buffer.trim() })
        buffer = trimmed
      } else {
        buffer += '\n\n' + trimmed
      }
    }
    if (buffer.trim()) newChunks.push({ text: buffer.trim() })
    
    return newChunks.length > 0 ? newChunks : chunks
  }
  
  return chunks
}