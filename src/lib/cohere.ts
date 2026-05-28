// 使用 Cohere API 進行 Embedding
// 在 edge runtime 中延遲初始化

const COHERE_API_URL = 'https://api.cohere.ai/v1/embed'

function getApiKey(): string {
  const key = process.env.COHERE_API_KEY
  if (!key) {
    throw new Error('COHERE_API_KEY is not configured')
  }
  return key
}

export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = getApiKey()
  
  const response = await fetch(COHERE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      texts: [text],
      model: 'embed-multilingual-v3.0',
      input_type: 'search_document',
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Cohere API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.embeddings?.[0] || []
}

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = getApiKey()
  
  const response = await fetch(COHERE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      texts: texts,
      model: 'embed-multilingual-v3.0',
      input_type: 'search_document',
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Cohere API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.embeddings || []
}