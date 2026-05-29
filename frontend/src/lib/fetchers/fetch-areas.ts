'use client'

import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth.ts'
import { logger } from '@lib/logger.ts'
import type { Area } from '@mytypes/types.d.ts'

export const getAreas = async () => {
  const response = await fetchWithAuth<Area[]>(`/auth/users/me/areas/`)

  if (!response.ok) {
    logger.error(`Failed to fetch all Areas of user`)
  }

  return response.data
}
