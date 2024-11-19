export { auth as middleware } from '@/server/auth'

export const config = {
  matcher: [
    '/((?!api|sign-up|_next/static|_next/image|favicon.svg|manifest.webmanifest|.*\\.png$).*)'
  ]
}
