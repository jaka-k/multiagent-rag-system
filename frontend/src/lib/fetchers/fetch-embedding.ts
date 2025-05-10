import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth.ts'
import { CreateDocumentRequest, CreateDocumentResponse } from '@mytypes/types'

export async function createDocument(
  request: CreateDocumentRequest
): Promise<CreateDocumentResponse> {
  const response = await fetchWithAuth<CreateDocumentResponse>(
    '/api/epub-upload',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    }
  )

  if (!response.ok) {
    throw Error(`Could not create document reference: ${response.data.message}`)
  }

  return response.data
}

export async function createVectorEmbedding(
  docId: string
): Promise<{ ok: boolean; data: { message: string; id: string } }> {
  return fetchWithAuth<{ message: string; id: string }>(
    `/api/embedding/${docId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
}
