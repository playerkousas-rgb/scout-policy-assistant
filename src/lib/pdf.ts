// PDF 文字提取（用於客戶端）
// 注意：這個簡化版適用於文字型 PDF，掃描 PDF 需要 OCR

export interface PDFChunk {
  text: string
  pageNumber: number
  metadata: {
    title: string
    folder: string
    file: string
  }
}

// 簡化的 PDF 處理（實際專案建議用 Server-Side）
export async function extractTextFromPDF(file: File): Promise<string> {
  // 這是一個佔位實現
  // 實際使用，建議透過 API route 在 Server-Side 處理
  return "PDF content extraction placeholder"
}

// 文字分段（智能分段）
export function splitIntoChunks(text: string, maxChars: number = 500): string[] {
  const chunks: string[] = []
  
  // 按段落分割
  const paragraphs = text.split(/\n\n+/)
  
  let currentChunk = ''
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChars) {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
      }
      currentChunk = paragraph
    } else {
      currentChunk += '\n\n' + paragraph
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}