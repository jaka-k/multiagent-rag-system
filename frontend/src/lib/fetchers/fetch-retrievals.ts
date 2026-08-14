'use client'

import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth'
import { logger } from '@lib/logger.ts'
import type { RetrievalGroup } from '@mytypes/types'

export const getChatRetrievals = async (chatId: string) => {
  const response = await fetchWithAuth<RetrievalGroup[]>(
    `/api/chat/${chatId}/retrievals`,
    { method: 'GET' }
  )

  if (!response.ok) {
    logger.error(`Failed to fetch retrievals for chat: ${chatId}`)

    return []
  }

  return response.data
}
