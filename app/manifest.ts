import { MetadataRoute } from 'next';

import { env } from '@/lib/env';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: env.NEXT_PUBLIC_PRODUCT_NAME,
    short_name: env.NEXT_PUBLIC_PRODUCT_NAME,
    description: env.NEXT_PUBLIC_PRODUCT_DESCRIPTION,
    scope: '/',
    start_url: '/?utm_source=pwa',
    display: 'standalone',
    background_color: '#fff',
    theme_color: '#fff',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  };
}
