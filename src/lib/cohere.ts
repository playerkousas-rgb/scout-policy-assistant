// 使用 Cohere API 進行 Embedding

const COHERE_API_URL = 'https://api.cohere.ai/v1/embed'

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(COHERE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      texts: [text],
      model: 'embed-multilingual-v3.0',
      input_type: 'search_document',
    })
  })

  if (!response.ok) {
    throw new Error(`Cohere API error: ${response.status}`)
  }

  const data = await response.json()
  return data.embeddings?.[0] || []
}

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetch(COHERE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      texts: texts,
      model: 'embed-multilingual-v3.0',
      input_type: 'search_document',
    })
  })

  if (!response.ok) {
    throw new Error(`Cohere API error: ${response.status}`)
  }

  const data = await response.json()
  return data.embeddings || []
}