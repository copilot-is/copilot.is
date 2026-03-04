import { MetadataRoute } from 'next';

import { getAppSettings } from '@/lib/queries';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { appName, appDescription } = await getAppSettings();

  return {
    name: appName,
    short_name: appName,
    description: appDescription,
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
