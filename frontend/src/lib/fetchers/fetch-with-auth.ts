'use server'

import { logger } from '@lib/logger.ts'
import { refreshAccessToken } from '@lib/session/auth.ts'
import camelcaseKeys from 'camelcase-keys'
import { cookies } from 'next/headers'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080'

export type WithRefreshedToken<T> = T & {
  refreshedToken?: string | null
}

export async function fetchWithAuth<T>(
  url: string,
  options: RequestInit = {}
): Promise<WithRefreshedToken<{ ok: boolean; data: T }>> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const refreshToken = cookieStore.get('refreshToken')?.value

  const headers = new Headers(options.headers)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const mergedOptions = {
    ...options,
    headers
  }

  const response = await fetch(`${BACKEND_URL}${url}`, mergedOptions)

  if (response.status === 401 && refreshToken) {
    try {
      const newToken = await refreshAccessToken()

      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`)

        const retryResponse = await fetch(`${BACKEND_URL}${url}`, {
          ...options,
          headers
        })

        try {
          const retryData = await retryResponse.json()
          return {
            ok: retryResponse.ok,
            data: camelcaseKeys(retryData, {
              deep: true
            }),
            refreshedToken: newToken
          }
        } catch (e) {
          logger.error('Error parsing response data in retry:', e)

          return {
            ok: retryResponse.ok,
            data: {} as T,
            refreshedToken: newToken
          }
        }
      }
    } catch (error) {
      logger.error('Error during token refresh:', error)
      throw new Error('Authentication failed')
    }
  }

  try {
    const data = await response.json()
    return {
      ok: response.ok,
      data: camelcaseKeys(data, {
        deep: true
      }),
      refreshedToken: null
    }
  } catch (e) {
    logger.error('Error parsing response data:', e)
    return {
      ok: response.ok,
      data: {} as T,
      refreshedToken: null
    }
  }
}
