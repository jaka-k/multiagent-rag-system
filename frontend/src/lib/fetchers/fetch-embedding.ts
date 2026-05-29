import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth.ts'
import { CreateDocumentRequest, CreateDocumentResponse } from '@mytypes/types'

export async function createDocument(
  request: CreateDocumentRequest
): Promise<CreateDocumentResponse> {
  const response = await fetchWithAuth<CreateDocumentResponse>(
    '/api/epub-upload',
    {
      method: 'POST',
      body: request
    }
  )

  if (!response.ok) {
    throw Error(`Could not create document reference: ${response.data.message}`)
  }

  return response.data
}

export async function createVectorEmbedding(docId: string) {
  return fetchWithAuth<{ message: string; id: string }>(
    `/api/embedding/${docId}`,
    { method: 'POST' }
  )
}
