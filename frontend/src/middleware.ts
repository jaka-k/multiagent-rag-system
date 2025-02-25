import { logger } from '@lib/logger.ts'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value || ''
  const { pathname } = req.nextUrl
  const publicRoutes = ['/login']

  if (publicRoutes.includes(pathname)) {
    if (token && pathname === '/login') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  }

  if (!token) {
    logger.info('No token found. Redirecting to /login')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'
  ]
}
