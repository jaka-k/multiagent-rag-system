'use server'

import { logger } from '@lib/logger.ts'
import {
  createSession,
  deleteSession,
  updateSession
} from '@lib/session/session.ts'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080'

export async function signIn(formData: { username: string; password: string }) {
  const { username, password } = formData

  const body = new URLSearchParams({
    grant_type: 'password',
    username,
    password
  })

  const response = await fetch(`${BACKEND_URL}/auth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString(),
    credentials: 'include'
  })

  if (response.ok) {
    const data = await response.json()
    // eslint-disable-next-line camelcase
    const { access_token, refresh_token } = data

    await createSession(access_token, refresh_token)

    redirect('/')
  } else {
    throw new Error('Invalid credentials')
  }
}

// eslint-disable-next-line consistent-return
export async function refreshAccessToken() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refreshToken')?.value

  if (!refreshToken) {
    redirect('/login')
  }

  const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      refresh_token: refreshToken
    }),
    credentials: 'include'
  })

  logger.info(`Refresh access token: ${refreshToken}`)

  if (response.ok) {
    const data = await response.json()
    const { access_token: newToken } = data

    await updateSession(newToken)

    return newToken
  }

  await deleteSession()
  redirect('/login')
}

export async function signOut() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  const headers = new Headers()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${BACKEND_URL}/auth/logout`, {
    method: 'POST',
    headers
  })
  console.log('response', response)

  if (response.ok) {
    await deleteSession()
    redirect('/login')
  } else {
    // TODO: handle properly, maybe even toast
    console.log(response)
  }
}
