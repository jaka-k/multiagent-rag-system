'use client'

import { fetchWithAuth } from '@lib/fetchers/fetch-with-auth.ts'
import { logger } from '@lib/logger.ts'
import type { Area, CreateAreaResponse } from '@mytypes/types.d.ts'

export const getAreas = async () => {
  const response = await fetchWithAuth<Area[]>(`/auth/users/me/areas/`)

  if (!response.ok) {
    logger.error(`Failed to fetch all Areas of user`)
  }

  return response.data
}

export const createArea = async (name: string, color: string) => {
  const response = await fetchWithAuth<CreateAreaResponse>('/api/area', {
    method: 'POST',
    body: { name, color }
  })

  if (!response.ok) {
    logger.error(`Failed to create area: ${JSON.stringify(response.data)}`)
    return null
  }

  return response.data
}
