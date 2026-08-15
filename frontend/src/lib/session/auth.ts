'use server'

import { logger } from '@lib/logger.ts'
import {
  createSession,
  deleteSession,
  updateSession
} from '@lib/session/session.ts'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

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

export async function validateInviteCode(code: string): Promise<boolean> {
  const response = await fetch(`${BACKEND_URL}/auth/invite/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // eslint-disable-next-line camelcase
    body: JSON.stringify({ invite_code: code })
  })

  return response.ok
}

export async function registerAccount(formData: {
  name: string
  email: string
  password: string
  inviteCode: string
}) {
  const response = await fetch(`${BACKEND_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mail: formData.email,
      user: formData.name,
      password: formData.password,
      // eslint-disable-next-line camelcase
      invite_code: formData.inviteCode
    })
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)

    throw new Error(data?.detail ?? 'Registration failed. Please try again.')
  }

  await signIn({ username: formData.email, password: formData.password })
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

  if (response.ok) {
    await deleteSession()
    redirect('/login')
  } else {
    logger.error('Unauthorized')
  }
}
