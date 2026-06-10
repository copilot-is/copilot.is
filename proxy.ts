export { auth as proxy } from '@/server/auth';

export const config = {
  matcher: [
    '/((?!api|share|privacy|artifact-preview-frame|_next/static|_next/image|favicon.svg|manifest.webmanifest|.*\\.png$).*)'
  ]
};
