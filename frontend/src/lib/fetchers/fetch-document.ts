'use client'

import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth.ts'
import { logger } from '@lib/logger.ts'
import { updateSession } from '@lib/session/session.ts'
import type { Document } from '@mytypes/types'

export const getDocuments = async (areaId: string) => {
  const response = await fetchWithAuth<Document[]>(
    `/api/area/${areaId}/documents`
  )

  if (!response.ok) {
    logger.error(`Failed to fetch documents for area ${areaId}`)
  }

  if (response.refreshedToken) {
    await updateSession(response.refreshedToken)
  }

  return response.data
}
