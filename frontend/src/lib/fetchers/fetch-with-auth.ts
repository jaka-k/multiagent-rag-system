'use server'

import { logger } from '@lib/logger.ts'
import { refreshAccessToken } from '@lib/session/auth.ts'
import camelcaseKeys from 'camelcase-keys'
import { cookies } from 'next/headers'
import snakecaseKeys from 'snakecase-keys'
import type { CamelCasedPropertiesDeep } from 'type-fest'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

type FetchAuthOptions = Omit<RequestInit, 'body'> & {
  body?: Record<string, unknown>
}

function prepareInit(options: FetchAuthOptions, bearer?: string): RequestInit {
  const { body, headers: incomingHeaders, ...rest } = options
  const headers = new Headers(incomingHeaders)

  if (bearer) {
    headers.set('Authorization', `Bearer ${bearer}`)
  }

  let serializedBody: string | undefined

  if (body !== undefined) {
    serializedBody = JSON.stringify(snakecaseKeys(body, { deep: true }))

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
  }

  return { ...rest, headers, body: serializedBody }
}

export async function fetchWithAuth<T>(
  url: string,
  options: FetchAuthOptions = {}
): Promise<{ ok: boolean; data: CamelCasedPropertiesDeep<T> }> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const refreshToken = cookieStore.get('refreshToken')?.value

  const response = await fetch(
    `${BACKEND_URL}${url}`,
    prepareInit(options, token)
  )

  if (response.status === 401 && refreshToken) {
    try {
      const newToken = await refreshAccessToken()

      if (newToken) {
        const retryResponse = await fetch(
          `${BACKEND_URL}${url}`,
          prepareInit(options, newToken)
        )

        try {
          const retryData = await retryResponse.json()
          return {
            ok: retryResponse.ok,
            data: camelcaseKeys(retryData, {
              deep: true
            }) as CamelCasedPropertiesDeep<T>
          }
        } catch (e) {
          logger.error({ err: e }, 'Error parsing response data in retry')
          return {
            ok: retryResponse.ok,
            data: {} as CamelCasedPropertiesDeep<T>
          }
        }
      }
    } catch (error) {
      logger.error({ err: error }, 'Error during token refresh')
      throw new Error('Authentication failed')
    }
  }

  try {
    const data = await response.json()
    return {
      ok: response.ok,
      data: camelcaseKeys(data, { deep: true }) as CamelCasedPropertiesDeep<T>
    }
  } catch (e) {
    logger.error({ err: e }, 'Error parsing response data')
    return {
      ok: response.ok,
      data: {} as CamelCasedPropertiesDeep<T>
    }
  }
}
