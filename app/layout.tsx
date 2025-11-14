import { type Metadata, type Viewport } from 'next';
import Script from 'next/script';

import '@/app/globals.css';

import { env } from '@/lib/env';
import { fontMono, fontSans } from '@/lib/fonts';
import { cn, getAvailableModels } from '@/lib/utils';
import { SettingsProvider } from '@/hooks/use-settings';
import { TRPCReactProvider } from '@/trpc/react';
import { Providers } from '@/components/providers';
import { TailwindIndicator } from '@/components/tailwind-indicator';

export const metadata: Metadata = {
  title: {
    default: `${env.NEXT_PUBLIC_PRODUCT_NAME} - ${env.NEXT_PUBLIC_PRODUCT_SUBTITLE}`,
    template: `%s - ${env.NEXT_PUBLIC_PRODUCT_NAME}`
  },
  description: env.NEXT_PUBLIC_PRODUCT_DESCRIPTION,
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
      {env.UMAMI_SCRIPT_URL && env.UMAMI_WEBSITE_ID && (
        <Script
          defer
          src={env.UMAMI_SCRIPT_URL}
          data-website-id={env.UMAMI_WEBSITE_ID}
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
              defaultSystemSettings={{
                availableModels: getAvailableModels(),
                speechEnabled: env.SPEECH_ENABLED
              }}
              defaultUserSettings={{
                speechModel: env.DEFAULT_SPEECH_MODEL,
                speechVoice: env.DEFAULT_SPEECH_VOICE
              }}
              defaultChatPreferences={{
                model: env.DEFAULT_CHAT_MODEL,
                isReasoning: true
              }}
              defaultVideoPreferences={{
                model: env.DEFAULT_VIDEO_MODEL
              }}
              defaultVoicePreferences={{
                model: env.DEFAULT_VOICE_MODEL,
                voice: 'alloy'
              }}
              defaultImagePreferences={{
                model: env.DEFAULT_IMAGE_MODEL,
                size: '1024x1024',
                aspectRatio: '16:9'
              }}
            >
              {children}
            </SettingsProvider>
            <TailwindIndicator />
          </Providers>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
