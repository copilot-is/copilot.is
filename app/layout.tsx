import { type Metadata, type Viewport } from 'next';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';

import '@/app/globals.css';

import { env } from '@/lib/env';
import { fontMono, fontSans } from '@/lib/fonts';
import { getAppSettings } from '@/lib/queries';
import { cn } from '@/lib/utils';
import { TRPCReactProvider } from '@/trpc/react';
import { Providers } from '@/components/providers';
import { TailwindIndicator } from '@/components/tailwind-indicator';

export async function generateMetadata(): Promise<Metadata> {
  const { appName, appSubtitle, appDescription } = await getAppSettings();

  return {
    title: {
      default: `${appName} - ${appSubtitle}`,
      template: `%s - ${appName}`
    },
    description: appDescription,
    icons: {
      icon: '/favicon.svg',
      shortcut: '/favicon.png',
      apple: '/apple-touch-icon.png'
    }
  };
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
            {children}
            <TailwindIndicator />
            <Analytics />
          </Providers>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
