import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/embedding'
import { getEmbedding } from '@/lib/cohere'
import { generateResponse } from '@/lib/groq'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json()

    if (!question || question.trim() === '') {
      return NextResponse.json(
        { error: '請輸入問題' },
        { status: 400 }
      )
    }

    // 1. 將用戶問題轉成向量
    const queryEmbedding = await getEmbedding(question)

    // 2. 在 Supabase 中搜尋相似內容
    const { data: searchResults, error: searchError } = await supabaseAdmin.rpc(
      'match_documents',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 5,
        project_filter: 'policy'
      }
    )

    // 如果向量搜尋失敗，使用 fallback
    if (searchError || !searchResults || searchResults.length === 0) {
      console.log('Fallback to basic search:', searchError)
      
      // 簡單的全文搜尋作為後備
      const { data: fallbackResults } = await supabaseAdmin
        .from('document_chunks')
        .select('chunk_text, doc_title, source_folder')
        .eq('project', 'policy')
        .limit(5)

      if (!fallbackResults || fallbackResults.length === 0) {
        return NextResponse.json({
          answer: '抱歉，目前資料庫中沒有找到相關內容。請先上傳政策文件。',
          sources: []
        })
      }

      // 簡單的關鍵詞匹配
      const keywords = question.toLowerCase().split(/\s+/)
      const scoredResults = fallbackResults.map(r => {
        const text = r.chunk_text.toLowerCase()
        const score = keywords.filter(k => text.includes(k)).length
        return { ...r, score }
      }).sort((a, b) => b.score - a.score).slice(0, 3)

      const contextTexts = scoredResults.map(r => r.chunk_text)
      const answer = await generateResponse(question, contextTexts)

      return NextResponse.json({
        answer,
        sources: scoredResults.map(r => ({
          title: r.doc_title,
          folder: r.source_folder
        }))
      })
    }

    // 3. 組合相關內容作為上下文
    const contextTexts = searchResults.map((r: any) => r.chunk_text)

    // 4. 送給 Groq 生成回答
    const answer = await generateResponse(question, contextTexts)

    // 5. 返回答案和來源
    return NextResponse.json({
      answer,
      sources: searchResults.map((r: any) => ({
        title: r.doc_title,
        folder: r.source_folder,
        similarity: r.similarity
      }))
    })

  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: '伺服器錯誤，請稍後再試' },
      { status: 500 }
    )
  }
}