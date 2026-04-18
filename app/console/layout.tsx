import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PreferencesProvider } from '@/contexts/preferences-context';
import { SystemSettingsProvider } from '@/contexts/system-settings-context';

import { getAppSettings } from '@/lib/queries';
import { auth } from '@/server/auth';
import { api } from '@/trpc/server';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { ConsoleBreadcrumb } from '@/components/console/breadcrumb';
import { Sidebar } from '@/components/console/sidebar';

export async function generateMetadata(): Promise<Metadata> {
  const { appName } = await getAppSettings();

  return {
    title: {
      default: `${appName} Console`,
      template: `%s - ${appName} Console`
    }
  };
}

export default async function ConsoleLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  if (!session.user.admin) {
    redirect('/');
  }

  const settings = await api.settings.getSystem();

  return (
    <SystemSettingsProvider settings={settings}>
      <PreferencesProvider>
        <SidebarProvider>
          <Sidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4!"
              />
              <ConsoleBreadcrumb />
            </header>
            <div className="flex-1 p-6">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </PreferencesProvider>
    </SystemSettingsProvider>
  );
}
