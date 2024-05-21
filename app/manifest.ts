import { MetadataRoute } from 'next';

import { appConfig } from '@/lib/appconfig';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appConfig.product.name,
    short_name: appConfig.product.name,
    description: appConfig.product.description,
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
