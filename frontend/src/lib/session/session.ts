'use server'

import { cookies } from 'next/headers'

const isProduction = process.env.ENVIRONMENT === 'prod'

export async function createSession(token: string, refreshToken: string) {
  const cookieStore = await cookies()
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'none',
    path: '/'
  })
  cookieStore.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'none',
    path: '/'
  })
}

export async function updateSession(newToken: string) {
  const cookieStore = await cookies()
  cookieStore.set('token', newToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'none',
    path: '/'
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('refreshToken')
}
