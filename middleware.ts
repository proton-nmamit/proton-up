import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Fast path: skip expensive processing on router prefetch
  const isPrefetch =
    request.headers.get('next-router-prefetch') ||
    request.headers.get('purpose') === 'prefetch' ||
    request.headers.get('sec-purpose') === 'prefetch' ||
    request.headers.get('x-middleware-prefetch')

  if (isPrefetch) {
    return NextResponse.next()
  }

  // Check for Better Auth session token or Dev session cookie
  const sessionToken =
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('__Secure-better-auth.session_token')?.value ||
    request.cookies.get('proton_dev_user_id')?.value

  const isGuardedRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/member/dashboard')

  if (isGuardedRoute && !sessionToken) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/member/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/member/dashboard/:path*',
  ],
}
