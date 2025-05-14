import { logger } from '@lib/logger.ts'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const refreshToken = req.cookies.get('refreshToken')?.value
  const { pathname } = req.nextUrl
  const publicRoutes = ['/login']

  if (publicRoutes.includes(pathname)) {
    if (refreshToken && pathname === '/login') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  }

  if (!refreshToken) {
    logger.info('No refresh token found. Redirecting to /login')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/|auth/|docs/|_next/|favicon.ico|sitemap.xml|robots.txt).*)'
  ]
}
