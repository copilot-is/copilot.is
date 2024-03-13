export { auth as middleware } from '@/server/auth'

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.svg|manifest.webmanifest|.*\\.png$).*)'
  ]
}
