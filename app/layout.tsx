import { type Metadata, type Viewport } from 'next'
import { Toaster } from 'react-hot-toast'

import '@/app/globals.css'

import { cn } from '@/lib/utils'
import { fontMono, fontSans } from '@/lib/fonts'
import { TailwindIndicator } from '@/components/tailwind-indicator'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  metadataBase: new URL(`https://${process.env.VERCEL_URL}`),
  title: {
    default: `${process.env.PRODUCT_NAME} - ${process.env.PRODUCT_SUBTITLE}`,
    template: `%s - ${process.env.PRODUCT_SUBTITLE}`
  },
  description: process.env.PRODUCT_DESCRIPTION,
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png'
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' }
  ]
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'font-sans antialiased',
          fontSans.variable,
          fontMono.variable
        )}
      >
        <Toaster
          toastOptions={{
            style: {
              maxWidth: 350,
              wordBreak: 'break-all'
            }
          }}
        />
        <Providers attribute="class" defaultTheme="system" enableSystem>
          {children}
          <TailwindIndicator />
        </Providers>
      </body>
    </html>
  )
}
