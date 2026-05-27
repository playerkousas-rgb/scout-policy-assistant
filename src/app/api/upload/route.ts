import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getEmbedding } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'general'
    const title = formData.get('title') as string || file.name

    if (!file) {
      return NextResponse.json(
        { error: '請上傳檔案' },
        { status: 400 }
      )
    }

    // 這是一個簡化的上傳處理
    // 實際專案需要：
    // 1. 提取 PDF 文字（需要 Server-Side PDF 解析器）
    // 2. 分段處理
    // 3. 向量化並存入資料庫

    const buffer = await file.arrayBuffer()
    
    // 上傳到 Supabase Storage
    const fileName = `${folder}/${file.name}`
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('policy-docs')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      throw uploadError
    }

    // 獲取公開 URL
    const { data: urlData } = supabaseAdmin
      .storage
      .from('policy-docs')
      .getPublicUrl(fileName)

    return NextResponse.json({
      success: true,
      message: '檔案上傳成功！請手動執行向量化處理。',
      url: urlData.publicUrl,
      fileName: file.name,
      note: 'PDF 文字提取需要在 Server-Side 處理，請使用 pdf-parse 套件。'
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || '上傳失敗' },
      { status: 500 }
    )
  }
}