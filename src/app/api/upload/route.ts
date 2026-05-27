import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/embedding'

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

    // 上傳到 Supabase Storage
    const buffer = await file.arrayBuffer()
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
      message: '檔案上傳成功！請在「向量化」頁面將內容轉換成向量。',
      url: urlData.publicUrl,
      fileName: file.name,
      folder: folder
    })

  } catch (error) {
    const msg = error instanceof Error ? error.message : '上傳失敗'
    console.error('Upload error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}