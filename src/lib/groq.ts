import Groq from 'groq-sdk'

// 在 Vercel edge runtime 中可能無法在模組載入時取得環境變數
let groqInstance: Groq | null = null

function getGroq(): Groq {
  if (!groqInstance) {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      // 回傳一個假的 client，實際請求時會失敗（但可以通過 TypeScript 檢查）
      throw new Error('GROQ_API_KEY is not configured')
    }
    groqInstance = new Groq({ apiKey })
  }
  return groqInstance
}

// LLM 模型（用於生成回答）
export async function generateResponse(
  userQuestion: string,
  context: string[]
): Promise<string> {
  const prompt = `
你是香港童軍總會的政策及指引助理，專門回答關於童軍政策、組織及規條的問題。

請根據以下提供的資料回答用戶問題。如果資料不足，請說明無法從現有文件中找到答案。

---
相關文件內容：
${context.map((ctx, i) => `[${i + 1}] ${ctx}`).join('\n\n')}

---
用戶問題：${userQuestion}

請用繁體中文回答，並在回答末尾標明資料來源（如：[1] 來自 POR 規條 2.1）。
`

  try {
    const groq = getGroq()
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: '你是香港童軍總會的政策及指引助理，專門回答關於童軍政策、組織及規條的問題。回答使用繁體中文。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 1024,
    })

    return completion.choices[0]?.message?.content || '抱歉，無法生成回答。'
  } catch (error) {
    if (error instanceof Error && error.message.includes('GROQ_API_KEY')) {
      throw error
    }
    return '抱歉，AI 服务暂时不可用，请稍后再试。'
  }
}