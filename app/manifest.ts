import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  const productName = process.env.PRODUCT_NAME || 'Copilot'
  const description = process.env.PRODUCT_DESCRIPTION || ''

  return {
    name: productName,
    short_name: productName,
    description: description,
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
  }
}
