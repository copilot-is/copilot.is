export { auth as proxy } from '@/server/auth';

export const config = {
  matcher: [
    '/((?!api|share|privacy|_next/static|_next/image|favicon.svg|manifest.webmanifest|.*\\.png$).*)'
  ]
};
