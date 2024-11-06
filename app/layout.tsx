import { type Metadata, type Viewport } from 'next';
import Script from 'next/script';

import '@/app/globals.css';

import { appConfig } from '@/lib/appconfig';
import { fontMono, fontSans } from '@/lib/fonts';
import { cn, getSupportedModels } from '@/lib/utils';
import { SettingsProvider } from '@/hooks/use-settings';
import { TRPCReactProvider } from '@/trpc/react';
import { Providers } from '@/components/providers';
import { TailwindColor } from '@/components/tailwind-color';
import { TailwindIndicator } from '@/components/tailwind-indicator';

export const metadata: Metadata = {
  metadataBase: appConfig.product.url
    ? new URL(appConfig.product.url)
    : process.env.VERCEL_URL
      ? new URL(`https://${process.env.VERCEL_URL}`)
      : new URL(`http://localhost:${process.env.PORT || 3000}`),
  title: {
    default: `${appConfig.product.name} - ${appConfig.product.subtitle}`,
    template: `%s - ${appConfig.product.name}`
  },
  description: appConfig.product.description,
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.png',
    apple: '/apple-touch-icon.png'
  }
};

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
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      {appConfig.umami.scriptURL && appConfig.umami.websiteId && (
        <Script
          defer
          src={appConfig.umami.scriptURL}
          data-website-id={appConfig.umami.websiteId}
        />
      )}
      <body
        className={cn(
          'h-full scroll-smooth font-sans antialiased',
          fontSans.variable,
          fontMono.variable
        )}
      >
        <TRPCReactProvider>
          <Providers attribute="class" defaultTheme="system" enableSystem>
            <SettingsProvider
              defaultTTS={appConfig.tts}
              defaultModel={appConfig.defaultModel}
              availableModels={getSupportedModels(appConfig.availableModels)}
              generateTitleModels={appConfig.generateTitleModels}
              apiCustomEnabled={appConfig.apiCustomEnabled}
              apiProvider={appConfig.apiProvider}
            >
              {children}
            </SettingsProvider>
            <TailwindIndicator />
            <TailwindColor />
          </Providers>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
