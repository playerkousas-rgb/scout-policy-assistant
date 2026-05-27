import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Embedding 模型（用於將文字轉成向量）
export async function getEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
  const result = await model.embedContent(text)
  // Gemini 的 embedding 是 768 維度
  const embedding = result.embedding?.values || []
  return embedding
}

// LLM 模型（用於生成回答）
export async function generateResponse(
  userQuestion: string,
  context: string[]
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  
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

  const result = await model.generateContent(prompt)
  const response = result.response
  return response.text()
}