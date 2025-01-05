import { type Metadata, type Viewport } from 'next';
import Script from 'next/script';

import '@/app/globals.css';

import { SupportedModels } from '@/lib/constant';
import { env } from '@/lib/env';
import { fontMono, fontSans } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { SettingsProvider } from '@/hooks/use-settings';
import { TRPCReactProvider } from '@/trpc/react';
import { Providers } from '@/components/providers';
import { TailwindColor } from '@/components/tailwind-color';
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
  const defaultModel = env.DEFAULT_MODEL;

  const defaultTTS = {
    enabled: env.OPENAI_ENABLED === 'true' && env.TTS_ENABLED === 'true',
    model: env.TTS_MODEL,
    voice: env.TTS_VOICE
  };

  const availableModels = [
    ...(env.OPENAI_ENABLED === 'true'
      ? SupportedModels.filter(model =>
          env.OPENAI_MODELS
            ? env.OPENAI_MODELS.split(',').includes(model.value)
            : model.provider === 'openai'
        )
      : []),
    ...(env.GOOGLE_ENABLED === 'true'
      ? SupportedModels.filter(model =>
          env.GOOGLE_MODELS
            ? env.GOOGLE_MODELS.split(',').includes(model.value)
            : model.provider === 'google'
        )
      : []),
    ...(env.ANTHROPIC_ENABLED === 'true'
      ? SupportedModels.filter(model =>
          env.ANTHROPIC_MODELS
            ? env.ANTHROPIC_MODELS.split(',').includes(model.value)
            : model.provider === 'anthropic'
        )
      : []),
    ...(env.XAI_ENABLED === 'true'
      ? SupportedModels.filter(model =>
          env.XAI_MODELS
            ? env.XAI_MODELS.split(',').includes(model.value)
            : model.provider === 'xai'
        )
      : []),
    ...(env.DEEPSEEK_ENABLED === 'true'
      ? SupportedModels.filter(model =>
          env.DEEPSEEK_MODELS
            ? env.DEEPSEEK_MODELS.split(',').includes(model.value)
            : model.provider === 'deepseek'
        )
      : [])
  ];

  const generateTitleModels = {
    openai: env.OPENAI_GENERATE_TITLE_MODEL,
    google: env.GOOGLE_GENERATE_TITLE_MODEL,
    anthropic: env.ANTHROPIC_GENERATE_TITLE_MODEL,
    xai: env.XAI_GENERATE_TITLE_MODEL,
    deepseek: env.DEEPSEEK_GENERATE_TITLE_MODEL
  };

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
              defaultTTS={defaultTTS}
              defaultModel={defaultModel}
              availableModels={availableModels}
              generateTitleModels={generateTitleModels}
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
