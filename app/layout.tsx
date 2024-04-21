import { type Metadata, type Viewport } from 'next'
import Script from 'next/script'
import { Toaster } from 'react-hot-toast'

import '@/app/globals.css'

import { cn } from '@/lib/utils'
import { appConfig } from '@/lib/appconfig'
import { fontMono, fontSans } from '@/lib/fonts'
import { TailwindIndicator } from '@/components/tailwind-indicator'
import { Providers } from '@/components/providers'
import { TRPCReactProvider } from '@/trpc/react'

export const metadata: Metadata = {
  metadataBase: process.env.VERCEL_URL
    ? new URL(`https://${process.env.VERCEL_URL}`)
    : appConfig.product.url
      ? new URL(appConfig.product.url)
      : undefined,
  title: {
    default: `${appConfig.product.name} - ${appConfig.product.subtitle}`,
    template: `%s - ${appConfig.product.subtitle}`
  },
  description: appConfig.product.description,
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.png',
    apple: '/apple-touch-icon.png'
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' }
  ],
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      {appConfig.umami.scriptURL && appConfig.umami.websiteId && (
        <Script
          defer
          src={appConfig.umami.scriptURL}
          data-website-id={appConfig.umami.websiteId}
        />
      )}
      <body
        className={cn(
          'font-sans antialiased',
          fontSans.variable,
          fontMono.variable
        )}
      >
        <TRPCReactProvider>
          <Toaster
            toastOptions={{
              style: {
                maxWidth: 356,
                wordBreak: 'break-all'
              }
            }}
          />
          <Providers attribute="class" defaultTheme="system" enableSystem>
            {children}
            <TailwindIndicator />
          </Providers>
        </TRPCReactProvider>
      </body>
    </html>
  )
}
